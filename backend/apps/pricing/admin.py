from django.contrib import admin
from .models import PricingZone, RateCard


@admin.register(PricingZone)
class PricingZoneAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "created_at")
    search_fields = ("code", "name")


@admin.register(RateCard)
class RateCardAdmin(admin.ModelAdmin):
    list_display = (
        "carrier", "zone", "service_type", "weight_slab",
        "forward_charge", "is_active"
    )
    list_filter = ("is_active", "carrier", "zone", "weight_slab")
    search_fields = ("carrier__name", "zone__code")
