from django.contrib import admin
from .models import Wallet, WalletTransaction, Invoice


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ("merchant", "balance", "is_active", "updated_at")
    list_filter = ("is_active",)
    search_fields = ("merchant__company_name", "merchant__business_email")
    readonly_fields = ("created_at", "updated_at")


@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "txn_id", "wallet", "txn_type", "amount",
        "closing_balance", "status", "created_at",
    )
    list_filter = ("txn_type", "status")
    search_fields = ("txn_id", "wallet__merchant__company_name", "reference", "gateway_txn_id")
    readonly_fields = ("txn_id", "created_at", "updated_at")
    date_hierarchy = "created_at"


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = (
        "invoice_number", "merchant", "invoice_date",
        "total_amount", "paid_amount", "status",
    )
    list_filter = ("status",)
    search_fields = ("invoice_number", "merchant__company_name")
    readonly_fields = ("invoice_number", "created_at", "updated_at")
    date_hierarchy = "invoice_date"
