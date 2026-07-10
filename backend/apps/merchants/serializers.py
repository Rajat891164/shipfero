from rest_framework import serializers
from .models import (
    Merchant,
    MerchantProfile,
    MerchantKYC,
    MerchantBankDetails,
    PickupLocation,
    MerchantPlan,
)


# ─── Onboarding Status ────────────────────────────────────────────────────────

class OnboardingStatusSerializer(serializers.Serializer):
    email_verified = serializers.BooleanField()
    kyc_status = serializers.CharField()
    has_business_profile = serializers.BooleanField()
    has_bank_details = serializers.BooleanField()
    has_pickup_location = serializers.BooleanField()
    current_plan = serializers.CharField(allow_null=True)
    onboarding_step = serializers.IntegerField()
    onboarding_completed = serializers.BooleanField()

    @classmethod
    def from_merchant(cls, merchant: Merchant):
        profile_exists = hasattr(merchant, "profile")
        bank_exists = merchant.bank_accounts.filter(is_active=True).exists()
        pickup_exists = merchant.pickup_locations.filter(is_active=True).exists()
        plan = merchant.plans.filter(is_current=True).first()

        return cls({
            "email_verified": merchant.email_verified,
            "kyc_status": merchant.kyc_status,
            "has_business_profile": profile_exists,
            "has_bank_details": bank_exists,
            "has_pickup_location": pickup_exists,
            "current_plan": plan.plan_name if plan else None,
            "onboarding_step": merchant.onboarding_step,
            "onboarding_completed": merchant.onboarding_completed,
        })


# ─── Merchant Basic Info ───────────────────────────────────────────────────────

class MerchantBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Merchant
        fields = [
            "id", "company_name", "business_email", "phone",
            "gst_number", "pan_number", "referral_code",
            "email_verified", "kyc_status", "onboarding_step",
            "onboarding_completed", "status", "created_at",
        ]
        read_only_fields = [
            "id", "email_verified", "kyc_status",
            "onboarding_step", "onboarding_completed", "status", "created_at",
        ]


# ─── Business Profile ─────────────────────────────────────────────────────────

class BusinessProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = MerchantProfile
        fields = [
            "id", "business_type", "industry",
            "monthly_shipment_volume", "website_url", "logo_url",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        merchant = self.context["request"].user.merchant
        profile, created = MerchantProfile.objects.update_or_create(
            merchant=merchant,
            defaults=validated_data,
        )
        # Advance onboarding step if not already past step 4
        if merchant.onboarding_step < 4:
            merchant.onboarding_step = 4
            merchant.save(update_fields=["onboarding_step"])
        return profile

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


# ─── KYC Documents ────────────────────────────────────────────────────────────

class MerchantKYCSerializer(serializers.ModelSerializer):
    class Meta:
        model = MerchantKYC
        fields = [
            "id", "document_type", "document_number", "document_url",
            "status", "rejection_reason", "reviewed_at", "created_at",
        ]
        read_only_fields = [
            "id", "status", "rejection_reason", "reviewed_at", "created_at",
        ]

    def create(self, validated_data):
        merchant = self.context["request"].user.merchant
        doc = MerchantKYC.objects.create(merchant=merchant, **validated_data)
        # Mark KYC as under review at merchant level
        if merchant.kyc_status == Merchant.KYCStatus.PENDING:
            merchant.kyc_status = Merchant.KYCStatus.UNDER_REVIEW
            merchant.save(update_fields=["kyc_status"])
        # Advance onboarding step if not already past step 5
        if merchant.onboarding_step < 5:
            merchant.onboarding_step = 5
            merchant.save(update_fields=["onboarding_step"])
        return doc


# ─── Bank Details ─────────────────────────────────────────────────────────────

class BankDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MerchantBankDetails
        fields = [
            "id", "account_holder", "bank_name", "account_number",
            "ifsc_code", "account_type", "is_verified",
            "verification_reference", "verified_at", "is_active",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "is_verified", "verification_reference",
            "verified_at", "created_at", "updated_at",
        ]

    def create(self, validated_data):
        merchant = self.context["request"].user.merchant
        bank = MerchantBankDetails.objects.create(merchant=merchant, **validated_data)
        # Advance onboarding step
        if merchant.onboarding_step < 6:
            merchant.onboarding_step = 6
            merchant.save(update_fields=["onboarding_step"])
        return bank

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


# ─── Pickup Location ──────────────────────────────────────────────────────────

class PickupLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PickupLocation
        fields = [
            "id", "location_name", "contact_person", "contact_phone",
            "address_line1", "address_line2", "city", "state", "pincode",
            "gstin", "is_default", "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        merchant = self.context["request"].user.merchant
        # If this is the first location, make it default
        if not merchant.pickup_locations.filter(is_active=True).exists():
            validated_data["is_default"] = True
        location = PickupLocation.objects.create(merchant=merchant, **validated_data)
        # Advance onboarding step
        if merchant.onboarding_step < 7:
            merchant.onboarding_step = 7
            merchant.save(update_fields=["onboarding_step"])
        return location

    def update(self, instance, validated_data):
        is_default = validated_data.get("is_default", instance.is_default)
        merchant = instance.merchant
        # If setting this as default, unset others
        if is_default and not instance.is_default:
            merchant.pickup_locations.exclude(pk=instance.pk).update(is_default=False)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


# ─── Merchant Plan ────────────────────────────────────────────────────────────

class MerchantPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = MerchantPlan
        fields = [
            "id", "plan_name", "price", "features_json",
            "status", "start_date", "end_date", "is_current",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]