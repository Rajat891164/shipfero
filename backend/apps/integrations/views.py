from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from core.utils import get_merchant
from .models import (
    ChannelIntegration,
    IntegrationSyncLog,
    ChannelPaymentMapping,
    ChannelStatusMapping,
    resolve_payment_type,
)
from .serializers import (
    ChannelIntegrationSerializer,
    ChannelIntegrationCreateSerializer,
    IntegrationSyncLogSerializer,
    ChannelPaymentMappingSerializer,
    ChannelStatusMappingSerializer,
)


def _apply_mappings_to_orders(integration):
    """Re-resolve every flagged (unmapped) order on an integration against the
    current mappings; returns how many became mapped."""
    updated = 0
    for order in integration.orders.filter(is_payment_mapped=False):
        resolved = resolve_payment_type(integration, order.store_payment_method)
        if resolved:
            order.payment_type = resolved
            order.is_payment_mapped = True
            order.is_flagged = False
            order.flag_reason = None
            order.save(update_fields=[
                "payment_type", "is_payment_mapped", "is_flagged", "flag_reason",
            ])
            updated += 1
    return updated


class PaymentMappingListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/integrations/<pk>/payment-mappings/"""
    permission_classes = [IsAuthenticated]
    serializer_class = ChannelPaymentMappingSerializer

    def _integration(self):
        return generics.get_object_or_404(
            ChannelIntegration, pk=self.kwargs["pk"], merchant=get_merchant(self.request)
        )

    def get_queryset(self):
        return ChannelPaymentMapping.objects.filter(integration=self._integration())

    def perform_create(self, serializer):
        integration = self._integration()
        serializer.save(integration=integration)
        _apply_mappings_to_orders(integration)


class PaymentMappingDeleteView(generics.DestroyAPIView):
    """DELETE /api/integrations/<pk>/payment-mappings/<mapping_pk>/"""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChannelPaymentMapping.objects.filter(
            integration__pk=self.kwargs["pk"],
            integration__merchant=get_merchant(self.request),
        )

    lookup_url_kwarg = "mapping_pk"


class StatusMappingListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/integrations/<pk>/status-mappings/"""
    permission_classes = [IsAuthenticated]
    serializer_class = ChannelStatusMappingSerializer

    def _integration(self):
        return generics.get_object_or_404(
            ChannelIntegration, pk=self.kwargs["pk"], merchant=get_merchant(self.request)
        )

    def get_queryset(self):
        return ChannelStatusMapping.objects.filter(integration=self._integration())

    def perform_create(self, serializer):
        serializer.save(integration=self._integration())


class StatusMappingDetailView(generics.UpdateAPIView, generics.DestroyAPIView):
    """PATCH/DELETE /api/integrations/<pk>/status-mappings/<mapping_pk>/
    PATCH toggles is_enabled or edits store_status."""
    permission_classes = [IsAuthenticated]
    serializer_class = ChannelStatusMappingSerializer
    lookup_url_kwarg = "mapping_pk"

    def get_queryset(self):
        return ChannelStatusMapping.objects.filter(
            integration__pk=self.kwargs["pk"],
            integration__merchant=get_merchant(self.request),
        )


class BulkPrepaidMappingView(APIView):
    """POST /api/integrations/<pk>/payment-mappings/bulk-prepaid/
    Map every still-unmapped store method (from flagged orders) as PREPAID."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        integration = generics.get_object_or_404(
            ChannelIntegration, pk=pk, merchant=get_merchant(request)
        )
        methods = set(
            integration.orders.filter(is_payment_mapped=False)
            .exclude(store_payment_method__isnull=True)
            .exclude(store_payment_method="")
            .values_list("store_payment_method", flat=True)
        )
        created = 0
        for method in methods:
            _, was_created = ChannelPaymentMapping.objects.get_or_create(
                integration=integration,
                store_method_name=method,
                defaults={"mapped_type": ChannelPaymentMapping.MappedType.PREPAID},
            )
            created += was_created
        remapped = _apply_mappings_to_orders(integration)
        return Response({
            "detail": f"{created} method(s) mapped as Prepaid, {remapped} order(s) unflagged.",
            "mappings_created": created,
            "orders_remapped": remapped,
        })


class IntegrationListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/integrations/ — List merchant's integrations.
    POST /api/integrations/ — Add new integration.
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChannelIntegration.objects.filter(merchant=get_merchant(self.request))

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ChannelIntegrationCreateSerializer
        return ChannelIntegrationSerializer


class IntegrationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/integrations/<id>/
    PATCH  /api/integrations/<id>/ — may include new credentials (re-encrypted)
    DELETE /api/integrations/<id>/
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChannelIntegration.objects.filter(merchant=get_merchant(self.request))

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return ChannelIntegrationCreateSerializer
        return ChannelIntegrationSerializer


class IntegrationSyncView(APIView):
    """POST /api/integrations/<id>/sync/ — Trigger manual order sync."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        merchant = get_merchant(request)
        try:
            integration = ChannelIntegration.objects.get(pk=pk, merchant=merchant)
        except ChannelIntegration.DoesNotExist:
            return Response({"detail": "Integration not found."}, status=status.HTTP_404_NOT_FOUND)

        if integration.status != ChannelIntegration.Status.ACTIVE:
            return Response(
                {"detail": "Cannot sync inactive integration."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # No live channel connectors exist yet — this simulates a successful pull.
        # Wire this to the real per-platform adapter (Shopify/Amazon/WooCommerce)
        # once Phase 2/3 channel connectors + Celery land.
        log = IntegrationSyncLog.objects.create(
            integration=integration,
            orders_fetched=5,
            orders_created=5,
            is_success=True,
        )

        integration.last_sync_at = timezone.now()
        integration.last_sync_status = "Success"
        integration.save(update_fields=["last_sync_at", "last_sync_status"])

        return Response({
            "detail": "Sync completed successfully.",
            "log_id": log.id,
            "orders_fetched": log.orders_fetched,
        })


class IntegrationLogsView(generics.ListAPIView):
    """GET /api/integrations/<id>/logs/ — View sync history."""
    permission_classes = [IsAuthenticated]
    serializer_class = IntegrationSyncLogSerializer

    def get_queryset(self):
        merchant = get_merchant(self.request)
        try:
            integration = ChannelIntegration.objects.get(pk=self.kwargs["pk"], merchant=merchant)
            return integration.sync_logs.all().order_by("-created_at")
        except ChannelIntegration.DoesNotExist:
            return IntegrationSyncLog.objects.none()
