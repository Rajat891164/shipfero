from django.utils import timezone
from rest_framework import generics, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.shipments.models import Shipment

from .models import Return, Refund
from .serializers import (
    ReturnListSerializer,
    ReturnDetailSerializer,
    CreateReversePickupSerializer,
)


class ReturnListView(generics.ListAPIView):
    """GET /api/returns/ — List returns & RTOs."""
    permission_classes = [IsAuthenticated]
    serializer_class = ReturnListSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["original_shipment__awb_number", "return_awb", "original_shipment__consignee_name"]
    ordering_fields = ["created_at", "status"]
    ordering = ["-created_at"]

    def get_queryset(self):
        merchant = self.request.user.merchant
        qs = Return.objects.filter(
            original_shipment__merchant=merchant
        ).select_related("original_shipment", "return_carrier")

        r_type = self.request.query_params.get("type")
        if r_type:
            qs = qs.filter(return_type=r_type.upper())

        r_status = self.request.query_params.get("status")
        if r_status:
            qs = qs.filter(status=r_status.upper())

        from_date = self.request.query_params.get("from_date")
        to_date = self.request.query_params.get("to_date")
        if from_date:
            qs = qs.filter(created_at__date__gte=from_date)
        if to_date:
            qs = qs.filter(created_at__date__lte=to_date)

        return qs


class ReturnDetailView(generics.RetrieveAPIView):
    """GET /api/returns/<id>/ — Return detail."""
    permission_classes = [IsAuthenticated]
    serializer_class = ReturnDetailSerializer

    def get_queryset(self):
        return Return.objects.filter(
            original_shipment__merchant=self.request.user.merchant
        ).select_related("original_shipment", "return_carrier", "refund")


class CreateReversePickupView(APIView):
    """POST /api/returns/ — Merchant creates reverse pickup for customer."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateReversePickupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            shipment = Shipment.objects.get(
                pk=data["original_shipment_id"],
                merchant=request.user.merchant,
            )
        except Shipment.DoesNotExist:
            return Response({"detail": "Shipment not found."}, status=status.HTTP_404_NOT_FOUND)

        if shipment.status != Shipment.Status.DELIVERED:
            return Response(
                {"detail": "Reverse pickup can only be created for DELIVERED shipments."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Return.objects.filter(original_shipment=shipment).exists():
            return Response(
                {"detail": "A return already exists for this shipment."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Simplified reverse pickup logic
        # In real scenario: calls courier API to schedule pickup, gets reverse AWB, deducts wallet.
        return_record = Return.objects.create(
            original_shipment=shipment,
            return_type=Return.ReturnType.REVERSE,
            status=Return.ReturnStatus.INITIATED,
            reason=data["reason"],
            customer_notes=data.get("customer_notes", ""),
            return_carrier=shipment.carrier,  # Defaulting to original carrier
        )

        return Response(
            ReturnDetailSerializer(return_record).data,
            status=status.HTTP_201_CREATED,
        )


class MarkReceivedView(APIView):
    """POST /api/returns/<id>/mark-received/ — Merchant confirms RTO/Return arrived at warehouse."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            return_record = Return.objects.get(
                pk=pk,
                original_shipment__merchant=request.user.merchant,
            )
        except Return.DoesNotExist:
            return Response({"detail": "Return not found."}, status=status.HTTP_404_NOT_FOUND)

        if return_record.is_received:
            return Response(
                {"detail": "Return is already marked as received."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return_record.is_received = True
        return_record.received_at = timezone.now()
        return_record.received_by = request.user
        return_record.status = Return.ReturnStatus.DELIVERED
        return_record.save(update_fields=["is_received", "received_at", "received_by", "status"])

        # Auto-initiate refund check if it's a prepaid order and reverse pickup
        if return_record.return_type == Return.ReturnType.REVERSE and \
           return_record.original_shipment.payment_mode == Shipment.PaymentMode.PREPAID:
            
            Refund.objects.create(
                return_record=return_record,
                amount=return_record.original_shipment.total_charge,  # Simplified logic
                status=Refund.RefundStatus.INITIATED,
            )

        return Response({"detail": "Return marked as received at warehouse."})


class ReturnStatsView(APIView):
    """GET /api/returns/stats/ — Returns dashboard summary."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        merchant = request.user.merchant
        returns = Return.objects.filter(original_shipment__merchant=merchant)

        return Response({
            "total": returns.count(),
            "rto_count": returns.filter(return_type=Return.ReturnType.RTO).count(),
            "reverse_pickup_count": returns.filter(return_type=Return.ReturnType.REVERSE).count(),
            "pickup_failed_count": returns.filter(status=Return.ReturnStatus.PICKUP_FAILED).count(),
            "in_transit_count": returns.filter(status=Return.ReturnStatus.IN_TRANSIT).count(),
            "received_count": returns.filter(is_received=True).count(),
        })
