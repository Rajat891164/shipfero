from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import PricingZone, RateCard
from .serializers import (
    PricingZoneSerializer,
    RateCardSerializer,
    RateCompareRequestSerializer,
)


class PricingZoneListView(generics.ListAPIView):
    """GET /api/pricing/zones/"""
    permission_classes = [IsAuthenticated]
    queryset = PricingZone.objects.all().order_by("code")
    serializer_class = PricingZoneSerializer


class RateCardListView(generics.ListAPIView):
    """GET /api/pricing/rate-cards/"""
    permission_classes = [IsAuthenticated]
    serializer_class = RateCardSerializer

    def get_queryset(self):
        qs = RateCard.objects.filter(is_active=True).select_related("carrier", "zone")
        carrier_id = self.request.query_params.get("carrier_id")
        if carrier_id:
            qs = qs.filter(carrier_id=carrier_id)
        return qs


class CompareRatesView(APIView):
    """
    POST /api/pricing/compare/
    Compare all available couriers for a given weight and route.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RateCompareRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # In a real scenario, this would:
        # 1. Determine zone based on pickup and delivery pincodes
        # 2. Check serviceability for those pincodes per carrier
        # 3. Calculate exact charge based on weight slabs
        
        # Simulating response for demonstration
        results = [
            {
                "carrier_name": "Delhivery",
                "carrier_id": 1,
                "service_type": "STANDARD",
                "estimated_charge": 65.50,
                "edd_days": 3,
                "is_serviceable": True
            },
            {
                "carrier_name": "XpressBees",
                "carrier_id": 2,
                "service_type": "STANDARD",
                "estimated_charge": 58.00,
                "edd_days": 4,
                "is_serviceable": True
            },
            {
                "carrier_name": "Bluedart",
                "carrier_id": 3,
                "service_type": "EXPRESS",
                "estimated_charge": 120.00,
                "edd_days": 1,
                "is_serviceable": True
            }
        ]

        # Sort by charge ascending
        results = sorted(results, key=lambda x: x["estimated_charge"])
        
        return Response(results)
