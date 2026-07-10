from django.utils import timezone
from rest_framework import generics, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.merchants.models import Merchant, MerchantKYC
from apps.carriers.models import Carrier, ServiceablePincode
from apps.billing.models import Wallet, WalletTransaction
from apps.shipments.models import Shipment

from .permissions import IsAdminUser
from .serializers import (
    AdminKYCSerializer,
    ReviewKYCSerializer,
    AdminMerchantListSerializer,
    AdminMerchantDetailSerializer,
    AdminMerchantStatusSerializer,
    AdminCarrierSerializer,
    AdminServiceablePincodeSerializer,
    AdminWalletAdjustmentSerializer,
    AdminDashboardSerializer,
)


# ─── Dashboard ────────────────────────────────────────────────────────────────

class AdminDashboardView(APIView):
    """GET /api/admin/dashboard/ – Platform overview stats"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        from django.db.models import Sum

        total_merchants = Merchant.objects.count()
        active_merchants = Merchant.objects.filter(status=Merchant.Status.ACTIVE).count()
        pending_kyc = MerchantKYC.objects.filter(
            status__in=[MerchantKYC.DocumentStatus.PENDING, MerchantKYC.DocumentStatus.UNDER_REVIEW]
        ).count()
        total_shipments = Shipment.objects.count()
        total_revenue = (
            WalletTransaction.objects.filter(
                txn_type=WalletTransaction.TransactionType.RECHARGE,
                status=WalletTransaction.Status.SUCCESS,
            ).aggregate(total=Sum("amount"))["total"]
            or 0
        )
        active_carriers = Carrier.objects.filter(status=Carrier.Status.ACTIVE).count()

        data = {
            "total_merchants": total_merchants,
            "active_merchants": active_merchants,
            "pending_kyc": pending_kyc,
            "total_shipments": total_shipments,
            "total_revenue": total_revenue,
            "active_carriers": active_carriers,
        }
        serializer = AdminDashboardSerializer(data)
        return Response(serializer.data)


# ─── KYC Management ───────────────────────────────────────────────────────────

class AdminKYCListView(generics.ListAPIView):
    """GET /api/admin/kyc/ – List all KYC documents with filters"""
    permission_classes = [IsAdminUser]
    serializer_class = AdminKYCSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["merchant__company_name", "merchant__business_email", "document_number"]
    ordering_fields = ["created_at", "status"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = MerchantKYC.objects.select_related("merchant", "reviewed_by")
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter.upper())
        doc_type = self.request.query_params.get("document_type")
        if doc_type:
            qs = qs.filter(document_type=doc_type.upper())
        return qs


class AdminKYCDetailView(generics.RetrieveAPIView):
    """GET /api/admin/kyc/<pk>/"""
    permission_classes = [IsAdminUser]
    serializer_class = AdminKYCSerializer
    queryset = MerchantKYC.objects.select_related("merchant", "reviewed_by")


class AdminReviewKYCView(APIView):
    """POST /api/admin/kyc/<pk>/review/ – Approve or Reject a KYC document"""
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            kyc = MerchantKYC.objects.select_related("merchant").get(pk=pk)
        except MerchantKYC.DoesNotExist:
            return Response({"detail": "KYC document not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ReviewKYCSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if data["action"] == "APPROVE":
            kyc.status = MerchantKYC.DocumentStatus.VERIFIED
            kyc.rejection_reason = None
        else:
            kyc.status = MerchantKYC.DocumentStatus.REJECTED
            kyc.rejection_reason = data.get("rejection_reason", "")

        kyc.reviewed_by = request.user
        kyc.reviewed_at = timezone.now()
        kyc.save(update_fields=["status", "rejection_reason", "reviewed_by", "reviewed_at"])

        # Update merchant-level KYC status
        merchant = kyc.merchant
        all_docs = merchant.kyc_documents.all()
        if all_docs.filter(status=MerchantKYC.DocumentStatus.REJECTED).exists():
            merchant.kyc_status = Merchant.KYCStatus.REJECTED
        elif all_docs.filter(status=MerchantKYC.DocumentStatus.VERIFIED).count() == all_docs.count():
            merchant.kyc_status = Merchant.KYCStatus.VERIFIED
        else:
            merchant.kyc_status = Merchant.KYCStatus.UNDER_REVIEW
        merchant.save(update_fields=["kyc_status"])

        return Response(AdminKYCSerializer(kyc).data)


# ─── Merchant Management ───────────────────────────────────────────────────────

class AdminMerchantListView(generics.ListAPIView):
    """GET /api/admin/merchants/ – List all merchants"""
    permission_classes = [IsAdminUser]
    serializer_class = AdminMerchantListSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["company_name", "business_email", "phone", "gst_number"]
    ordering_fields = ["created_at", "status", "kyc_status"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = Merchant.objects.select_related("user").prefetch_related("wallet")
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter.upper())
        kyc_status = self.request.query_params.get("kyc_status")
        if kyc_status:
            qs = qs.filter(kyc_status=kyc_status.upper())
        return qs


class AdminMerchantDetailView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/admin/merchants/<pk>/"""
    permission_classes = [IsAdminUser]
    serializer_class = AdminMerchantDetailSerializer
    queryset = Merchant.objects.select_related("user")
    http_method_names = ["get", "patch", "head", "options"]


class AdminMerchantStatusView(APIView):
    """POST /api/admin/merchants/<pk>/status/ – Activate/Suspend/Deactivate merchant"""
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            merchant = Merchant.objects.get(pk=pk)
        except Merchant.DoesNotExist:
            return Response({"detail": "Merchant not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminMerchantStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        merchant.status = serializer.validated_data["status"]
        merchant.save(update_fields=["status"])

        return Response({
            "detail": f"Merchant status updated to {merchant.status}.",
            "merchant_id": merchant.id,
            "status": merchant.status,
        })


# ─── Carrier Management ────────────────────────────────────────────────────────

class AdminCarrierListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/admin/carriers/"""
    permission_classes = [IsAdminUser]
    serializer_class = AdminCarrierSerializer
    queryset = Carrier.objects.all().order_by("priority")


class AdminCarrierDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/admin/carriers/<pk>/"""
    permission_classes = [IsAdminUser]
    serializer_class = AdminCarrierSerializer
    queryset = Carrier.objects.all()
    http_method_names = ["get", "patch", "delete", "head", "options"]


class AdminServiceablePincodeListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/admin/carriers/pincodes/"""
    permission_classes = [IsAdminUser]
    serializer_class = AdminServiceablePincodeSerializer

    def get_queryset(self):
        qs = ServiceablePincode.objects.select_related("carrier")
        carrier_id = self.request.query_params.get("carrier")
        if carrier_id:
            qs = qs.filter(carrier_id=carrier_id)
        pincode = self.request.query_params.get("pincode")
        if pincode:
            qs = qs.filter(pincode=pincode)
        return qs


# ─── Wallet Adjustment ────────────────────────────────────────────────────────

class AdminWalletAdjustmentView(APIView):
    """POST /api/admin/billing/adjust/ – Manually credit/debit merchant wallet"""
    permission_classes = [IsAdminUser]

    def post(self, request):
        serializer = AdminWalletAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            merchant = Merchant.objects.get(pk=data["merchant_id"])
        except Merchant.DoesNotExist:
            return Response({"detail": "Merchant not found."}, status=status.HTTP_404_NOT_FOUND)

        wallet, _ = Wallet.objects.get_or_create(merchant=merchant)

        try:
            if data["txn_type"] == "CREDIT":
                wallet.credit(
                    amount=data["amount"],
                    description=data["description"],
                    reference=data.get("reference", ""),
                    txn_type=WalletTransaction.TransactionType.ADJUSTMENT,
                )
            else:
                wallet.debit(
                    amount=data["amount"],
                    description=data["description"],
                    reference=data.get("reference", ""),
                    txn_type=WalletTransaction.TransactionType.ADJUSTMENT,
                )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "detail": "Wallet adjusted successfully.",
            "new_balance": wallet.balance,
        })
