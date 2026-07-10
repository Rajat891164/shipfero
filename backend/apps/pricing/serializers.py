from rest_framework import serializers
from .models import PricingZone, RateCard


class PricingZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricingZone
        fields = ["id", "code", "name", "description"]


class RateCardSerializer(serializers.ModelSerializer):
    carrier_name = serializers.CharField(source="carrier.name", read_only=True)
    zone_code = serializers.CharField(source="zone.code", read_only=True)

    class Meta:
        model = RateCard
        fields = [
            "id", "carrier", "carrier_name", "zone", "zone_code",
            "service_type", "weight_slab", "forward_charge", "rto_charge",
            "cod_percentage", "cod_min_charge", "fuel_surcharge_percentage",
            "is_active"
        ]


class RateCompareRequestSerializer(serializers.Serializer):
    pickup_pincode = serializers.CharField(max_length=10)
    delivery_pincode = serializers.CharField(max_length=10)
    weight_kg = serializers.DecimalField(max_digits=8, decimal_places=2)
    payment_type = serializers.ChoiceField(choices=["COD", "PREPAID"])
    cod_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, default=0)

    def validate(self, attrs):
        if attrs.get("payment_type") == "COD" and attrs.get("cod_amount", 0) <= 0:
            raise serializers.ValidationError({"cod_amount": "Required for COD orders."})
        return attrs
