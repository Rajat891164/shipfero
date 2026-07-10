from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Wallet, WalletTransaction, Invoice
from .serializers import (
    WalletSerializer,
    WalletTransactionSerializer,
    AddFundsSerializer,
    InvoiceSerializer,
)


# ─── Wallet ───────────────────────────────────────────────────────────────────

class WalletView(APIView):
    """GET /api/billing/wallet/ – Get wallet balance"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet, _ = Wallet.objects.get_or_create(merchant=request.user.merchant)
        serializer = WalletSerializer(wallet)
        return Response(serializer.data)


class AddFundsView(APIView):
    """POST /api/billing/wallet/add-funds/ – Add funds to wallet"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AddFundsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        wallet, _ = Wallet.objects.get_or_create(merchant=request.user.merchant)

        try:
            wallet.credit(
                amount=data["amount"],
                description=data.get("description", "Wallet recharge"),
                reference=data.get("gateway_txn_id", ""),
                txn_type=WalletTransaction.TransactionType.RECHARGE,
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            "status": True,
            "message": "Funds added successfully.",
            "new_balance": wallet.balance,
        })


# ─── Transactions ─────────────────────────────────────────────────────────────

class TransactionListView(generics.ListAPIView):
    """GET /api/billing/transactions/ – List wallet transactions"""
    permission_classes = [IsAuthenticated]
    serializer_class = WalletTransactionSerializer

    def get_queryset(self):
        wallet, _ = Wallet.objects.get_or_create(merchant=self.request.user.merchant)
        qs = wallet.transactions.all().order_by("-created_at")
        # Filter by type
        txn_type = self.request.query_params.get("type")
        if txn_type:
            qs = qs.filter(txn_type=txn_type.upper())
        # Filter by date range
        from_date = self.request.query_params.get("from_date")
        to_date = self.request.query_params.get("to_date")
        if from_date:
            qs = qs.filter(created_at__date__gte=from_date)
        if to_date:
            qs = qs.filter(created_at__date__lte=to_date)
        return qs


class TransactionDetailView(generics.RetrieveAPIView):
    """GET /api/billing/transactions/<pk>/ – Get transaction detail"""
    permission_classes = [IsAuthenticated]
    serializer_class = WalletTransactionSerializer

    def get_queryset(self):
        wallet, _ = Wallet.objects.get_or_create(merchant=self.request.user.merchant)
        return wallet.transactions.all()


# ─── Invoices ─────────────────────────────────────────────────────────────────

class InvoiceListView(generics.ListAPIView):
    """GET /api/billing/invoices/ – List all invoices"""
    permission_classes = [IsAuthenticated]
    serializer_class = InvoiceSerializer

    def get_queryset(self):
        qs = self.request.user.merchant.invoices.all().order_by("-invoice_date")
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter.upper())
        return qs


class InvoiceDetailView(generics.RetrieveAPIView):
    """GET /api/billing/invoices/<pk>/ – Get invoice detail"""
    permission_classes = [IsAuthenticated]
    serializer_class = InvoiceSerializer

    def get_queryset(self):
        return self.request.user.merchant.invoices.all()


# ─── Summary ──────────────────────────────────────────────────────────────────

class BillingSummaryView(APIView):
    """GET /api/billing/summary/ – Billing dashboard summary"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        merchant = request.user.merchant
        wallet, _ = Wallet.objects.get_or_create(merchant=merchant)

        # Transaction totals
        txns = wallet.transactions.filter(status=WalletTransaction.Status.SUCCESS)
        total_recharged = sum(
            t.amount for t in txns.filter(txn_type=WalletTransaction.TransactionType.RECHARGE)
        )
        total_spent = sum(
            t.amount for t in txns.filter(txn_type=WalletTransaction.TransactionType.DEDUCTION)
        )
        total_cod_credited = sum(
            t.amount for t in txns.filter(txn_type=WalletTransaction.TransactionType.COD_CREDIT)
        )

        return Response({
            "wallet_balance": wallet.balance,
            "total_recharged": total_recharged,
            "total_spent": total_spent,
            "total_cod_credited": total_cod_credited,
            "pending_invoices": merchant.invoices.filter(
                status__in=[Invoice.Status.ISSUED, Invoice.Status.OVERDUE]
            ).count(),
        })
