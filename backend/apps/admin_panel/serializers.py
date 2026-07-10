from rest_framework import serializers
from apps.merchants.models import Merchant, MerchantKYC
from apps.carriers.models import Carrier, ServiceablePincode
from apps.billing.models import Wallet, WalletTransaction


# ─── KYC Review ───────────────────────────────────────────────────────────────

class AdminKYCSerializer(serializers.ModelSerializer):
    merchant_name = serializers.CharField(source="merchant.company_name", read_only=True)
    merchant_email = serializers.CharField(source="merchant.business_email", read_only=True)
    reviewed_by_email = serializers.CharField(source="reviewed_by.email", read_only=True, allow_null=True)

    class Meta:
        model = MerchantKYC
        fields = [
            "id", "merchant", "merchant_name", "merchant_email",
            "document_type", "document_number", "document_url",
            "status", "rejection_reason",
            "reviewed_by", "reviewed_by_email", "reviewed_at",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "merchant", "merchant_name", "merchant_email",
            "document_type", "document_number", "document_url",
            "reviewed_by", "reviewed_by_email", "reviewed_at",
            "created_at", "updated_at",
        ]


class ReviewKYCSerializer(serializers.Serializer):
    """Admin action: approve or reject a KYC document."""
    action = serializers.ChoiceField(choices=["APPROVE", "REJECT"])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs["action"] == "REJECT" and not attrs.get("rejection_reason"):
            raise serializers.ValidationError(
                {"rejection_reason": "Rejection reason is required when rejecting."}
            )
        return attrs


# ─── Merchant Management ───────────────────────────────────────────────────────

class AdminMerchantListSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    wallet_balance = serializers.SerializerMethodField()

    class Meta:
        model = Merchant
        fields = [
            "id", "company_name", "business_email", "phone",
            "user_email", "kyc_status", "status",
            "onboarding_step", "onboarding_completed",
            "wallet_balance", "created_at",
        ]

    def get_wallet_balance(self, obj):
        try:
            return obj.wallet.balance
        except Exception:
            return 0


class AdminMerchantDetailSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = Merchant
        fields = [
            "id", "company_name", "business_email", "phone",
            "user_email", "gst_number", "pan_number",
            "kyc_status", "status", "onboarding_step",
            "onboarding_completed", "referral_code",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "user_email", "created_at", "updated_at",
        ]


class AdminMerchantStatusSerializer(serializers.Serializer):
    """Admin action: change merchant status."""
    status = serializers.ChoiceField(choices=Merchant.Status.choices)
    reason = serializers.CharField(required=False, allow_blank=True)


# ─── Carrier Management ────────────────────────────────────────────────────────

class AdminCarrierSerializer(serializers.ModelSerializer):
    api_key_masked = serializers.SerializerMethodField()
    api_secret_masked = serializers.SerializerMethodField()

    class Meta:
        model = Carrier
        fields = [
            "id", "name", "code", "logo_url", "website_url",
            "supports_cod", "supports_prepaid", "supports_express",
            "supports_same_day", "supports_reverse",
            "max_weight_kg", "min_weight_kg",
            "api_endpoint", "api_key", "api_secret",
            "api_key_masked", "api_secret_masked",
            "status", "priority", "created_at", "updated_at",
        ]
        extra_kwargs = {
            "api_key": {"write_only": True, "required": False},
            "api_secret": {"write_only": True, "required": False},
        }

    def get_api_key_masked(self, obj):
        from core.encryption import decrypt_value, mask_value
        return mask_value(decrypt_value(obj.api_key))

    def get_api_secret_masked(self, obj):
        from core.encryption import decrypt_value, mask_value
        return mask_value(decrypt_value(obj.api_secret))

    def _encrypt_credentials(self, validated_data):
        from core.encryption import encrypt_value
        for field in ("api_key", "api_secret"):
            if validated_data.get(field):
                validated_data[field] = encrypt_value(validated_data[field])
        return validated_data

    def create(self, validated_data):
        return super().create(self._encrypt_credentials(validated_data))

    def update(self, instance, validated_data):
        return super().update(instance, self._encrypt_credentials(validated_data))


class AdminServiceablePincodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceablePincode
        fields = "__all__"


# ─── Wallet Adjustment ────────────────────────────────────────────────────────

class AdminWalletAdjustmentSerializer(serializers.Serializer):
    merchant_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    txn_type = serializers.ChoiceField(choices=["CREDIT", "DEBIT"])
    description = serializers.CharField(max_length=255)
    reference = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be positive.")
        return value


# ─── Dashboard Stats ──────────────────────────────────────────────────────────

class AdminDashboardSerializer(serializers.Serializer):
    total_merchants = serializers.IntegerField()
    active_merchants = serializers.IntegerField()
    pending_kyc = serializers.IntegerField()
    total_shipments = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=14, decimal_places=2)
    active_carriers = serializers.IntegerField()
