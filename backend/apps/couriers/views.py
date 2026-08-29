from django.utils import timezone

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError

from apps.accounts.models import AuditLog
from apps.shipments.models import Shipment
from apps.carriers.models import Carrier
from apps.merchants.models import Merchant

from core.utils import get_merchant

from .models import MerchantCourier, CourierHealthLog

from .serializers import (
    MerchantCourierSerializer,
    MerchantCourierCreateSerializer,
    CourierHealthLogSerializer,
    AvailableCarrierSerializer,
    CourierCredentialSerializer,
)

from apps.couriers.services.factory import CourierFactory


# ==========================================================
# Shipment statuses used when checking courier deletion
# ==========================================================

IN_TRANSIT_STATUSES = [
    Shipment.Status.BOOKED,
    Shipment.Status.PICKUP_SCHEDULED,
    Shipment.Status.PICKED_UP,
    Shipment.Status.IN_TRANSIT,
    Shipment.Status.OUT_FOR_DELIVERY,
]


# ==========================================================
# Audit Logging
# ==========================================================

def _log_credential_change(
    request,
    merchant,
    config,
    action_type,
):
    AuditLog.objects.create(
        merchant=merchant,
        user=request.user,
        action_type=action_type,
        details=(
            f"Courier '{config.carrier.name}' credentials "
            f"{action_type.lower()} by {request.user.email}"
        ),
        ip_address=request.META.get("REMOTE_ADDR"),
    )


# ==========================================================
# Merchant Courier List / Create
# ==========================================================
class MerchantCourierListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/couriers/
    POST /api/couriers/
    """

    permission_classes = [AllowAny]

    def get_queryset(self):
        merchant = Merchant.objects.get(id=1)

        return (
            MerchantCourier.objects
            .filter(
                merchant=merchant
            )
            .select_related("carrier")
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return MerchantCourierCreateSerializer

        return MerchantCourierSerializer

    def perform_create(self, serializer):
        merchant = Merchant.objects.get(id=1)

        instance = serializer.save(
            merchant=merchant
        )

        # First profile for a merchant + carrier becomes default.
        # Additional profiles remain non-default until selected in the UI.
        has_default = MerchantCourier.objects.filter(
            merchant=merchant,
            carrier=instance.carrier,
            is_default=True,
        ).exclude(pk=instance.pk).exists()

        if not has_default:
            instance.is_default = True

        instance.status = MerchantCourier.Status.ACTIVE
        instance.last_test_status = "Authentication Successful"
        instance.last_tested_at = timezone.now()

        # `instance.is_default` may have just been set above (when this is
        # the first profile for this merchant+carrier) — it must be in
        # update_fields or that change silently never reaches the database.
        instance.save(
            update_fields=[
                "status",
                "last_test_status",
                "last_tested_at",
                "is_default",
            ]
        )

        _log_credential_change(
            self.request,
            merchant,
            instance,
            "COURIER_ADDED",
        )

# ==========================================================
# Merchant Courier Detail / Update / Delete
# ==========================================================

class MerchantCourierDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    """
    GET    /api/couriers/<id>/
    PATCH  /api/couriers/<id>/
    DELETE /api/couriers/<id>/
    """

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MerchantCourier.objects.filter(
            merchant=get_merchant(self.request)
        )

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return MerchantCourierCreateSerializer

        return MerchantCourierSerializer

    def perform_update(self, serializer):
        instance = serializer.save()

        # Only one default profile is allowed per merchant + carrier.
        if instance.is_default:
            MerchantCourier.objects.filter(
                merchant=instance.merchant,
                carrier=instance.carrier,
                is_default=True,
            ).exclude(pk=instance.pk).update(is_default=False)

        _log_credential_change(
            self.request,
            instance.merchant,
            instance,
            "COURIER_UPDATED",
        )

    def perform_destroy(self, instance):
        in_transit_count = Shipment.objects.filter(
            merchant=instance.merchant,
            carrier=instance.carrier,
            status__in=IN_TRANSIT_STATUSES,
        ).count()

        if in_transit_count > 0:
            raise ValidationError(
                f"{in_transit_count} shipment(s) "
                f"currently in transit. Cannot delete."
            )

        was_default = instance.is_default
        merchant = instance.merchant
        carrier = instance.carrier
        instance.delete()

        # Never leave a carrier without a default when another active
        # profile remains. Promote the newest remaining profile.
        if was_default:
            replacement = MerchantCourier.objects.filter(
                merchant=merchant,
                carrier=carrier,
                status=MerchantCourier.Status.ACTIVE,
            ).order_by("-created_at", "-id").first()
            if replacement:
                replacement.is_default = True
                replacement.save(update_fields=["is_default", "updated_at"])


# ==========================================================
# Test Existing Saved Courier Connection
# ==========================================================

class TestCourierConnectionView(APIView):
    """
    POST /api/couriers/<id>/test/
    """

    permission_classes = [AllowAny]

    def post(self, request, pk):

        # TEMPORARY DURING DEVELOPMENT
        merchant = Merchant.objects.get(id=1)

        try:
            config = MerchantCourier.objects.get(
                pk=pk,
                merchant=merchant,
            )

        except MerchantCourier.DoesNotExist:
            return Response(
                {
                    "detail":
                    "Configuration not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            service = CourierFactory.get_service(
                config
            )

            passed, message = (
                service.test_connection()
            )

        except Exception as e:
            passed = False
            message = str(e)

        CourierHealthLog.objects.create(
            merchant_courier=config,
            is_healthy=passed,
            response_time_ms=(
                120 if passed else None
            ),
            error_message=(
                None if passed else message
            ),
        )

        config.last_tested_at = timezone.now()
        config.last_test_status = message

        if passed:
            config.status = (
                MerchantCourier.Status.ACTIVE
            )

        else:
            config.status = (
                MerchantCourier
                .Status
                .CREDENTIALS_INVALID
            )

        config.save(
            update_fields=[
                "status",
                "last_tested_at",
                "last_test_status",
            ]
        )

        return Response(
            {
                "passed": passed,
                "detail": message,
            },
            status=(
                status.HTTP_200_OK
                if passed
                else status.HTTP_400_BAD_REQUEST
            ),
        )


# ==========================================================
# Live Product / Sub-Product Catalog
# ==========================================================

class CourierProductsView(APIView):
    """
    Fetch a courier's live Product & Sub-Product codes.

    GET  /api/couriers/<pk>/products/  — for an already-saved courier config
    POST /api/couriers/products/       — for unsaved credentials, used in the
                                          connect wizard before the merchant
                                          has saved anything
    """

    permission_classes = [AllowAny]

    def get(self, request, pk):
        merchant = get_merchant(request)

        try:
            config = MerchantCourier.objects.get(
                pk=pk,
                merchant=merchant,
            )
        except MerchantCourier.DoesNotExist:
            return Response(
                {"detail": "Configuration not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return self._fetch(config)

    def post(self, request):
        serializer = CourierCredentialSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            carrier = Carrier.objects.get(
                pk=data["carrier"],
                status="ACTIVE",
            )
        except Carrier.DoesNotExist:
            return Response(
                {"detail": "Carrier not found or inactive."},
                status=status.HTTP_404_NOT_FOUND,
            )

        merchant = get_merchant(request)

        config = MerchantCourier(
            merchant=merchant,
            carrier=carrier,
            status=MerchantCourier.Status.INACTIVE,
        )

        config.credentials = {
            "login_id": data["login_id"],
            "license_key": data["license_key"],
            "tracking_license_key": (
                data.get("tracking_license_key")
                or data["license_key"]
            ),
            "customer_code": data["customer_code"],
            "origin_area": data["origin_area"],
            "default_service": data["default_service"],
            "shipper_name": data["shipper_name"],
            "shipper_mobile": data["shipper_mobile"],
            "shipper_address": data["shipper_address"],
            "shipper_pincode": data["shipper_pincode"],
        }

        return self._fetch(config)

    def _fetch(self, config):
        try:
            service = CourierFactory.get_service(config)
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        fetcher = getattr(
            service,
            "get_all_products_and_subproducts",
            None,
        )

        if fetcher is None:
            return Response(
                {
                    "detail": (
                        f"{config.carrier.name} does not support "
                        "live product listing."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            products = fetcher()
        except Exception as e:
            return Response(
                {
                    "detail": (
                        f"Could not fetch products from carrier: {e}"
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"products": products},
            status=status.HTTP_200_OK,
        )


# ==========================================================
# Courier Health History
# ==========================================================

class CourierHealthLogView(
    generics.ListAPIView
):
    """
    GET /api/couriers/<id>/health/
    """

    permission_classes = [IsAuthenticated]

    serializer_class = (
        CourierHealthLogSerializer
    )

    def get_queryset(self):

        merchant = get_merchant(
            self.request
        )

        try:
            config = (
                MerchantCourier.objects.get(
                    pk=self.kwargs["pk"],
                    merchant=merchant,
                )
            )

            return (
                config.health_logs
                .all()
                .order_by("-created_at")
            )

        except MerchantCourier.DoesNotExist:
            return (
                CourierHealthLog
                .objects
                .none()
            )


# ==========================================================
# Available Couriers
# ==========================================================

class AvailableCarrierListView(APIView):
    """
    GET /api/couriers/available/
    """

    permission_classes = [AllowAny]

    def get(self, request):

        # TEMPORARY DURING DEVELOPMENT
        merchant = Merchant.objects.get(id=1)

        carriers = (
            Carrier.objects
            .filter(status="ACTIVE")
            .order_by("priority")
        )

        serializer = (
            AvailableCarrierSerializer(
                carriers,
                many=True,
                context={
                    "merchant": merchant,
                },
            )
        )

        return Response(
            serializer.data
        )


# ==========================================================
# Test Unsaved Courier Credentials
# ==========================================================

class TestCourierCredentialsView(APIView):
    """
    POST /api/couriers/test/

    Tests courier credentials before
    creating MerchantCourier.
    """

    permission_classes = [AllowAny]

    def post(self, request):

        serializer = (
            CourierCredentialSerializer(
                data=request.data
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        data = serializer.validated_data

        try:
            carrier = Carrier.objects.get(
                pk=data["carrier"],
                status="ACTIVE",
            )

        except Carrier.DoesNotExist:
            return Response(
                {
                    "passed": False,
                    "message":
                    "Carrier not found or inactive.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # TEMPORARY DURING DEVELOPMENT
        merchant = Merchant.objects.get(id=1)

        config = MerchantCourier(
            merchant=merchant,
            carrier=carrier,
            status=(
                MerchantCourier.Status.INACTIVE
            ),
        )

        config.credentials = {
            "login_id":
                data["login_id"],

            "license_key":
                data["license_key"],

            "customer_code":
                data["customer_code"],

            "origin_area":
                data["origin_area"],

            "default_service":
                data["default_service"],
        }

        try:
            service = CourierFactory.get_service(
                config
            )

            passed, message = (
                service.test_connection()
            )

        except Exception as e:
            passed = False
            message = str(e)

        if not passed:
            return Response(
                {
                    "passed": False,
                    "message": message,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "passed": True,
                "message": message,
            },
            status=status.HTTP_200_OK,
        )