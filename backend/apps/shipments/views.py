from django.utils import timezone

from rest_framework import generics, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from apps.couriers.services.factory import CourierFactory
from apps.couriers.models import MerchantCourier
from core.utils import get_merchant

from .models import Shipment, ShipmentStatusEvent
from .serializers import (
    ShipmentListSerializer,
    ShipmentDetailSerializer,
    CreateShipmentSerializer,
    TrackShipmentSerializer,
)


class ShipmentListCreateView(generics.ListCreateAPIView):
    """List and create shipments for the authenticated merchant.

    GET  /api/shipments/  – List all shipments
    POST /api/shipments/  – Create a new shipment (DRAFT)
    """

    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "tracking_id",
        "awb_number",
        "order_id",
        "consignee_name",
        "consignee_pincode",
    ]
    ordering_fields = ["created_at", "booked_at", "status"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = get_merchant(self.request).shipments.select_related(
            "carrier", "pickup_location"
        )

        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter.upper())

        from_date = self.request.query_params.get("from_date")
        to_date = self.request.query_params.get("to_date")
        if from_date:
            qs = qs.filter(created_at__date__gte=from_date)
        if to_date:
            qs = qs.filter(created_at__date__lte=to_date)

        return qs

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateShipmentSerializer
        return ShipmentListSerializer

    def create(self, request, *args, **kwargs):
        serializer = CreateShipmentSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        shipment = serializer.save()
        return Response(
            ShipmentDetailSerializer(shipment).data,
            status=status.HTTP_201_CREATED,
        )


class ShipmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or cancel a single shipment.

    GET    /api/shipments/<pk>/    – Detail with tracking history
    PATCH  /api/shipments/<pk>/    – Update shipment (only DRAFT)
    DELETE /api/shipments/<pk>/    – Cancel shipment
    """

    permission_classes = [IsAuthenticated]
    serializer_class = ShipmentDetailSerializer
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return (
            get_merchant(self.request)
            .shipments.select_related("carrier", "pickup_location")
            .prefetch_related("status_events", "label")
        )

    def update(self, request, *args, **kwargs):
        shipment = self.get_object()
        if shipment.status != Shipment.Status.DRAFT:
            return Response(
                {"detail": "Only DRAFT shipments can be updated."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        shipment = self.get_object()
        if shipment.status in [Shipment.Status.DELIVERED, Shipment.Status.CANCELLED]:
            return Response(
                {"detail": f"Cannot cancel a {shipment.status} shipment."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        shipment.status = Shipment.Status.CANCELLED
        shipment.cancelled_at = timezone.now()
        shipment.save(update_fields=["status", "cancelled_at"])

        ShipmentStatusEvent.objects.create(
            shipment=shipment,
            status=Shipment.Status.CANCELLED,
            description="Shipment cancelled by merchant.",
            event_time=timezone.now(),
            source="merchant",
        )

        return Response({"detail": "Shipment cancelled successfully."})


class BookShipmentView(APIView):
    """Book a DRAFT shipment with the selected carrier.

    POST /api/shipments/<pk>/book/ – Book shipment
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        merchant = get_merchant(request)
        try:
            shipment = merchant.shipments.get(pk=pk)
        except Shipment.DoesNotExist:
            return Response(
                {"detail": "Shipment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if shipment.status != Shipment.Status.DRAFT:
            return Response(
                {"detail": "Only DRAFT shipments can be booked."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not shipment.carrier:
            return Response(
                {"detail": "Please select a carrier before booking."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Multiple profiles for the same merchant/carrier are supported.
        # Prefer the profile explicitly marked as default. If no profile is
        # marked default, fall back to the only configured profile.
        merchant_couriers = MerchantCourier.objects.filter(
            merchant=shipment.merchant,
            carrier=shipment.carrier,
            status=MerchantCourier.Status.ACTIVE,
        ).order_by("-is_default", "-updated_at", "-id")

        merchant_courier = merchant_couriers.filter(is_default=True).first()

        if merchant_courier is None:
            if merchant_couriers.count() == 1:
                merchant_courier = merchant_couriers.first()
            elif merchant_couriers.exists():
                return Response(
                    {
                        "detail": (
                            "Multiple profiles are configured for this carrier. "
                            "Please set one profile as default in Courier Settings."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            else:
                return Response(
                    {"detail": "Carrier not configured for this merchant."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        service = CourierFactory.get_service(merchant_courier)

        try:
            response = service.create_shipment(shipment)
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Basic mapping of response fields – adjust as per Blue Dart response
        awb = response.get("AWBNo") or response.get("GenerateWayBillResult", {}).get("AWBNo", "")

        shipment.awb_number = awb
        shipment.tracking_number = awb
        shipment.status = Shipment.Status.BOOKED
        shipment.booked_at = timezone.now()
        shipment.save(
            update_fields=["awb_number", "tracking_number", "status", "booked_at"]
        )

        ShipmentStatusEvent.objects.create(
            shipment=shipment,
            status=Shipment.Status.BOOKED,
            description="Shipment booked successfully.",
            event_time=timezone.now(),
            source="system",
        )

        return Response(
            ShipmentDetailSerializer(shipment).data,
            status=status.HTTP_200_OK,
        )


class TrackShipmentView(APIView):
    """Public tracking endpoint.

    GET /api/shipments/track/<tracking_id>/
    """

    permission_classes = [AllowAny]

    def get(self, request, tracking_id):
        try:
            shipment = (
                Shipment.objects.select_related("carrier")
                .prefetch_related("status_events")
                .get(tracking_id=tracking_id)
            )
        except Shipment.DoesNotExist:
            return Response(
                {"detail": "Shipment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        data = {
            "tracking_id": shipment.tracking_id,
            "status": shipment.status,
            "consignee_name": shipment.consignee_name,
            "consignee_city": getattr(shipment, "consignee_city", None),
            "consignee_pincode": shipment.consignee_pincode,
            "carrier_name": shipment.carrier.name if shipment.carrier else None,
            "booked_at": shipment.booked_at,
            "delivered_at": shipment.delivered_at,
            "status_events": shipment.status_events.all(),
        }

        serializer = TrackShipmentSerializer(data)
        return Response(serializer.data)


class ShipmentStatsView(APIView):
    """Shipment count stats for the dashboard.

    GET /api/shipments/stats/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        merchant = get_merchant(request)
        shipments = merchant.shipments

        stats = {
            "total": shipments.count(),
            "booked": shipments.filter(status=Shipment.Status.BOOKED).count(),
            "in_transit": shipments.filter(status=Shipment.Status.IN_TRANSIT).count(),
            "delivered": shipments.filter(status=Shipment.Status.DELIVERED).count(),
            "cancelled": shipments.filter(status=Shipment.Status.CANCELLED).count(),
            "rto": shipments.filter(
                status__in=[
                    Shipment.Status.RTO_INITIATED,
                    Shipment.Status.RTO_IN_TRANSIT,
                    Shipment.Status.RTO_DELIVERED,
                ]
            ).count(),
        }

        return Response(stats)