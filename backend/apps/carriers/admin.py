from django.contrib import admin
from .models import Carrier, CarrierRate, ServiceablePincode


@admin.register(Carrier)
class CarrierAdmin(admin.ModelAdmin):
    list_display = (
        "name", "code", "status", "priority",
        "supports_cod", "supports_express", "supports_reverse",
        "max_weight_kg",
    )
    list_filter = ("status", "supports_cod", "supports_express", "supports_same_day", "supports_reverse")
    search_fields = ("name", "code")
    readonly_fields = ("created_at", "updated_at")


@admin.register(CarrierRate)
class CarrierRateAdmin(admin.ModelAdmin):
    list_display = (
        "carrier", "service_type", "origin_zone", "destination_zone",
        "min_weight_kg", "max_weight_kg", "base_rate", "rate_per_kg", "is_active",
    )
    list_filter = ("carrier", "service_type", "is_active")
    search_fields = ("carrier__name", "origin_zone", "destination_zone")
    readonly_fields = ("created_at", "updated_at")


@admin.register(ServiceablePincode)
class ServiceablePincodeAdmin(admin.ModelAdmin):
    list_display = (
        "carrier", "pincode", "city", "state", "zone",
        "is_cod_available", "is_pickup_available",
    )
    list_filter = ("carrier", "state", "is_cod_available", "is_pickup_available")
    search_fields = ("pincode", "city", "state")
    readonly_fields = ("created_at", "updated_at")
