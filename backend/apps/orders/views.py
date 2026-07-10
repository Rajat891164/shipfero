from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework import generics, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.carriers.models import Carrier, CarrierRate
from apps.merchants.models import Merchant, PickupLocation
from apps.shipments.models import Shipment, ShipmentStatusEvent
from apps.billing.models import Wallet, WalletTransaction
from apps.notifications.models import create_notification
from core.utils import get_merchant

from .models import Order, OrderItem, OrderStatusHistory
from .serializers import (
    OrderListSerializer,
    OrderDetailSerializer,
    CreateOrderSerializer,
    UpdateOrderWeightSerializer,
    BookAWBSerializer,
    BulkProcessSerializer,
)

DEFAULT_WEIGHT_KG = Decimal("0.5")


class OrderListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/orders/ — Paginated orders list with filters
    POST /api/orders/ — Create a manual order
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["order_number", "channel_order_id", "customer_name", "customer_phone"]
    ordering_fields = ["created_at", "order_amount", "status"]
    ordering = ["-created_at"]

    def get_queryset(self):
        merchant = get_merchant(self.request)
        qs = merchant.orders.select_related(
            "assigned_carrier", "shipment", "pickup_location"
        ).prefetch_related("items")

        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter.upper())

        channel = self.request.query_params.get("channel")
        if channel:
            qs = qs.filter(channel_source=channel.upper())

        payment_type = self.request.query_params.get("payment_type")
        if payment_type:
            qs = qs.filter(payment_type=payment_type.upper())

        from_date = self.request.query_params.get("from_date")
        to_date = self.request.query_params.get("to_date")
        if from_date:
            qs = qs.filter(created_at__date__gte=from_date)
        if to_date:
            qs = qs.filter(created_at__date__lte=to_date)

        city = self.request.query_params.get("city")
        if city:
            qs = qs.filter(shipping_city__icontains=city)

        pincode = self.request.query_params.get("pincode")
        if pincode:
            qs = qs.filter(shipping_pincode=pincode)

        is_flagged = self.request.query_params.get("is_flagged")
        if is_flagged is not None:
            qs = qs.filter(is_flagged=is_flagged.lower() in ["true", "1"])

        return qs

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateOrderSerializer
        return OrderListSerializer

    def create(self, request, *args, **kwargs):
        serializer = CreateOrderSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(OrderDetailSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderDetailView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/orders/<id>/ — Full order detail
    PATCH /api/orders/<id>/ — Update basic fields (only NEW/PROCESSING status)
    """
    permission_classes = [IsAuthenticated]
    serializer_class = OrderDetailSerializer
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        return get_merchant(self.request).orders.select_related(
            "assigned_carrier", "shipment", "pickup_location"
        ).prefetch_related("items", "status_history", "customer_detail")

    def partial_update(self, request, *args, **kwargs):
        order = self.get_object()
        if order.status not in [Order.OrderStatus.NEW, Order.OrderStatus.PROCESSING]:
            return Response(
                {"detail": f"Cannot edit order in {order.status} status."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().partial_update(request, *args, **kwargs)


class ProcessOrderView(APIView):
    """
    POST /api/orders/<id>/process/
    Validate weight/dimensions and move order to PROCESSING status.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        merchant = get_merchant(request)
        try:
            order = merchant.orders.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        if order.status != Order.OrderStatus.NEW:
            return Response(
                {"detail": f"Only NEW orders can be processed. Current: {order.status}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not order.is_payment_mapped:
            return Response(
                {"detail": "Payment method not mapped. Map it in Integration settings."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = UpdateOrderWeightSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        old_status = order.status
        order.total_weight = data["total_weight"]
        order.length = data.get("length")
        order.breadth = data.get("breadth")
        order.height = data.get("height")
        order.has_missing_weight = False
        order.status = Order.OrderStatus.PROCESSING

        if data.get("assigned_carrier_id"):
            try:
                order.assigned_carrier = Carrier.objects.get(pk=data["assigned_carrier_id"])
            except Carrier.DoesNotExist:
                pass

        if data.get("pickup_location_id"):
            try:
                order.pickup_location = merchant.pickup_locations.get(pk=data["pickup_location_id"])
            except PickupLocation.DoesNotExist:
                pass

        order.save()

        OrderStatusHistory.objects.create(
            order=order,
            from_status=old_status,
            to_status=order.status,
            changed_by=request.user,
            source="merchant",
        )

        return Response(OrderDetailSerializer(order).data)


def _book_awb_for_order(merchant, order, carrier, service_type, pickup_location, user):
    """
    Shared booking logic used by both single (BookAWBView) and bulk
    (BulkProcessOrdersView) AWB booking. Returns (shipment, error_dict) —
    error_dict is None on success.
    """
    if not pickup_location:
        pickup_location = merchant.pickup_locations.filter(is_default=True, is_active=True).first()
    if not pickup_location:
        return None, {"detail": "No pickup location found. Please set a default."}

    weight = order.total_weight or DEFAULT_WEIGHT_KG
    rate = CarrierRate.objects.filter(
        carrier=carrier,
        service_type=service_type,
        is_active=True,
        min_weight_kg__lte=weight,
        max_weight_kg__gte=weight,
    ).first()

    shipping_charge = Decimal("0")
    cod_charge = Decimal("0")
    if rate:
        shipping_charge = rate.base_rate + rate.rate_per_kg * weight
        if order.payment_type == Order.PaymentType.COD:
            cod_charge = max(rate.cod_charge, rate.cod_percentage * order.cod_amount / 100)
    total_charge = shipping_charge + cod_charge

    wallet, _ = Wallet.objects.get_or_create(merchant=merchant)
    if wallet.balance < total_charge:
        return None, {
            "detail": "Insufficient wallet balance.",
            "required": str(total_charge),
            "available": str(wallet.balance),
        }

    with transaction.atomic():
        shipment = Shipment.objects.create(
            merchant=merchant,
            carrier=carrier,
            pickup_location=pickup_location,
            order_id=order.order_number,
            consignee_name=order.customer_name,
            consignee_phone=order.customer_phone,
            consignee_email=order.customer_email,
            consignee_address1=order.shipping_address1,
            consignee_address2=order.shipping_address2 or "",
            consignee_city=order.shipping_city,
            consignee_state=order.shipping_state,
            consignee_pincode=order.shipping_pincode,
            consignee_country=order.shipping_country,
            weight=weight,
            length=order.length,
            breadth=order.breadth,
            height=order.height,
            declared_value=order.order_amount,
            cod_amount=order.cod_amount,
            payment_mode=(
                Shipment.PaymentMode.COD
                if order.payment_type == Order.PaymentType.COD
                else Shipment.PaymentMode.PREPAID
            ),
            service_type=service_type,
            shipping_charge=shipping_charge,
            cod_charge=cod_charge,
            total_charge=total_charge,
            status=Shipment.Status.BOOKED,
            booked_at=timezone.now(),
            product_name=order.items.first().product_name if order.items.exists() else "",
            product_quantity=order.items.aggregate(total=Sum("quantity"))["total"] or 1,
        )

        ShipmentStatusEvent.objects.create(
            shipment=shipment,
            status=Shipment.Status.BOOKED,
            description="AWB booked successfully.",
            event_time=timezone.now(),
            source="merchant",
        )

        try:
            wallet.debit(
                amount=total_charge,
                description=f"Shipping charge for {order.order_number}",
                reference=shipment.tracking_id,
                txn_type=WalletTransaction.TransactionType.DEDUCTION,
            )
        except ValueError as exc:
            transaction.set_rollback(True)
            return None, {"detail": str(exc)}

        old_status = order.status
        order.shipment = shipment
        order.assigned_carrier = carrier
        order.status = Order.OrderStatus.BOOKED
        order.save(update_fields=["shipment", "assigned_carrier", "status"])

        OrderStatusHistory.objects.create(
            order=order,
            from_status=old_status,
            to_status=order.status,
            changed_by=user,
            note=f"AWB: {shipment.tracking_id}",
            source="merchant",
        )

    create_notification(
        user=user,
        title="AWB Booked",
        message=f"Order {order.order_number} booked via {carrier.name}. Tracking: {shipment.tracking_id}",
        notification_type="SHIPMENT",
        entity_type="order",
        entity_id=order.id,
    )

    return shipment, None


class BookAWBView(APIView):
    """
    POST /api/orders/<id>/book-awb/
    Book AWB for a PROCESSING order:
    1. Check KYC + wallet balance
    2. Create Shipment + AWB
    3. Deduct wallet
    4. Move order to BOOKED
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        merchant = get_merchant(request)
        try:
            order = merchant.orders.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        if order.status != Order.OrderStatus.PROCESSING:
            return Response(
                {"detail": "Only PROCESSING orders can have AWB booked."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if merchant.kyc_status != Merchant.KYCStatus.VERIFIED:
            return Response(
                {"detail": "AWB booking blocked. KYC not verified yet."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = BookAWBSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            carrier = Carrier.objects.get(pk=data["carrier_id"], status=Carrier.Status.ACTIVE)
        except Carrier.DoesNotExist:
            return Response({"detail": "Carrier not found or inactive."}, status=status.HTTP_404_NOT_FOUND)

        pickup_location = order.pickup_location
        if data.get("pickup_location_id"):
            try:
                pickup_location = merchant.pickup_locations.get(pk=data["pickup_location_id"])
            except PickupLocation.DoesNotExist:
                pass

        shipment, error = _book_awb_for_order(
            merchant, order, carrier, data["service_type"], pickup_location, request.user
        )
        if error:
            return Response(error, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "order": OrderDetailSerializer(order).data,
            "tracking_id": shipment.tracking_id,
            "awb_number": shipment.awb_number,
            "shipping_charge": str(shipment.shipping_charge),
            "cod_charge": str(shipment.cod_charge),
            "total_charge": str(shipment.total_charge),
        })


class BulkProcessOrdersView(APIView):
    """
    POST /api/orders/bulk-process/
    Book AWBs for up to 500 PROCESSING orders in one call.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BulkProcessSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        merchant = get_merchant(request)
        order_ids = data["order_ids"]
        carrier_id = data["carrier_id"]
        service_type = data["service_type"]

        if merchant.kyc_status != Merchant.KYCStatus.VERIFIED:
            return Response(
                {"detail": "AWB booking blocked. KYC not verified yet."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            carrier = Carrier.objects.get(pk=carrier_id, status=Carrier.Status.ACTIVE)
        except Carrier.DoesNotExist:
            return Response({"detail": "Carrier not found or inactive."}, status=status.HTTP_404_NOT_FOUND)

        orders = merchant.orders.filter(pk__in=order_ids, status=Order.OrderStatus.PROCESSING)
        found_ids = list(orders.values_list("id", flat=True))
        not_found = [oid for oid in order_ids if oid not in found_ids]

        results = {"success": [], "failed": [], "not_found": not_found}

        for order in orders:
            shipment, error = _book_awb_for_order(
                merchant, order, carrier, service_type, order.pickup_location, request.user
            )
            if error:
                results["failed"].append({"order_id": order.id, "error": error.get("detail", "Booking failed.")})
            else:
                results["success"].append({"order_id": order.id, "tracking_id": shipment.tracking_id})

        return Response({
            "total_requested": len(order_ids),
            "success_count": len(results["success"]),
            "failed_count": len(results["failed"]),
            "not_found_count": len(results["not_found"]),
            "results": results,
        })


class CancelOrderView(APIView):
    """POST /api/orders/<id>/cancel/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            order = get_merchant(request).orders.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        if order.status in [
            Order.OrderStatus.DELIVERED,
            Order.OrderStatus.CANCELLED,
            Order.OrderStatus.IN_TRANSIT,
            Order.OrderStatus.OUT_FOR_DELIVERY,
        ]:
            return Response(
                {"detail": f"Cannot cancel order in {order.status} status."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_status = order.status
        order.status = Order.OrderStatus.CANCELLED
        order.save(update_fields=["status"])

        OrderStatusHistory.objects.create(
            order=order,
            from_status=old_status,
            to_status=Order.OrderStatus.CANCELLED,
            changed_by=request.user,
            note=request.data.get("reason", ""),
            source="merchant",
        )
        return Response({"detail": "Order cancelled.", "order_id": order.id})


class OrderStatsView(APIView):
    """GET /api/orders/stats/ — Order counts for dashboard."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = get_merchant(request).orders
        today = timezone.now().date()

        stats = {
            "total": orders.count(),
            "new": orders.filter(status=Order.OrderStatus.NEW).count(),
            "processing": orders.filter(status=Order.OrderStatus.PROCESSING).count(),
            "booked": orders.filter(status=Order.OrderStatus.BOOKED).count(),
            "in_transit": orders.filter(status=Order.OrderStatus.IN_TRANSIT).count(),
            "delivered": orders.filter(status=Order.OrderStatus.DELIVERED).count(),
            "cancelled": orders.filter(status=Order.OrderStatus.CANCELLED).count(),
            "flagged": orders.filter(is_flagged=True).count(),
            "today_orders": orders.filter(created_at__date=today).count(),
            "today_revenue": str(
                orders.filter(created_at__date=today).aggregate(total=Sum("order_amount"))["total"] or Decimal("0")
            ),
        }
        return Response(stats)
