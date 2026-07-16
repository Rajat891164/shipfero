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
from .services import quote_all_carriers


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
    Compare all couriers for a route + weight using real rate cards
    (forward + fuel surcharge + COD), per PRD Module 11 Rate Comparison Tool.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RateCompareRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        quotes = quote_all_carriers(
            data["pickup_pincode"],
            data["delivery_pincode"],
            data["weight_kg"],
            is_cod=data["payment_type"] == "COD",
            cod_amount=data.get("cod_amount") or 0,
        )

        results = [{
            "carrier_id": q["carrier"].id,
            "carrier_name": q["carrier"].name,
            "service_type": q["service_type"],
            "zone": q["zone"],
            "weight_slab": q["weight_slab"],
            "forward_charge": str(q["forward"]),
            "fuel_surcharge": str(q["fuel"]),
            "cod_charge": str(q["cod"]),
            "estimated_charge": float(q["total"]),
            "edd_days": q["edd_days"],
            "is_serviceable": True,
        } for q in quotes]

        return Response(results)
