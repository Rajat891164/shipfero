from rest_framework import serializers
from core.encryption import encrypt_value, decrypt_value, mask_value
from core.utils import get_merchant
from .models import (
    ChannelIntegration,
    IntegrationSyncLog,
    ChannelPaymentMapping,
    ChannelStatusMapping,
)

CREDENTIAL_FIELDS = ["api_key", "api_secret", "access_token"]


class ChannelPaymentMappingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChannelPaymentMapping
        fields = ["id", "store_method_name", "mapped_type", "created_at"]
        read_only_fields = ["id", "created_at"]


class ChannelStatusMappingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChannelStatusMapping
        fields = ["id", "platform_status", "store_status", "is_enabled", "created_at"]
        read_only_fields = ["id", "created_at"]


class ChannelIntegrationSerializer(serializers.ModelSerializer):
    api_key_masked = serializers.SerializerMethodField()
    access_token_masked = serializers.SerializerMethodField()

    class Meta:
        model = ChannelIntegration
        fields = [
            "id", "platform", "store_name", "store_url",
            "status", "auto_sync_orders", "push_tracking_status",
            "sync_frequency", "min_order_amount", "sync_start_date",
            "api_key_masked", "access_token_masked",
            "last_sync_at", "last_sync_status", "created_at",
        ]
        read_only_fields = ["id", "status", "last_sync_at", "last_sync_status", "created_at"]

    def get_api_key_masked(self, obj):
        return mask_value(decrypt_value(obj.api_key))

    def get_access_token_masked(self, obj):
        return mask_value(decrypt_value(obj.access_token))


class ChannelIntegrationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChannelIntegration
        fields = [
            "id", "platform", "store_name", "store_url",
            "api_key", "api_secret", "access_token",
            "auto_sync_orders", "push_tracking_status",
            "sync_frequency", "min_order_amount", "sync_start_date",
        ]
        read_only_fields = ["id"]
        extra_kwargs = {
            "api_key": {"write_only": True},
            "api_secret": {"write_only": True},
            "access_token": {"write_only": True},
        }

    def _encrypt_credentials(self, validated_data):
        for field in CREDENTIAL_FIELDS:
            if validated_data.get(field):
                validated_data[field] = encrypt_value(validated_data[field])
        return validated_data

    def create(self, validated_data):
        validated_data = self._encrypt_credentials(validated_data)
        validated_data["merchant"] = get_merchant(self.context["request"])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data = self._encrypt_credentials(validated_data)
        return super().update(instance, validated_data)


class IntegrationSyncLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntegrationSyncLog
        fields = [
            "id", "orders_fetched", "orders_created",
            "errors_encountered", "error_details",
            "is_success", "created_at"
        ]
