from rest_framework import serializers
from apps.shipments.serializers import ShipmentStatusEventSerializer
from apps.shipments.models import Shipment
from .models import WebhookLog, CustomerNotificationLog


class TrackingTimelineSerializer(serializers.ModelSerializer):
    """Full tracking timeline for a shipment."""
    status_events = ShipmentStatusEventSerializer(many=True, read_only=True)
    carrier_name = serializers.CharField(source="carrier.name", read_only=True, allow_null=True)
    merchant_name = serializers.CharField(source="merchant.company_name", read_only=True)

    class Meta:
        model = Shipment
        fields = [
            "tracking_id", "awb_number", "order_id", "merchant_name",
            "consignee_name", "consignee_city", "consignee_state", "consignee_pincode",
            "status", "carrier_name",
            "booked_at", "picked_up_at", "delivered_at",
            "status_events",
        ]


class CustomerNotificationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerNotificationLog
        fields = [
            "id", "notification_type", "event", "recipient",
            "status", "sent_at", "created_at"
        ]
