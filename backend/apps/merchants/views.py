from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

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


# ─── Onboarding Status ────────────────────────────────────────────────────────

class OnboardingStatusView(APIView):
    """GET /api/merchants/onboarding/status/ – full onboarding progress"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        merchant = request.user.merchant
        serializer = OnboardingStatusSerializer.from_merchant(merchant)
        return Response(serializer.data)


# ─── Merchant Profile (basic info) ───────────────────────────────────────────

class MerchantProfileView(APIView):
    """GET/PATCH /api/merchants/me/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        merchant = request.user.merchant
        serializer = MerchantBasicSerializer(merchant)
        return Response(serializer.data)

    def patch(self, request):
        merchant = request.user.merchant
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
        merchant = request.user.merchant
        if not hasattr(merchant, "profile"):
            return Response(
                {"detail": "Business profile not set up yet."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = BusinessProfileSerializer(merchant.profile)
        return Response(serializer.data)

    def post(self, request):
        merchant = request.user.merchant
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
        merchant = request.user.merchant
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
        return self.request.user.merchant.kyc_documents.all().order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save()


class MerchantKYCDetailView(generics.RetrieveDestroyAPIView):
    """GET/DELETE /api/merchants/onboarding/kyc/<pk>/"""
    permission_classes = [IsAuthenticated]
    serializer_class = MerchantKYCSerializer

    def get_queryset(self):
        return self.request.user.merchant.kyc_documents.all()


# ─── Bank Details (Onboarding Step 5) ─────────────────────────────────────────

class BankDetailsListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/merchants/onboarding/bank-details/"""
    permission_classes = [IsAuthenticated]
    serializer_class = BankDetailsSerializer

    def get_queryset(self):
        return self.request.user.merchant.bank_accounts.filter(
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
        return self.request.user.merchant.bank_accounts.all()

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
        return self.request.user.merchant.pickup_locations.filter(
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
        return self.request.user.merchant.pickup_locations.all()

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])


class SetDefaultPickupLocationView(APIView):
    """POST /api/merchants/onboarding/pickup-locations/<pk>/set-default/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        merchant = request.user.merchant
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
        merchant = request.user.merchant

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
        plan = request.user.merchant.plans.filter(is_current=True).first()
        if not plan:
            return Response({"detail": "No active plan."}, status=status.HTTP_404_NOT_FOUND)
        serializer = MerchantPlanSerializer(plan)
        return Response(serializer.data)