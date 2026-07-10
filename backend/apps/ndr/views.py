from django.utils import timezone
from rest_framework import generics, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.shipments.models import Shipment

from .models import NDR, NDRAction
from .serializers import (
    NDRListSerializer,
    NDRDetailSerializer,
    TakeNDRActionSerializer,
    BulkNDRActionSerializer,
)


class NDRListView(generics.ListAPIView):
    """GET /api/ndr/ — List NDRs for this merchant."""
    permission_classes = [IsAuthenticated]
    serializer_class = NDRListSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["shipment__tracking_id", "shipment__awb_number", "shipment__consignee_name"]
    ordering_fields = ["ndr_date", "attempt_number", "ndr_status"]
    ordering = ["-ndr_date"]

    def get_queryset(self):
        merchant = self.request.user.merchant
        qs = NDR.objects.filter(
            shipment__merchant=merchant
        ).select_related("shipment__carrier")

        ndr_status = self.request.query_params.get("status")
        if ndr_status:
            qs = qs.filter(ndr_status=ndr_status.upper())

        reason_code = self.request.query_params.get("reason_code")
        if reason_code:
            qs = qs.filter(reason_code=reason_code.upper())

        is_escalated = self.request.query_params.get("is_escalated")
        if is_escalated is not None:
            qs = qs.filter(is_escalated=is_escalated.lower() in ["true", "1"])

        from_date = self.request.query_params.get("from_date")
        to_date = self.request.query_params.get("to_date")
        if from_date:
            qs = qs.filter(ndr_date__date__gte=from_date)
        if to_date:
            qs = qs.filter(ndr_date__date__lte=to_date)

        return qs


class NDRDetailView(generics.RetrieveAPIView):
    """GET /api/ndr/<id>/ — Full NDR detail with actions."""
    permission_classes = [IsAuthenticated]
    serializer_class = NDRDetailSerializer

    def get_queryset(self):
        return NDR.objects.filter(
            shipment__merchant=self.request.user.merchant
        ).select_related("shipment__carrier").prefetch_related("actions")


class TakeNDRActionView(APIView):
    """POST /api/ndr/<id>/action/ — Take action on an NDR."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            ndr = NDR.objects.select_related("shipment").get(
                pk=pk,
                shipment__merchant=request.user.merchant,
            )
        except NDR.DoesNotExist:
            return Response({"detail": "NDR not found."}, status=status.HTTP_404_NOT_FOUND)

        if ndr.ndr_status in [NDR.NDRStatus.DELIVERED, NDR.NDRStatus.RTO_INITIATED, NDR.NDRStatus.CLOSED]:
            return Response(
                {"detail": f"Cannot take action on NDR in {ndr.ndr_status} status."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = TakeNDRActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Update NDR
        action_type = data["action_type"]
        if action_type == NDRAction.ActionType.INITIATE_RTO:
            ndr.ndr_status = NDR.NDRStatus.RTO_INITIATED
            ndr.auto_rto_triggered = False
            # Update shipment status
            shipment = ndr.shipment
            shipment.status = Shipment.Status.RTO_INITIATED
            shipment.save(update_fields=["status"])
        elif action_type == NDRAction.ActionType.RE_ATTEMPT:
            ndr.ndr_status = NDR.NDRStatus.RE_ATTEMPTING
        elif action_type == NDRAction.ActionType.RESCHEDULE:
            ndr.ndr_status = NDR.NDRStatus.RE_ATTEMPTING
            ndr.rescheduled_date = data.get("rescheduled_date")
        elif action_type == NDRAction.ActionType.UPDATE_ADDRESS:
            ndr.ndr_status = NDR.NDRStatus.ACTION_TAKEN
            ndr.updated_address = data.get("updated_address")
            ndr.updated_phone = data.get("updated_phone")
        else:
            ndr.ndr_status = NDR.NDRStatus.ACTION_TAKEN

        ndr.save()

        NDRAction.objects.create(
            ndr=ndr,
            action_type=action_type,
            taken_by=request.user,
            notes=data.get("notes", ""),
        )

        return Response(NDRDetailSerializer(ndr).data)


class BulkNDRActionView(APIView):
    """POST /api/ndr/bulk-action/ — Bulk action on up to 100 NDRs."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BulkNDRActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        merchant = request.user.merchant
        ndrs = NDR.objects.filter(
            pk__in=data["ndr_ids"],
            shipment__merchant=merchant,
            ndr_status=NDR.NDRStatus.PENDING,
        )

        count = 0
        for ndr in ndrs:
            NDRAction.objects.create(
                ndr=ndr,
                action_type=data["action_type"],
                taken_by=request.user,
                notes=data.get("notes", ""),
            )
            if data["action_type"] == NDRAction.ActionType.INITIATE_RTO:
                ndr.ndr_status = NDR.NDRStatus.RTO_INITIATED
            else:
                ndr.ndr_status = NDR.NDRStatus.ACTION_TAKEN
            ndr.save(update_fields=["ndr_status"])
            count += 1

        return Response({"detail": f"Action taken on {count} NDRs."})


class NDRDashboardView(APIView):
    """GET /api/ndr/dashboard/ — NDR summary stats."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        merchant = request.user.merchant
        ndrs = NDR.objects.filter(shipment__merchant=merchant)

        return Response({
            "total": ndrs.count(),
            "pending": ndrs.filter(ndr_status=NDR.NDRStatus.PENDING).count(),
            "action_taken": ndrs.filter(ndr_status=NDR.NDRStatus.ACTION_TAKEN).count(),
            "re_attempting": ndrs.filter(ndr_status=NDR.NDRStatus.RE_ATTEMPTING).count(),
            "rto_initiated": ndrs.filter(ndr_status=NDR.NDRStatus.RTO_INITIATED).count(),
            "delivered": ndrs.filter(ndr_status=NDR.NDRStatus.DELIVERED).count(),
            "escalated": ndrs.filter(is_escalated=True).count(),
            "over_48hrs": ndrs.filter(
                ndr_status=NDR.NDRStatus.PENDING,
                ndr_date__lte=timezone.now() - timezone.timedelta(hours=48),
            ).count(),
        })
