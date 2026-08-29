from rest_framework import serializers

from apps.carriers.models import Carrier
from core.encryption import encrypt_value, decrypt_value
from core.utils import get_merchant

from .models import MerchantCourier, CourierHealthLog


# Fields that live inside the encrypted `credentials` JSON blob.
CREDENTIAL_FIELDS = [
    "login_id",
    "license_key",
    "customer_code",
    "origin_area",
    "default_service",
    "defaultservice",
    "shipper_name",
    "shipper_mobile",
    "shipper_address",
    "shipper_pincode",
]


class MerchantCourierSerializer(serializers.ModelSerializer):
    """
    Read-only representation of a merchant's configured courier.
    """

    carrier_name = serializers.CharField(source="carrier.name", read_only=True)
    carrier_code = serializers.CharField(source="carrier.code", read_only=True)
    customer_code = serializers.SerializerMethodField()
    origin_area = serializers.SerializerMethodField()

    class Meta:
        model = MerchantCourier
        fields = [
            "id",
            "carrier",
            "carrier_name",
            "carrier_code",
            "customer_code",
            "origin_area",
            "is_default",
            "allow_cod",
            "label_type",
            "otp_delivery",
            "forward_active",
            "reverse_active",
            "shipping_mode",
            "status",
            "last_tested_at",
            "last_test_status",
        ]

    def get_customer_code(self, obj):
        return decrypt_value(obj.credentials.get("customer_code", ""))

    def get_origin_area(self, obj):
        return decrypt_value(obj.credentials.get("origin_area", ""))


class MerchantCourierCreateSerializer(serializers.ModelSerializer):
    """
    Write serializer used to create/update a merchant's courier integration.
    Accepts flat Blue Dart-style fields instead of a generic credentials blob.
    """

    login_id = serializers.CharField(write_only=True)
    license_key = serializers.CharField(write_only=True)
    customer_code = serializers.CharField(write_only=True)
    origin_area = serializers.CharField(write_only=True)
    default_service = serializers.CharField(write_only=True, required=False, allow_blank=True)
    defaultservice = serializers.CharField(write_only=True, required=False, allow_blank=True)
    shipper_name = serializers.CharField(write_only=True)
    shipper_mobile = serializers.CharField(write_only=True)
    shipper_address = serializers.CharField(write_only=True)
    shipper_pincode = serializers.CharField(write_only=True)

    class Meta:
        model = MerchantCourier
        fields = [
            "id",
            "carrier",
            "login_id",
            "license_key",
            "customer_code",
            "origin_area",
            "default_service",
            "defaultservice",
    "defaultservice",
            "shipper_name",
            "shipper_mobile",
            "shipper_address",
            "shipper_pincode",
            "is_default",
            "allow_cod",
            "label_type",
            "otp_delivery",
            "forward_active",
            "reverse_active",
            "shipping_mode",
            "status",
            "last_tested_at",
            "last_test_status",
        ]
        read_only_fields = ["id", "status", "last_tested_at", "last_test_status"]

    def validate(self, attrs):
        # Multiple profiles for the same merchant/carrier are supported.
        # Do not reject a second Blue Dart (or other carrier) profile.
        return attrs

    def _extract_credentials(self, validated_data):
        """
        Pulls credential fields out of validated_data and returns an
        encrypted dict ready to be stored on `credentials`.
        """
        credentials = {}
        for field in CREDENTIAL_FIELDS:
            if field in validated_data:
                value = validated_data.pop(field)
                if field == "defaultservice":
                    # Critical mapping:
                    # frontend defaultservice -> credentials["default_service"]
                    field = "default_service"
                credentials[field] = encrypt_value(str(value)) if value else value

        # If both names are sent, the explicit frontend value wins.
        if "defaultservice" in validated_data:
            value = validated_data.pop("defaultservice")
            credentials["default_service"] = (
                encrypt_value(str(value)) if value else value
            )

        return credentials

    def create(self, validated_data):
        # The view (MerchantCourierListCreateView.perform_create) already
        # resolves the correct merchant and passes it into serializer.save(
        # merchant=merchant), so it arrives here inside validated_data.
        # Previously this line silently re-derived its own merchant via
        # get_merchant(request) and overwrote the one the view passed in —
        # under AllowAny (no authenticated session) that resolved to a
        # different merchant than the hardcoded one every read endpoint
        # filters by, so newly created rows saved successfully but were
        # invisible to GET /api/couriers/ and /api/couriers/<id>/test/.
        merchant = validated_data.get("merchant") or get_merchant(self.context["request"])

        if validated_data.get("is_default"):
            MerchantCourier.objects.filter(
                merchant=merchant, is_default=True
            ).update(is_default=False)

        credentials = self._extract_credentials(validated_data)

        validated_data["merchant"] = merchant
        validated_data["credentials"] = credentials
        validated_data["status"] = MerchantCourier.Status.ACTIVE

        return MerchantCourier.objects.create(**validated_data)

    def update(self, instance, validated_data):
        # Use the merchant the row already belongs to, rather than
        # re-deriving one via get_merchant(request) — same class of bug as
        # create() above: under AllowAny, that can resolve to a different
        # merchant than the one that actually owns `instance`.
        merchant = instance.merchant

        if validated_data.get("is_default"):
            MerchantCourier.objects.filter(
                merchant=merchant, is_default=True
            ).exclude(pk=instance.pk).update(is_default=False)

        credential_updates = self._extract_credentials(validated_data)
        if credential_updates:
            instance.credentials = {**instance.credentials, **credential_updates}

        for key, value in validated_data.items():
            setattr(instance, key, value)

        instance.save()
        return instance


class CourierHealthLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourierHealthLog
        fields = ["id", "is_healthy", "response_time_ms", "error_message", "created_at"]


class AvailableCarrierSerializer(serializers.ModelSerializer):
    connected = serializers.SerializerMethodField()

    class Meta:
        model = Carrier
        fields = ["id", "name", "code", "logo_url", "connected", "supports_cod"]

    def get_connected(self, obj):
        merchant = self.context["merchant"]
        return MerchantCourier.objects.filter(merchant=merchant, carrier=obj).exists()


class CourierCredentialSerializer(serializers.Serializer):
    """
    Standalone validator for Blue Dart-style credentials, e.g. for a
    "test connection before save" endpoint.
    """

    carrier = serializers.IntegerField()
    login_id = serializers.CharField()
    license_key = serializers.CharField()
    customer_code = serializers.CharField()
    origin_area = serializers.CharField()
    default_service = serializers.CharField(required=False, default="D")
    shipper_name = serializers.CharField()
    shipper_mobile = serializers.CharField()
    shipper_address = serializers.CharField()
    shipper_pincode = serializers.CharField()