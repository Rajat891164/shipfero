from rest_framework import serializers
from .models import Carrier


class CarrierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Carrier
        fields = [
            "id",
            "name",
            "code",
            "logo_url",
            "website_url",
            "supports_cod",
            "supports_prepaid",
            "supports_express",
            "supports_same_day",
            "supports_reverse",
            "status",
            "priority",
        ]