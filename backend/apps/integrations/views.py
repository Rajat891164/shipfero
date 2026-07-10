from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import ChannelIntegration, IntegrationSyncLog
from .serializers import (
    ChannelIntegrationSerializer,
    ChannelIntegrationCreateSerializer,
    IntegrationSyncLogSerializer,
)


class IntegrationListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/integrations/ — List merchant's integrations.
    POST /api/integrations/ — Add new integration.
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChannelIntegration.objects.filter(merchant=self.request.user.merchant)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ChannelIntegrationCreateSerializer
        return ChannelIntegrationSerializer


class IntegrationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/integrations/<id>/
    PATCH  /api/integrations/<id>/
    DELETE /api/integrations/<id>/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ChannelIntegrationSerializer

    def get_queryset(self):
        return ChannelIntegration.objects.filter(merchant=self.request.user.merchant)


class IntegrationSyncView(APIView):
    """POST /api/integrations/<id>/sync/ — Trigger manual order sync."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            integration = ChannelIntegration.objects.get(
                pk=pk, merchant=request.user.merchant
            )
        except ChannelIntegration.DoesNotExist:
            return Response({"detail": "Integration not found."}, status=status.HTTP_404_NOT_FOUND)

        if integration.status != ChannelIntegration.Status.ACTIVE:
            return Response(
                {"detail": "Cannot sync inactive integration."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # In a real app, this would trigger a Celery task to fetch orders.
        # Simulating sync here.
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
        try:
            integration = ChannelIntegration.objects.get(
                pk=self.kwargs["pk"], merchant=self.request.user.merchant
            )
            return integration.sync_logs.all().order_by("-created_at")
        except ChannelIntegration.DoesNotExist:
            return IntegrationSyncLog.objects.none()
