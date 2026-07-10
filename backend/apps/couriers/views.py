from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import MerchantCourier, CourierHealthLog
from .serializers import (
    MerchantCourierSerializer,
    MerchantCourierCreateSerializer,
    CourierHealthLogSerializer,
)


class MerchantCourierListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/couriers/ — List configured couriers.
    POST /api/couriers/ — Add courier account.
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MerchantCourier.objects.filter(merchant=self.request.user.merchant).select_related("carrier")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return MerchantCourierCreateSerializer
        return MerchantCourierSerializer


class MerchantCourierDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/couriers/<id>/
    PATCH  /api/couriers/<id>/
    DELETE /api/couriers/<id>/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = MerchantCourierSerializer

    def get_queryset(self):
        return MerchantCourier.objects.filter(merchant=self.request.user.merchant)
        
    def perform_destroy(self, instance):
        # In a real app, check if there are in-transit shipments using this config
        # before allowing deletion.
        instance.delete()


class TestCourierConnectionView(APIView):
    """POST /api/couriers/<id>/test/ — Test API connection."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            config = MerchantCourier.objects.get(pk=pk, merchant=request.user.merchant)
        except MerchantCourier.DoesNotExist:
            return Response({"detail": "Configuration not found."}, status=status.HTTP_404_NOT_FOUND)

        # Simulate API ping
        log = CourierHealthLog.objects.create(
            merchant_courier=config,
            is_healthy=True,
            response_time_ms=120,
        )
        
        config.last_tested_at = timezone.now()
        config.last_test_status = "Connection successful"
        config.status = MerchantCourier.Status.ACTIVE
        config.save(update_fields=["last_tested_at", "last_test_status", "status"])

        return Response({"detail": "Connection successful.", "response_time_ms": 120})


class CourierHealthLogView(generics.ListAPIView):
    """GET /api/couriers/<id>/health/ — Health history."""
    permission_classes = [IsAuthenticated]
    serializer_class = CourierHealthLogSerializer

    def get_queryset(self):
        try:
            config = MerchantCourier.objects.get(pk=self.kwargs["pk"], merchant=self.request.user.merchant)
            return config.health_logs.all().order_by("-created_at")
        except MerchantCourier.DoesNotExist:
            return CourierHealthLog.objects.none()
