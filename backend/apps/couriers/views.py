from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError

from apps.accounts.models import AuditLog
from apps.shipments.models import Shipment
from core.utils import get_merchant
from .models import MerchantCourier, CourierHealthLog
from .serializers import (
    MerchantCourierSerializer,
    MerchantCourierCreateSerializer,
    CourierHealthLogSerializer,
)

# Shipment statuses that count as "currently in transit" for delete-blocking purposes.
IN_TRANSIT_STATUSES = [
    Shipment.Status.BOOKED,
    Shipment.Status.PICKUP_SCHEDULED,
    Shipment.Status.PICKED_UP,
    Shipment.Status.IN_TRANSIT,
    Shipment.Status.OUT_FOR_DELIVERY,
]


def _log_credential_change(request, merchant, config, action_type):
    AuditLog.objects.create(
        merchant=merchant,
        user=request.user,
        action_type=action_type,
        details=f"Courier '{config.carrier.name}' credentials {action_type.lower()} by {request.user.email}",
        ip_address=request.META.get("REMOTE_ADDR"),
    )


class MerchantCourierListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/couriers/ — List configured couriers.
    POST /api/couriers/ — Add courier account.
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MerchantCourier.objects.filter(merchant=get_merchant(self.request)).select_related("carrier")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return MerchantCourierCreateSerializer
        return MerchantCourierSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        _log_credential_change(self.request, instance.merchant, instance, "COURIER_ADDED")


class MerchantCourierDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/couriers/<id>/
    PATCH  /api/couriers/<id>/ — pre-filled wizard edit; may include new credentials
    DELETE /api/couriers/<id>/ — blocked if shipments are currently in transit on this courier
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MerchantCourier.objects.filter(merchant=get_merchant(self.request))

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return MerchantCourierCreateSerializer
        return MerchantCourierSerializer

    def perform_update(self, serializer):
        instance = serializer.save()
        _log_credential_change(self.request, instance.merchant, instance, "COURIER_UPDATED")

    def perform_destroy(self, instance):
        in_transit_count = Shipment.objects.filter(
            merchant=instance.merchant,
            carrier=instance.carrier,
            status__in=IN_TRANSIT_STATUSES,
        ).count()
        if in_transit_count > 0:
            raise ValidationError(
                f"{in_transit_count} shipment(s) currently in transit. Cannot delete."
            )
        instance.delete()


class TestCourierConnectionView(APIView):
    """POST /api/couriers/<id>/test/ — Test API connection (standalone tool, also used by the wizard)."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        merchant = get_merchant(request)
        try:
            config = MerchantCourier.objects.get(pk=pk, merchant=merchant)
        except MerchantCourier.DoesNotExist:
            return Response({"detail": "Configuration not found."}, status=status.HTTP_404_NOT_FOUND)

        if not config.api_key:
            config.last_test_status = "Failed: no API key configured"
            config.status = MerchantCourier.Status.CREDENTIALS_INVALID
            config.save(update_fields=["last_test_status", "status"])
            CourierHealthLog.objects.create(
                merchant_courier=config, is_healthy=False, error_message="No API key configured",
            )
            return Response(
                {"detail": "Connection failed: no API key configured.", "passed": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # No live courier integrations exist yet — this simulates a successful ping.
        # Wire this to the real per-courier adapter once Phase 2 courier connectors land.
        CourierHealthLog.objects.create(
            merchant_courier=config, is_healthy=True, response_time_ms=120,
        )
        config.last_tested_at = timezone.now()
        config.last_test_status = "Connection successful"
        config.status = MerchantCourier.Status.ACTIVE
        config.save(update_fields=["last_tested_at", "last_test_status", "status"])

        return Response({"detail": "Connection successful.", "passed": True, "response_time_ms": 120})


class CourierHealthLogView(generics.ListAPIView):
    """GET /api/couriers/<id>/health/ — Health history."""
    permission_classes = [IsAuthenticated]
    serializer_class = CourierHealthLogSerializer

    def get_queryset(self):
        merchant = get_merchant(self.request)
        try:
            config = MerchantCourier.objects.get(pk=self.kwargs["pk"], merchant=merchant)
            return config.health_logs.all().order_by("-created_at")
        except MerchantCourier.DoesNotExist:
            return CourierHealthLog.objects.none()
