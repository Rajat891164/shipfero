from django.contrib import admin
from .models import MerchantCourier, CourierHealthLog


@admin.register(MerchantCourier)
class MerchantCourierAdmin(admin.ModelAdmin):
    list_display = ("merchant", "carrier", "status", "is_default", "last_tested_at")
    list_filter = ("status", "is_default", "carrier")
    search_fields = ("merchant__company_name", "account_number")
    readonly_fields = ("created_at", "updated_at", "last_tested_at", "last_test_status")


@admin.register(CourierHealthLog)
class CourierHealthLogAdmin(admin.ModelAdmin):
    list_display = ("merchant_courier", "is_healthy", "response_time_ms", "created_at")
    list_filter = ("is_healthy",)
    readonly_fields = ("created_at", "updated_at")
