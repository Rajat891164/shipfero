from django.contrib import admin
from .models import Shipment, ShipmentStatusEvent, ShipmentLabel


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = (
        "tracking_id", "awb_number", "order_id", "merchant",
        "consignee_name", "consignee_city", "consignee_pincode",
        "status", "payment_mode", "total_charge", "created_at",
    )
    list_filter = ("status", "payment_mode", "service_type", "carrier")
    search_fields = (
        "tracking_id", "awb_number", "order_id",
        "consignee_name", "consignee_phone", "consignee_pincode",
        "merchant__company_name",
    )
    readonly_fields = (
        "tracking_id", "volumetric_weight",
        "booked_at", "picked_up_at", "delivered_at", "cancelled_at",
        "created_at", "updated_at",
    )
    date_hierarchy = "created_at"


@admin.register(ShipmentStatusEvent)
class ShipmentStatusEventAdmin(admin.ModelAdmin):
    list_display = ("shipment", "status", "location", "event_time", "source")
    list_filter = ("status", "source")
    search_fields = ("shipment__tracking_id", "location", "description")
    readonly_fields = ("created_at", "updated_at")


@admin.register(ShipmentLabel)
class ShipmentLabelAdmin(admin.ModelAdmin):
    list_display = ("shipment", "label_format", "generated_at")
    search_fields = ("shipment__tracking_id",)
    readonly_fields = ("generated_at",)
