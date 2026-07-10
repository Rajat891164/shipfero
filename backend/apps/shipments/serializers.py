from rest_framework import serializers
from .models import Shipment, ShipmentStatusEvent, ShipmentLabel


class ShipmentStatusEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShipmentStatusEvent
        fields = ["id", "status", "location", "description", "event_time", "source", "created_at"]
        read_only_fields = ["id", "created_at"]


class ShipmentLabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShipmentLabel
        fields = ["id", "label_url", "label_format", "generated_at"]
        read_only_fields = ["id", "generated_at"]


class ShipmentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    carrier_name = serializers.CharField(source="carrier.name", read_only=True, allow_null=True)

    class Meta:
        model = Shipment
        fields = [
            "id", "tracking_id", "awb_number", "order_id",
            "consignee_name", "consignee_city", "consignee_state", "consignee_pincode",
            "status", "payment_mode", "service_type",
            "declared_value", "cod_amount", "total_charge",
            "carrier_name", "weight",
            "booked_at", "delivered_at", "created_at",
        ]
        read_only_fields = fields


class ShipmentDetailSerializer(serializers.ModelSerializer):
    """Full detail serializer."""
    status_events = ShipmentStatusEventSerializer(many=True, read_only=True)
    label = ShipmentLabelSerializer(read_only=True)
    carrier_name = serializers.CharField(source="carrier.name", read_only=True, allow_null=True)
    pickup_location_name = serializers.CharField(
        source="pickup_location.location_name", read_only=True, allow_null=True
    )

    class Meta:
        model = Shipment
        fields = [
            "id", "tracking_id", "awb_number", "order_id",
            "merchant", "carrier", "carrier_name", "pickup_location", "pickup_location_name",
            # Consignee
            "consignee_name", "consignee_phone", "consignee_email",
            "consignee_address1", "consignee_address2",
            "consignee_city", "consignee_state", "consignee_pincode", "consignee_country",
            # Package
            "weight", "length", "breadth", "height", "volumetric_weight",
            # Order
            "declared_value", "cod_amount", "payment_mode", "service_type",
            # Charges
            "shipping_charge", "cod_charge", "total_charge",
            # Status
            "status",
            # Product
            "product_name", "product_category", "hsn_code", "product_quantity",
            # Timestamps
            "booked_at", "picked_up_at", "delivered_at", "cancelled_at",
            # Label
            "label_url", "label",
            # Notes
            "internal_notes",
            # Tracking
            "status_events",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "tracking_id", "awb_number", "merchant",
            "shipping_charge", "cod_charge", "total_charge",
            "volumetric_weight", "status_events", "label",
            "booked_at", "picked_up_at", "delivered_at", "cancelled_at",
            "created_at", "updated_at",
        ]


class CreateShipmentSerializer(serializers.ModelSerializer):
    """Serializer for creating a new shipment."""

    class Meta:
        model = Shipment
        fields = [
            "order_id",
            "carrier", "pickup_location",
            # Consignee
            "consignee_name", "consignee_phone", "consignee_email",
            "consignee_address1", "consignee_address2",
            "consignee_city", "consignee_state", "consignee_pincode", "consignee_country",
            # Package
            "weight", "length", "breadth", "height",
            # Order
            "declared_value", "cod_amount", "payment_mode", "service_type",
            # Product
            "product_name", "product_category", "hsn_code", "product_quantity",
            # Notes
            "internal_notes",
        ]

    def validate(self, attrs):
        payment_mode = attrs.get("payment_mode", Shipment.PaymentMode.PREPAID)
        cod_amount = attrs.get("cod_amount", 0)
        if payment_mode == Shipment.PaymentMode.PREPAID and cod_amount > 0:
            raise serializers.ValidationError(
                {"cod_amount": "COD amount must be 0 for prepaid shipments."}
            )
        if payment_mode == Shipment.PaymentMode.COD and cod_amount <= 0:
            raise serializers.ValidationError(
                {"cod_amount": "COD amount must be greater than 0 for COD shipments."}
            )
        return attrs

    def create(self, validated_data):
        merchant = self.context["request"].user.merchant
        shipment = Shipment.objects.create(merchant=merchant, **validated_data)
        return shipment


class TrackShipmentSerializer(serializers.Serializer):
    """Public shipment tracking by tracking_id."""
    tracking_id = serializers.CharField()
    status = serializers.CharField()
    consignee_name = serializers.CharField()
    consignee_city = serializers.CharField()
    consignee_pincode = serializers.CharField()
    carrier_name = serializers.CharField(allow_null=True)
    booked_at = serializers.DateTimeField(allow_null=True)
    delivered_at = serializers.DateTimeField(allow_null=True)
    status_events = ShipmentStatusEventSerializer(many=True)
