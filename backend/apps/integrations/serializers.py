from rest_framework import serializers
from .models import ChannelIntegration, IntegrationSyncLog


class ChannelIntegrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChannelIntegration
        fields = [
            "id", "platform", "store_name", "store_url",
            "status", "auto_sync_orders", "push_tracking_status",
            "last_sync_at", "last_sync_status", "created_at"
        ]
        read_only_fields = ["id", "status", "last_sync_at", "last_sync_status", "created_at"]


class ChannelIntegrationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChannelIntegration
        fields = [
            "platform", "store_name", "store_url",
            "api_key", "api_secret", "access_token",
            "auto_sync_orders", "push_tracking_status"
        ]
        extra_kwargs = {
            "api_key": {"write_only": True},
            "api_secret": {"write_only": True},
            "access_token": {"write_only": True},
        }

    def create(self, validated_data):
        validated_data["merchant"] = self.context["request"].user.merchant
        return super().create(validated_data)


class IntegrationSyncLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntegrationSyncLog
        fields = [
            "id", "orders_fetched", "orders_created",
            "errors_encountered", "error_details",
            "is_success", "created_at"
        ]
