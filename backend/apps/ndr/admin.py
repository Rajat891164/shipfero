from django.contrib import admin
from .models import NDR, NDRAction


class NDRActionInline(admin.TabularInline):
    model = NDRAction
    extra = 0
    readonly_fields = ("action_type", "taken_by", "notes", "outcome", "outcome_recorded_at", "created_at")
    can_delete = False


@admin.register(NDR)
class NDRAdmin(admin.ModelAdmin):
    list_display = (
        "shipment", "reason_code", "ndr_status",
        "attempt_number", "ndr_date", "is_escalated",
    )
    list_filter = ("ndr_status", "reason_code", "is_escalated", "auto_rto_triggered")
    search_fields = ("shipment__tracking_id", "shipment__awb_number", "shipment__merchant__company_name")
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "ndr_date"
    inlines = [NDRActionInline]


@admin.register(NDRAction)
class NDRActionAdmin(admin.ModelAdmin):
    list_display = ("ndr", "action_type", "taken_by", "created_at")
    list_filter = ("action_type",)
    search_fields = ("ndr__shipment__tracking_id",)
    readonly_fields = ("created_at", "updated_at")
