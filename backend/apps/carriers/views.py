from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Carrier, CarrierRate, ServiceablePincode
from .serializers import (
    CarrierSerializer,
    CarrierRateSerializer,
    ServiceabilityCheckSerializer,
    ServiceabilityResultSerializer,
    RateCalculatorSerializer,
)


class CarrierListView(generics.ListAPIView):
    """GET /api/carriers/ – List all active carriers"""
    permission_classes = [AllowAny]
    serializer_class = CarrierSerializer

    def get_queryset(self):
        return Carrier.objects.filter(status=Carrier.Status.ACTIVE).order_by("priority")


class CarrierDetailView(generics.RetrieveAPIView):
    """GET /api/carriers/<pk>/ – Get carrier details"""
    permission_classes = [AllowAny]
    serializer_class = CarrierSerializer
    queryset = Carrier.objects.filter(status=Carrier.Status.ACTIVE)


class ServiceabilityCheckView(APIView):
    """
    POST /api/carriers/serviceability/
    Check which carriers can service a given route and return rates.

    Rates come from the single shared engine in `pricing.services` (the same
    one the Pricing rate-comparison uses), so serviceability and rate
    comparison never diverge. Pincode-level allow/deny lists
    (`ServiceablePincode`) are honoured as a filter *only when data exists*;
    with no pincode dataset loaded, every rate-carded carrier is serviceable.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from apps.pricing.services import quote_all_carriers

        serializer = ServiceabilityCheckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        pickup_pincode = data["pickup_pincode"]
        delivery_pincode = data["delivery_pincode"]
        weight = data["weight"]
        cod_required = data["cod"]

        quotes = quote_all_carriers(
            pickup_pincode, delivery_pincode, weight, is_cod=cod_required,
        )

        # Optional pincode-level filter: only apply if serviceability data
        # for the delivery pincode has actually been loaded.
        pincode_rows = ServiceablePincode.objects.filter(pincode=delivery_pincode)
        if pincode_rows.exists():
            allowed = set(
                pincode_rows.filter(
                    **({"is_cod_available": True} if cod_required else {})
                ).values_list("carrier_id", flat=True)
            )
            quotes = [q for q in quotes if q["carrier"].id in allowed]

        if not quotes:
            return Response(
                {"detail": "No carriers available for this route.", "results": []},
                status=status.HTTP_200_OK,
            )

        results = [{
            "carrier_id": q["carrier"].id,
            "carrier_name": q["carrier"].name,
            "carrier_code": q["carrier"].code,
            "logo_url": q["carrier"].logo_url,
            "service_type": q["service_type"],
            "estimated_rate": q["forward"] + q["fuel"],
            "cod_charge": q["cod"],
            "supports_cod": q["carrier"].supports_cod,
            "estimated_days": f"{q['edd_days']} days",
        } for q in quotes]

        return Response({
            "pickup_pincode": pickup_pincode,
            "delivery_pincode": delivery_pincode,
            "weight": weight,
            "results": ServiceabilityResultSerializer(results, many=True).data,
        })


class RateCalculatorView(APIView):
    """POST /api/carriers/calculate-rate/ – Calculate shipping rate for specific carrier"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RateCalculatorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            carrier = Carrier.objects.get(pk=data["carrier_id"], status=Carrier.Status.ACTIVE)
        except Carrier.DoesNotExist:
            return Response({"detail": "Carrier not found."}, status=status.HTTP_404_NOT_FOUND)

        rate_qs = CarrierRate.objects.filter(
            carrier=carrier,
            service_type=data["service_type"],
            is_active=True,
            min_weight_kg__lte=data["weight"],
            max_weight_kg__gte=data["weight"],
        ).first()

        if not rate_qs:
            return Response(
                {"detail": "No rate found for these parameters."},
                status=status.HTTP_404_NOT_FOUND,
            )

        shipping_charge = rate_qs.base_rate + (rate_qs.rate_per_kg * data["weight"])
        cod_charge = 0
        if data["cod_amount"] > 0:
            cod_charge = max(
                rate_qs.cod_charge,
                rate_qs.cod_percentage * data["cod_amount"] / 100
            )

        return Response({
            "carrier": carrier.name,
            "service_type": data["service_type"],
            "weight": data["weight"],
            "shipping_charge": round(shipping_charge, 2),
            "cod_charge": round(cod_charge, 2),
            "total_charge": round(shipping_charge + cod_charge, 2),
            "estimated_days": _get_estimated_days(data["service_type"]),
        })


def _get_estimated_days(service_type: str) -> str:
    """Return estimated delivery days based on service type."""
    mapping = {
        "STANDARD": "4-7 days",
        "EXPRESS": "2-3 days",
        "SAME_DAY": "Same day",
        "OVERNIGHT": "Next day",
    }
    return mapping.get(service_type, "3-5 days")
