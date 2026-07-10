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
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ServiceabilityCheckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        pickup_pincode = data["pickup_pincode"]
        delivery_pincode = data["delivery_pincode"]
        weight = data["weight"]
        cod_required = data["cod"]

        # Find carriers that service both pincodes
        pickup_carriers = ServiceablePincode.objects.filter(
            pincode=pickup_pincode, is_pickup_available=True
        ).values_list("carrier_id", flat=True)

        delivery_qs = ServiceablePincode.objects.filter(
            pincode=delivery_pincode,
        )
        if cod_required:
            delivery_qs = delivery_qs.filter(is_cod_available=True)

        delivery_carriers = delivery_qs.values_list("carrier_id", flat=True)

        available_carrier_ids = set(pickup_carriers) & set(delivery_carriers)

        if not available_carrier_ids:
            return Response(
                {"detail": "No carriers available for this route.", "results": []},
                status=status.HTTP_200_OK,
            )

        # Get carrier rates for the available carriers
        carriers = Carrier.objects.filter(
            id__in=available_carrier_ids, status=Carrier.Status.ACTIVE
        )

        results = []
        for carrier in carriers:
            rates = CarrierRate.objects.filter(
                carrier=carrier, is_active=True,
                min_weight_kg__lte=weight,
                max_weight_kg__gte=weight,
            )
            if not rates.exists():
                # Use a default rate estimate
                rates = CarrierRate.objects.filter(carrier=carrier, is_active=True).order_by("min_weight_kg")
                if not rates.exists():
                    continue

            for rate in rates:
                estimated_rate = rate.base_rate + (rate.rate_per_kg * weight)
                cod_charge = 0
                if cod_required:
                    cod_charge = max(
                        rate.cod_charge,
                        rate.cod_percentage * data.get("declared_value", 0) / 100
                    )

                results.append({
                    "carrier_id": carrier.id,
                    "carrier_name": carrier.name,
                    "carrier_code": carrier.code,
                    "logo_url": carrier.logo_url,
                    "service_type": rate.service_type,
                    "estimated_rate": round(estimated_rate, 2),
                    "cod_charge": round(cod_charge, 2),
                    "supports_cod": carrier.supports_cod,
                    "estimated_days": _get_estimated_days(rate.service_type),
                })

        # Sort by estimated rate
        results.sort(key=lambda x: x["estimated_rate"])

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
