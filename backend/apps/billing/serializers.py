from rest_framework import serializers
from .models import Wallet, WalletTransaction, Invoice


class WalletSerializer(serializers.ModelSerializer):
    merchant_name = serializers.CharField(source="merchant.company_name", read_only=True)

    class Meta:
        model = Wallet
        fields = ["id", "merchant_name", "balance", "is_active", "updated_at"]
        read_only_fields = ["id", "merchant_name", "balance", "is_active", "updated_at"]


class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = [
            "id", "txn_id", "txn_type", "amount",
            "closing_balance", "description", "reference",
            "status", "gateway", "gateway_txn_id", "created_at",
        ]
        read_only_fields = fields


class AddFundsSerializer(serializers.Serializer):
    """Request to add funds (recharge) to wallet."""
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=1)
    gateway = serializers.CharField(max_length=50, required=False, default="MANUAL")
    gateway_txn_id = serializers.CharField(max_length=255, required=False, allow_blank=True)
    description = serializers.CharField(max_length=255, required=False, default="Wallet recharge")

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be positive.")
        return value


class InvoiceSerializer(serializers.ModelSerializer):
    merchant_name = serializers.CharField(source="merchant.company_name", read_only=True)

    class Meta:
        model = Invoice
        fields = [
            "id", "merchant_name", "invoice_number",
            "invoice_date", "due_date",
            "subtotal", "tax_amount", "total_amount", "paid_amount",
            "status", "pdf_url", "notes", "created_at",
        ]
        read_only_fields = [
            "id", "merchant_name", "invoice_number",
            "subtotal", "tax_amount", "total_amount",
            "created_at",
        ]
