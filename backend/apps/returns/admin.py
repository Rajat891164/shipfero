from django.contrib import admin
from .models import Return, Refund


class RefundInline(admin.StackedInline):
    model = Refund
    extra = 0
    readonly_fields = ("amount", "status", "refund_method", "gateway_txn_id", "created_at")


@admin.register(Return)
class ReturnAdmin(admin.ModelAdmin):
    list_display = (
        "original_shipment", "return_type", "return_awb",
        "status", "is_received", "created_at",
    )
    list_filter = ("return_type", "status", "is_received")
    search_fields = (
        "original_shipment__tracking_id", "original_shipment__awb_number",
        "return_awb", "original_shipment__merchant__company_name",
    )
    readonly_fields = ("received_at", "created_at", "updated_at")
    date_hierarchy = "created_at"
    inlines = [RefundInline]


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = ("return_record", "amount", "status", "refund_method", "created_at")
    list_filter = ("status", "refund_method")
    search_fields = ("return_record__original_shipment__tracking_id", "gateway_txn_id")
    readonly_fields = ("created_at", "updated_at")
