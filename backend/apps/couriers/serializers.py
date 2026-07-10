from rest_framework import serializers
from .models import MerchantCourier, CourierHealthLog


class MerchantCourierSerializer(serializers.ModelSerializer):
    carrier_name = serializers.CharField(source="carrier.name", read_only=True)
    carrier_code = serializers.CharField(source="carrier.code", read_only=True)

    class Meta:
        model = MerchantCourier
        fields = [
            "id", "carrier", "carrier_name", "carrier_code",
            "status", "is_default", "allow_cod",
            "last_tested_at", "last_test_status", "created_at"
        ]
        read_only_fields = ["id", "status", "last_tested_at", "last_test_status", "created_at"]


class MerchantCourierCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MerchantCourier
        fields = [
            "carrier", "api_key", "api_secret", "account_number",
            "is_default", "allow_cod"
        ]
        extra_kwargs = {
            "api_key": {"write_only": True},
            "api_secret": {"write_only": True},
            "account_number": {"write_only": True},
        }

    def validate(self, attrs):
        merchant = self.context["request"].user.merchant
        carrier = attrs.get("carrier")
        if MerchantCourier.objects.filter(merchant=merchant, carrier=carrier).exists():
            raise serializers.ValidationError("This courier is already configured for your account.")
        return attrs

    def create(self, validated_data):
        merchant = self.context["request"].user.merchant
        
        if validated_data.get("is_default"):
            # Unset other defaults
            MerchantCourier.objects.filter(merchant=merchant, is_default=True).update(is_default=False)
            
        validated_data["merchant"] = merchant
        return super().create(validated_data)


class CourierHealthLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourierHealthLog
        fields = ["id", "is_healthy", "response_time_ms", "error_message", "created_at"]
