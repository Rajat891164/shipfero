from django.contrib import admin
from .models import (
    Merchant,
    MerchantProfile,
    MerchantKYC,
    MerchantBankDetails,
    PickupLocation,
    MerchantPlan,
)


@admin.register(Merchant)
class MerchantAdmin(admin.ModelAdmin):
    list_display = (
        "company_name", "business_email", "phone",
        "kyc_status", "status", "onboarding_step", "onboarding_completed",
    )
    list_filter = ("kyc_status", "status", "onboarding_completed")
    search_fields = ("company_name", "business_email", "phone", "gst_number", "pan_number")
    readonly_fields = ("created_at", "updated_at")


@admin.register(MerchantProfile)
class MerchantProfileAdmin(admin.ModelAdmin):
    list_display = ("merchant", "business_type", "industry", "monthly_shipment_volume")
    search_fields = ("merchant__company_name",)
    readonly_fields = ("created_at", "updated_at")


@admin.register(MerchantKYC)
class MerchantKYCAdmin(admin.ModelAdmin):
    list_display = ("merchant", "document_type", "document_number", "status", "reviewed_at")
    list_filter = ("status", "document_type")
    search_fields = ("merchant__company_name", "document_number")
    readonly_fields = ("created_at", "updated_at")


@admin.register(MerchantBankDetails)
class MerchantBankDetailsAdmin(admin.ModelAdmin):
    list_display = ("merchant", "bank_name", "account_number", "account_type", "is_verified", "is_active")
    list_filter = ("is_verified", "is_active", "account_type")
    search_fields = ("merchant__company_name", "account_number", "ifsc_code")
    readonly_fields = ("created_at", "updated_at")


@admin.register(PickupLocation)
class PickupLocationAdmin(admin.ModelAdmin):
    list_display = ("location_name", "merchant", "city", "state", "pincode", "is_default", "is_active")
    list_filter = ("is_default", "is_active", "state")
    search_fields = ("location_name", "merchant__company_name", "city", "pincode")
    readonly_fields = ("created_at", "updated_at")


@admin.register(MerchantPlan)
class MerchantPlanAdmin(admin.ModelAdmin):
    list_display = ("merchant", "plan_name", "price", "status", "start_date", "end_date", "is_current")
    list_filter = ("status", "is_current", "plan_name")
    search_fields = ("merchant__company_name", "plan_name")
    readonly_fields = ("created_at", "updated_at")
