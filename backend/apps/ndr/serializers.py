from rest_framework import serializers
from .models import NDR, NDRAction


class NDRActionSerializer(serializers.ModelSerializer):
    taken_by_email = serializers.CharField(source="taken_by.email", read_only=True, allow_null=True)

    class Meta:
        model = NDRAction
        fields = [
            "id", "action_type", "taken_by_email",
            "notes", "outcome", "outcome_recorded_at", "created_at",
        ]
        read_only_fields = ["id", "taken_by_email", "outcome", "outcome_recorded_at", "created_at"]


class NDRListSerializer(serializers.ModelSerializer):
    tracking_id = serializers.CharField(source="shipment.tracking_id", read_only=True)
    awb_number = serializers.CharField(source="shipment.awb_number", read_only=True)
    carrier_name = serializers.CharField(source="shipment.carrier.name", read_only=True, allow_null=True)
    consignee_name = serializers.CharField(source="shipment.consignee_name", read_only=True)

    class Meta:
        model = NDR
        fields = [
            "id", "tracking_id", "awb_number", "carrier_name",
            "consignee_name", "reason_code", "courier_raw_reason",
            "attempt_number", "ndr_status", "ndr_date",
            "is_escalated", "auto_rto_triggered",
            "created_at",
        ]


class NDRDetailSerializer(serializers.ModelSerializer):
    actions = NDRActionSerializer(many=True, read_only=True)
    tracking_id = serializers.CharField(source="shipment.tracking_id", read_only=True)
    awb_number = serializers.CharField(source="shipment.awb_number", read_only=True)
    carrier_name = serializers.CharField(source="shipment.carrier.name", read_only=True, allow_null=True)
    consignee_name = serializers.CharField(source="shipment.consignee_name", read_only=True)
    consignee_phone = serializers.CharField(source="shipment.consignee_phone", read_only=True)
    consignee_address1 = serializers.CharField(source="shipment.consignee_address1", read_only=True)
    consignee_city = serializers.CharField(source="shipment.consignee_city", read_only=True)
    consignee_pincode = serializers.CharField(source="shipment.consignee_pincode", read_only=True)

    class Meta:
        model = NDR
        fields = [
            "id", "tracking_id", "awb_number", "carrier_name",
            "consignee_name", "consignee_phone", "consignee_address1",
            "consignee_city", "consignee_pincode",
            "reason_code", "courier_raw_reason",
            "attempt_number", "ndr_status", "ndr_date",
            "updated_address", "updated_phone", "rescheduled_date",
            "is_escalated", "escalated_at", "auto_rto_triggered",
            "actions", "created_at", "updated_at",
        ]


class TakeNDRActionSerializer(serializers.Serializer):
    action_type = serializers.ChoiceField(choices=NDRAction.ActionType.choices)
    notes = serializers.CharField(required=False, allow_blank=True)
    # For reschedule
    rescheduled_date = serializers.DateField(required=False)
    # For address update
    updated_address = serializers.CharField(required=False, allow_blank=True)
    updated_phone = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs["action_type"] == NDRAction.ActionType.RESCHEDULE and not attrs.get("rescheduled_date"):
            raise serializers.ValidationError(
                {"rescheduled_date": "Required when action is RESCHEDULE."}
            )
        if attrs["action_type"] == NDRAction.ActionType.UPDATE_ADDRESS and not attrs.get("updated_address"):
            raise serializers.ValidationError(
                {"updated_address": "Required when action is UPDATE_ADDRESS."}
            )
        return attrs


class BulkNDRActionSerializer(serializers.Serializer):
    ndr_ids = serializers.ListField(child=serializers.IntegerField(), max_length=100)
    action_type = serializers.ChoiceField(choices=NDRAction.ActionType.choices)
    notes = serializers.CharField(required=False, allow_blank=True)
