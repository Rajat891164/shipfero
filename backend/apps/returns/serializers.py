from rest_framework import serializers
from .models import Return, Refund


class RefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Refund
        fields = ["id", "amount", "status", "refund_method", "gateway_txn_id", "notes", "created_at"]
        read_only_fields = ["id", "created_at"]


class ReturnListSerializer(serializers.ModelSerializer):
    original_awb = serializers.CharField(source="original_shipment.awb_number", read_only=True)
    customer_name = serializers.CharField(source="original_shipment.consignee_name", read_only=True)
    return_carrier_name = serializers.CharField(source="return_carrier.name", read_only=True, allow_null=True)

    class Meta:
        model = Return
        fields = [
            "id", "return_type", "original_awb", "customer_name",
            "return_awb", "return_carrier_name", "status",
            "reason", "is_received", "created_at",
        ]


class ReturnDetailSerializer(serializers.ModelSerializer):
    original_awb = serializers.CharField(source="original_shipment.awb_number", read_only=True)
    customer_name = serializers.CharField(source="original_shipment.consignee_name", read_only=True)
    customer_phone = serializers.CharField(source="original_shipment.consignee_phone", read_only=True)
    return_carrier_name = serializers.CharField(source="return_carrier.name", read_only=True, allow_null=True)
    refund = RefundSerializer(read_only=True)
    received_by_email = serializers.CharField(source="received_by.email", read_only=True, allow_null=True)

    class Meta:
        model = Return
        fields = [
            "id", "return_type", "original_awb", "customer_name", "customer_phone",
            "return_awb", "return_carrier_name", "status",
            "reason", "customer_notes", "return_shipping_charge",
            "is_received", "received_at", "received_by_email",
            "refund", "created_at", "updated_at",
        ]


class CreateReversePickupSerializer(serializers.Serializer):
    original_shipment_id = serializers.IntegerField()
    reason = serializers.CharField(max_length=255)
    customer_notes = serializers.CharField(required=False, allow_blank=True)
    pickup_date = serializers.DateField(required=False)
