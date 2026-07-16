"""Shared rate-quoting logic (single source of truth for rate calculation).

Both `pricing.CompareRatesView` (Module 11 rate comparison) and
`carriers.ServiceabilityCheckView` (Module 9 serviceability) quote off the
same `pricing.RateCard` data through `quote_all_carriers()`, so there is one
rate engine instead of two divergent ones.
"""
import math
from decimal import Decimal, ROUND_HALF_UP

from .models import PricingZone, RateCard

NUMERIC_SLABS = ["0.5", "1.0", "2.0", "5.0", "10.0"]
# Estimated delivery days per zone — the model carries no per-card TAT.
ZONE_EDD = {"A": 2, "B": 3, "C": 4, "D": 5, "E": 7}
# J&K + parts of the North-East → treated as remote (Zone E).
_SPECIAL_PREFIXES = ("18", "19", "73", "78", "79")

_TWO = Decimal("0.01")


def derive_zone(pickup: str, delivery: str) -> str:
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


def quote_all_carriers(pickup, delivery, weight, is_cod=False, cod_amount=0):
    """Return per-carrier rate quotes for a route + weight, cheapest first.

    Each quote: {carrier, service_type, zone, weight_slab, forward, fuel, cod,
    total, edd_days}. `carrier` is the Carrier instance so callers can shape
    their own response.
    """
    weight = Decimal(weight)
    cod_amount = Decimal(cod_amount or 0)
    zone_code = derive_zone(pickup, delivery)

    try:
        zone = PricingZone.objects.get(code=zone_code)
    except PricingZone.DoesNotExist:
        return []

    cards = RateCard.objects.filter(zone=zone, is_active=True).select_related("carrier")
    by_carrier = {}
    for card in cards:
        by_carrier.setdefault(card.carrier_id, []).append(card)

    quotes = []
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
        total = (forward + fuel + cod).quantize(_TWO, rounding=ROUND_HALF_UP)

        quotes.append({
            "carrier": chosen.carrier,
            "service_type": chosen.service_type,
            "zone": zone_code,
            "weight_slab": chosen.weight_slab,
            "forward": forward.quantize(_TWO),
            "fuel": fuel.quantize(_TWO),
            "cod": cod.quantize(_TWO),
            "total": total,
            "edd_days": ZONE_EDD.get(zone_code, 5),
        })

    quotes.sort(key=lambda q: q["total"])
    return quotes
