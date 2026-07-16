from decimal import Decimal

from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from core.utils import get_merchant
from apps.orders.models import Order, OrderItem
from apps.ndr.models import NDR
from .models import Merchant, MerchantBankDetails, PickupLocation
from .serializers import (
    OnboardingStatusSerializer,
    MerchantBasicSerializer,
    BusinessProfileSerializer,
    MerchantKYCSerializer,
    BankDetailsSerializer,
    PickupLocationSerializer,
    MerchantPlanSerializer,
)

LOW_WALLET_BALANCE_THRESHOLD = Decimal("500.00")
NDR_STALE_HOURS = 48


# ─── Onboarding Status ────────────────────────────────────────────────────────

class OnboardingStatusView(APIView):
    """GET /api/merchants/onboarding/status/ – full onboarding progress"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        merchant = get_merchant(request)
        serializer = OnboardingStatusSerializer.from_merchant(merchant)
        return Response(serializer.data)


# ─── Merchant Profile (basic info) ───────────────────────────────────────────

class MerchantProfileView(APIView):
    """GET/PATCH /api/merchants/me/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        merchant = get_merchant(request)
        serializer = MerchantBasicSerializer(merchant)
        return Response(serializer.data)

    def patch(self, request):
        merchant = get_merchant(request)
        serializer = MerchantBasicSerializer(
            merchant, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ─── Business Profile (Onboarding Step 3) ─────────────────────────────────────

class BusinessProfileView(APIView):
    """GET/POST/PATCH /api/merchants/onboarding/business-profile/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        merchant = get_merchant(request)
        if not hasattr(merchant, "profile"):
            return Response(
                {"detail": "Business profile not set up yet."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = BusinessProfileSerializer(merchant.profile)
        return Response(serializer.data)

    def post(self, request):
        merchant = get_merchant(request)
        if hasattr(merchant, "profile"):
            return Response(
                {"detail": "Business profile already exists. Use PATCH to update."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = BusinessProfileSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def patch(self, request):
        merchant = get_merchant(request)
        if not hasattr(merchant, "profile"):
            return Response(
                {"detail": "Business profile not found. Use POST to create."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = BusinessProfileSerializer(
            merchant.profile, data=request.data, partial=True,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ─── KYC Documents (Onboarding Step 4) ────────────────────────────────────────

class MerchantKYCListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/merchants/onboarding/kyc/"""
    permission_classes = [IsAuthenticated]
    serializer_class = MerchantKYCSerializer

    def get_queryset(self):
        return get_merchant(self.request).kyc_documents.all().order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save()


class MerchantKYCDetailView(generics.RetrieveDestroyAPIView):
    """GET/DELETE /api/merchants/onboarding/kyc/<pk>/"""
    permission_classes = [IsAuthenticated]
    serializer_class = MerchantKYCSerializer

    def get_queryset(self):
        return get_merchant(self.request).kyc_documents.all()


# ─── Bank Details (Onboarding Step 5) ─────────────────────────────────────────

class BankDetailsListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/merchants/onboarding/bank-details/"""
    permission_classes = [IsAuthenticated]
    serializer_class = BankDetailsSerializer

    def get_queryset(self):
        return get_merchant(self.request).bank_accounts.filter(
            is_active=True
        ).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save()


class BankDetailsDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/merchants/onboarding/bank-details/<pk>/"""
    permission_classes = [IsAuthenticated]
    serializer_class = BankDetailsSerializer
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return get_merchant(self.request).bank_accounts.all()

    def perform_destroy(self, instance):
        # Soft delete
        instance.is_active = False
        instance.save(update_fields=["is_active"])


# ─── Pickup Locations (Onboarding Step 6) ─────────────────────────────────────

class PickupLocationListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/merchants/onboarding/pickup-locations/"""
    permission_classes = [IsAuthenticated]
    serializer_class = PickupLocationSerializer

    def get_queryset(self):
        return get_merchant(self.request).pickup_locations.filter(
            is_active=True
        ).order_by("-is_default", "-created_at")

    def perform_create(self, serializer):
        serializer.save()


class PickupLocationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/merchants/onboarding/pickup-locations/<pk>/"""
    permission_classes = [IsAuthenticated]
    serializer_class = PickupLocationSerializer
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return get_merchant(self.request).pickup_locations.all()

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])


class SetDefaultPickupLocationView(APIView):
    """POST /api/merchants/onboarding/pickup-locations/<pk>/set-default/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        merchant = get_merchant(request)
        try:
            location = merchant.pickup_locations.get(pk=pk, is_active=True)
        except PickupLocation.DoesNotExist:
            return Response(
                {"detail": "Pickup location not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        merchant.pickup_locations.filter(is_active=True).update(is_default=False)
        location.is_default = True
        location.save(update_fields=["is_default"])
        return Response({"detail": "Default pickup location updated."})


# ─── Complete Onboarding ───────────────────────────────────────────────────────

class CompleteOnboardingView(APIView):
    """POST /api/merchants/onboarding/complete/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        merchant = get_merchant(request)

        errors = []
        if not merchant.email_verified:
            errors.append("Email is not verified.")
        if not hasattr(merchant, "profile"):
            errors.append("Business profile is incomplete.")
        if not merchant.bank_accounts.filter(is_active=True).exists():
            errors.append("Bank details are missing.")
        if not merchant.pickup_locations.filter(is_active=True).exists():
            errors.append("At least one pickup location is required.")

        if errors:
            return Response(
                {"status": False, "errors": errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        merchant.onboarding_completed = True
        merchant.onboarding_step = 8  # done
        merchant.save(update_fields=["onboarding_completed", "onboarding_step"])

        return Response({
            "status": True,
            "message": "Onboarding completed successfully!",
        })


# ─── Merchant Plan ────────────────────────────────────────────────────────────

class MerchantPlanView(APIView):
    """GET /api/merchants/plan/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        merchant = get_merchant(request)
        plan = merchant.plans.filter(is_current=True).first()
        if not plan:
            return Response({"detail": "No active plan."}, status=status.HTTP_404_NOT_FOUND)
        serializer = MerchantPlanSerializer(plan)
        return Response(serializer.data)


# ─── Dashboard (Module 4) ──────────────────────────────────────────────────────

class DashboardView(APIView):
    """
    GET /api/merchants/dashboard/ — aggregated merchant dashboard.

    Combines Orders, Wallet, NDR and Merchant/KYC state into a single call,
    matching PRD Module 4 (Overview Cards, Shipment Status Breakdown,
    Pending Actions Widget). Business Summary Charts / Top-10 views are not
    included yet (deferred — need historical trend aggregation).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        merchant = get_merchant(request)
        today = timezone.now().date()
        orders = Order.objects.filter(merchant=merchant)
        orders_today = orders.filter(created_at__date=today)

        wallet_balance = merchant.wallet.balance if hasattr(merchant, "wallet") else Decimal("0.00")

        status_breakdown = dict(
            orders.values_list("status").annotate(count=Count("id")).order_by()
        )

        ndr_pending_qs = NDR.objects.filter(
            shipment__merchant=merchant, ndr_status=NDR.NDRStatus.PENDING
        )
        ndr_stale_cutoff = timezone.now() - timezone.timedelta(hours=NDR_STALE_HOURS)

        pending_actions = []
        if wallet_balance < LOW_WALLET_BALANCE_THRESHOLD:
            pending_actions.append({
                "type": "LOW_WALLET_BALANCE",
                "severity": "high",
                "message": f"Wallet balance is below ₹{LOW_WALLET_BALANCE_THRESHOLD}.",
            })
        new_orders_count = orders.filter(status=Order.OrderStatus.NEW).count()
        if new_orders_count:
            pending_actions.append({
                "type": "NEW_UNPROCESSED_ORDERS",
                "severity": "medium",
                "message": f"{new_orders_count} new order(s) awaiting processing.",
                "count": new_orders_count,
            })
        ndr_stale_count = ndr_pending_qs.filter(ndr_date__lte=ndr_stale_cutoff).count()
        if ndr_stale_count:
            pending_actions.append({
                "type": "NDR_ACTION_PENDING",
                "severity": "medium",
                "message": f"{ndr_stale_count} NDR(s) pending action for over {NDR_STALE_HOURS}h.",
                "count": ndr_stale_count,
            })
        if merchant.kyc_status != Merchant.KYCStatus.VERIFIED:
            pending_actions.append({
                "type": "KYC_INCOMPLETE",
                "severity": "high",
                "message": "KYC verification is incomplete.",
            })

        return Response({
            "overview": {
                "total_orders_today": orders_today.count(),
                "total_revenue_today": orders_today.aggregate(total=Sum("order_amount"))["total"] or Decimal("0.00"),
                "total_shipments_booked_today": orders_today.filter(
                    status__in=[
                        Order.OrderStatus.BOOKED, Order.OrderStatus.IN_TRANSIT,
                        Order.OrderStatus.OUT_FOR_DELIVERY, Order.OrderStatus.DELIVERED,
                    ]
                ).count(),
                "wallet_balance": wallet_balance,
            },
            "shipment_status_breakdown": status_breakdown,
            "pending_actions": pending_actions,
            "ndr_pending_count": ndr_pending_qs.count(),
        })


class DashboardAnalyticsView(APIView):
    """
    GET /api/merchants/dashboard/analytics/ — PRD Module 4 Business Summary
    Charts + Top-10 views, aggregated over the merchant's orders.
    """
    permission_classes = [IsAuthenticated]

    DELIVERED = Order.OrderStatus.DELIVERED
    RTO_STATUSES = [Order.OrderStatus.RTO_INITIATED, Order.OrderStatus.RTO_DELIVERED]
    BOOKED_STATUSES = [
        Order.OrderStatus.BOOKED, Order.OrderStatus.IN_TRANSIT,
        Order.OrderStatus.OUT_FOR_DELIVERY, Order.OrderStatus.DELIVERED,
    ]

    def get(self, request):
        merchant = get_merchant(request)
        orders = Order.objects.filter(merchant=merchant)

        # 30-day daily shipment trend
        since = timezone.now().date() - timezone.timedelta(days=29)
        trend_rows = (
            orders.filter(created_at__date__gte=since)
            .annotate(day=TruncDate("created_at"))
            .values("day").annotate(count=Count("id")).order_by("day")
        )
        daily_trend = [
            {"date": r["day"].isoformat(), "count": r["count"]} for r in trend_rows
        ]

        # Delivery % vs RTO %
        delivered = orders.filter(status=self.DELIVERED).count()
        rto = orders.filter(status__in=self.RTO_STATUSES).count()

        # Courier-wise split (booked / delivered / rto)
        courier_split = [
            {"carrier": r["assigned_carrier__name"], "booked": r["booked"],
             "delivered": r["delivered"], "rto": r["rto"]}
            for r in orders.exclude(assigned_carrier__isnull=True)
            .values("assigned_carrier__name")
            .annotate(
                booked=Count("id", filter=Q(status__in=self.BOOKED_STATUSES)),
                delivered=Count("id", filter=Q(status=self.DELIVERED)),
                rto=Count("id", filter=Q(status__in=self.RTO_STATUSES)),
            ).order_by("-booked")
        ]

        # Channel-wise order volume
        channel_volume = [
            {"channel": r["channel_source"], "count": r["count"]}
            for r in orders.values("channel_source").annotate(count=Count("id")).order_by("-count")
        ]

        # Top 10 cities by order volume
        top_cities = [
            {"city": r["shipping_city"], "count": r["count"]}
            for r in orders.exclude(shipping_city="")
            .values("shipping_city").annotate(count=Count("id")).order_by("-count")[:10]
        ]

        # Top 10 products by SKU frequency
        top_products = [
            {"product": r["product_name"], "sku": r["sku"], "count": r["qty"]}
            for r in OrderItem.objects.filter(order__merchant=merchant)
            .values("product_name", "sku")
            .annotate(qty=Sum("quantity")).order_by("-qty")[:10]
        ]

        # Top 10 pincodes by delivery success rate
        top_pincodes = [
            {"pincode": r["shipping_pincode"], "total": r["total"],
             "delivered": r["delivered"],
             "success_rate": round(100 * r["delivered"] / r["total"], 1) if r["total"] else 0}
            for r in orders.exclude(shipping_pincode="")
            .values("shipping_pincode")
            .annotate(
                total=Count("id"),
                delivered=Count("id", filter=Q(status=self.DELIVERED)),
            ).order_by("-delivered")[:10]
        ]

        return Response({
            "daily_shipment_trend": daily_trend,
            "delivery_vs_rto": {"delivered": delivered, "rto": rto},
            "courier_split": courier_split,
            "channel_volume": channel_volume,
            "top_cities": top_cities,
            "top_products": top_products,
            "top_pincodes": top_pincodes,
        })
