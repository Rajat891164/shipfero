import math
from decimal import Decimal, ROUND_HALF_UP

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

NUMERIC_SLABS = ["0.5", "1.0", "2.0", "5.0", "10.0"]
# Estimated delivery days per zone — the model has no per-card TAT.
ZONE_EDD = {"A": 2, "B": 3, "C": 4, "D": 5, "E": 7}
# J&K + parts of the North-East → treated as remote (Zone E).
_SPECIAL_PREFIXES = ("18", "19", "73", "78", "79")


def _derive_zone(pickup: str, delivery: str) -> str:
    """Deterministically map a pincode pair to a zone code (A–E).

    Without a full pincode→zone dataset we approximate from pincode prefixes,
    which is stable and good enough for a rate estimate:
      remote (J&K / NE) either end → E
      identical pincode            → A (within city)
      same first 2 digits          → B (same regional circle)
      same first digit             → C (same broad zone)
      otherwise                    → D (rest of country)
    """
    p = (pickup or "").strip()
    d = (delivery or "").strip()
    if p[:2] in _SPECIAL_PREFIXES or d[:2] in _SPECIAL_PREFIXES:
        return "E"
    if p and p == d:
        return "A"
    if p[:2] == d[:2]:
        return "B"
    if p[:1] == d[:1]:
        return "C"
    return "D"


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

        weight = Decimal(data["weight_kg"])
        is_cod = data["payment_type"] == "COD"
        cod_amount = Decimal(data.get("cod_amount") or 0)
        zone_code = _derive_zone(data["pickup_pincode"], data["delivery_pincode"])

        try:
            zone = PricingZone.objects.get(code=zone_code)
        except PricingZone.DoesNotExist:
            return Response([])

        cards = RateCard.objects.filter(
            zone=zone, is_active=True
        ).select_related("carrier")

        by_carrier = {}
        for card in cards:
            by_carrier.setdefault(card.carrier_id, []).append(card)

        results = []
        for carrier_cards in by_carrier.values():
            numeric = sorted(
                (c for c in carrier_cards if c.weight_slab in NUMERIC_SLABS),
                key=lambda c: Decimal(c.weight_slab),
            )
            if not numeric:
                continue
            # Smallest slab that covers the weight, else the heaviest available.
            chosen = next(
                (c for c in numeric if Decimal(c.weight_slab) >= weight), numeric[-1]
            )
            forward = chosen.forward_charge
            # Weight beyond the chosen slab → add per-0.5kg ADDITIONAL increments.
            if weight > Decimal(chosen.weight_slab):
                add = next(
                    (c for c in carrier_cards if c.weight_slab == "ADDITIONAL"), None
                )
                if add:
                    units = math.ceil(
                        (weight - Decimal(chosen.weight_slab)) / Decimal("0.5")
                    )
                    forward += add.forward_charge * units

            fuel = forward * chosen.fuel_surcharge_percentage / Decimal("100")
            cod = Decimal("0")
            if is_cod:
                cod = max(
                    chosen.cod_min_charge,
                    cod_amount * chosen.cod_percentage / Decimal("100"),
                )
            total = (forward + fuel + cod).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )

            results.append({
                "carrier_id": chosen.carrier_id,
                "carrier_name": chosen.carrier.name,
                "service_type": chosen.service_type,
                "zone": zone_code,
                "weight_slab": chosen.weight_slab,
                "forward_charge": str(forward.quantize(Decimal("0.01"))),
                "fuel_surcharge": str(fuel.quantize(Decimal("0.01"))),
                "cod_charge": str(cod.quantize(Decimal("0.01"))),
                "estimated_charge": float(total),
                "edd_days": ZONE_EDD.get(zone_code, 5),
                "is_serviceable": True,
            })

        results.sort(key=lambda x: x["estimated_charge"])
        return Response(results)
