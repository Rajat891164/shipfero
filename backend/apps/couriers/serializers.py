from rest_framework import serializers
from core.encryption import encrypt_value, decrypt_value, mask_value
from core.utils import get_merchant
from .models import MerchantCourier, CourierHealthLog

CREDENTIAL_FIELDS = ["api_key", "api_secret", "account_number"]


class MerchantCourierSerializer(serializers.ModelSerializer):
    carrier_name = serializers.CharField(source="carrier.name", read_only=True)
    carrier_code = serializers.CharField(source="carrier.code", read_only=True)
    api_key_masked = serializers.SerializerMethodField()
    account_number_masked = serializers.SerializerMethodField()

    class Meta:
        model = MerchantCourier
        fields = [
            "id", "carrier", "carrier_name", "carrier_code",
            "status", "is_default", "allow_cod",
            "label_type", "otp_delivery", "forward_active", "reverse_active", "shipping_mode",
            "api_key_masked", "account_number_masked",
            "last_tested_at", "last_test_status", "created_at",
        ]
        read_only_fields = ["id", "status", "last_tested_at", "last_test_status", "created_at"]

    def get_api_key_masked(self, obj):
        return mask_value(decrypt_value(obj.api_key))

    def get_account_number_masked(self, obj):
        return mask_value(decrypt_value(obj.account_number))


class MerchantCourierCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MerchantCourier
        fields = [
            "id", "carrier", "api_key", "api_secret", "account_number",
            "is_default", "allow_cod",
            "label_type", "otp_delivery", "forward_active", "reverse_active", "shipping_mode",
            "status", "last_tested_at", "last_test_status",
        ]
        read_only_fields = ["id", "status", "last_tested_at", "last_test_status"]
        extra_kwargs = {
            "api_key": {"write_only": True},
            "api_secret": {"write_only": True},
            "account_number": {"write_only": True},
        }

    def validate(self, attrs):
        merchant = get_merchant(self.context["request"])
        carrier = attrs.get("carrier")
        qs = MerchantCourier.objects.filter(merchant=merchant, carrier=carrier)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if carrier and qs.exists():
            raise serializers.ValidationError("This courier is already configured for your account.")
        return attrs

    def _encrypt_credentials(self, validated_data):
        for field in CREDENTIAL_FIELDS:
            if validated_data.get(field):
                validated_data[field] = encrypt_value(validated_data[field])
        return validated_data

    def create(self, validated_data):
        merchant = get_merchant(self.context["request"])

        if validated_data.get("is_default"):
            MerchantCourier.objects.filter(merchant=merchant, is_default=True).update(is_default=False)

        validated_data = self._encrypt_credentials(validated_data)
        validated_data["merchant"] = merchant
        return super().create(validated_data)

    def update(self, instance, validated_data):
        merchant = get_merchant(self.context["request"])

        if validated_data.get("is_default"):
            MerchantCourier.objects.filter(merchant=merchant, is_default=True).exclude(pk=instance.pk).update(is_default=False)

        validated_data = self._encrypt_credentials(validated_data)
        return super().update(instance, validated_data)


class CourierHealthLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourierHealthLog
        fields = ["id", "is_healthy", "response_time_ms", "error_message", "created_at"]
