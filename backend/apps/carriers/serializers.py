from rest_framework import serializers
from .models import Carrier, CarrierRate, ServiceablePincode


class CarrierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Carrier
        fields = [
            "id", "name", "code", "logo_url", "website_url",
            "supports_cod", "supports_prepaid", "supports_express",
            "supports_same_day", "supports_reverse",
            "max_weight_kg", "min_weight_kg",
            "status", "priority",
        ]


class CarrierRateSerializer(serializers.ModelSerializer):
    carrier_name = serializers.CharField(source="carrier.name", read_only=True)

    class Meta:
        model = CarrierRate
        fields = [
            "id", "carrier", "carrier_name", "service_type",
            "origin_zone", "destination_zone",
            "min_weight_kg", "max_weight_kg",
            "base_rate", "rate_per_kg", "cod_charge", "cod_percentage",
            "is_active",
        ]


class ServiceabilityCheckSerializer(serializers.Serializer):
    """Input for serviceability check."""
    pickup_pincode = serializers.CharField(max_length=10)
    delivery_pincode = serializers.CharField(max_length=10)
    weight = serializers.DecimalField(max_digits=8, decimal_places=2)
    cod = serializers.BooleanField(default=False)


class ServiceabilityResultSerializer(serializers.Serializer):
    """Result row for serviceability check."""
    carrier_id = serializers.IntegerField()
    carrier_name = serializers.CharField()
    carrier_code = serializers.CharField()
    logo_url = serializers.CharField(allow_null=True)
    service_type = serializers.CharField()
    estimated_rate = serializers.DecimalField(max_digits=12, decimal_places=2)
    cod_charge = serializers.DecimalField(max_digits=12, decimal_places=2)
    supports_cod = serializers.BooleanField()
    estimated_days = serializers.CharField()  # "3-5 days"


class RateCalculatorSerializer(serializers.Serializer):
    """Input for rate calculation."""
    carrier_id = serializers.IntegerField()
    service_type = serializers.CharField()
    origin_pincode = serializers.CharField(max_length=10)
    destination_pincode = serializers.CharField(max_length=10)
    weight = serializers.DecimalField(max_digits=8, decimal_places=2)
    cod_amount = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
