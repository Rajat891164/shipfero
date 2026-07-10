from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from apps.shipments.models import Shipment, ShipmentStatusEvent
from apps.ndr.models import NDR

from .models import WebhookLog
from .serializers import TrackingTimelineSerializer


class TrackingTimelineView(APIView):
    """
    GET /api/tracking/<awb>/ — Get full tracking timeline.
    Accessible publicly (for branded tracking page).
    """
    permission_classes = [AllowAny]

    def get(self, request, awb):
        try:
            shipment = Shipment.objects.select_related(
                "merchant", "carrier"
            ).prefetch_related(
                "status_events"
            ).get(awb_number=awb)
        except Shipment.DoesNotExist:
            try:
                shipment = Shipment.objects.select_related(
                    "merchant", "carrier"
                ).prefetch_related(
                    "status_events"
                ).get(tracking_id=awb)
            except Shipment.DoesNotExist:
                return Response(
                    {"detail": "Tracking number not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        serializer = TrackingTimelineSerializer(shipment)
        return Response(serializer.data)


class CourierWebhookReceiverView(APIView):
    """
    POST /api/tracking/webhooks/<courier_code>/
    Receives incoming tracking updates from courier partners.
    """
    permission_classes = [AllowAny]

    def post(self, request, courier_code):
        payload = request.data
        
        # This is a simplified webhook handler.
        # In a real system, you'd have a parser per courier, 
        # and HMAC validation to ensure the webhook is genuine.
        
        # Example extracting AWB and status (assuming a standard structure for simplicity)
        # Real code would branch based on `courier_code`
        tracking_number = payload.get("awb") or payload.get("tracking_number") or ""
        raw_status = payload.get("status", "")
        location = payload.get("location", "")
        timestamp = payload.get("timestamp")
        
        log = WebhookLog.objects.create(
            courier_code=courier_code,
            tracking_number=tracking_number,
            raw_payload=payload,
            status_code_received=raw_status,
        )

        if not tracking_number:
            log.error_message = "No tracking number found in payload."
            log.save(update_fields=["error_message"])
            return Response({"status": "error", "detail": "Missing AWB"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            shipment = Shipment.objects.get(awb_number=tracking_number)
        except Shipment.DoesNotExist:
            log.error_message = "Shipment not found."
            log.save(update_fields=["error_message"])
            return Response({"status": "ignored", "detail": "Shipment not found"}, status=status.HTTP_200_OK)

        # Mapping raw status to our standard status (simplified)
        mapped_status = None
        is_ndr = False
        if "DELIVERED" in raw_status.upper():
            mapped_status = Shipment.Status.DELIVERED
        elif "IN TRANSIT" in raw_status.upper():
            mapped_status = Shipment.Status.IN_TRANSIT
        elif "OUT FOR DELIVERY" in raw_status.upper():
            mapped_status = Shipment.Status.OUT_FOR_DELIVERY
        elif "FAILED" in raw_status.upper() or "UNDELIVERED" in raw_status.upper():
            mapped_status = Shipment.Status.DELIVERY_FAILED
            is_ndr = True
        elif "RTO" in raw_status.upper() or "RETURN" in raw_status.upper():
            mapped_status = Shipment.Status.RTO_IN_TRANSIT

        if mapped_status:
            # Check idempotency
            if not ShipmentStatusEvent.objects.filter(
                shipment=shipment, status=mapped_status, location=location
            ).exists():
                ShipmentStatusEvent.objects.create(
                    shipment=shipment,
                    status=mapped_status,
                    location=location,
                    description=raw_status,
                    event_time=timezone.now(),  # Should use timestamp from payload if available
                    source="webhook",
                )
                
                # Update main shipment status if it's a forward progression
                shipment.status = mapped_status
                if mapped_status == Shipment.Status.DELIVERED:
                    shipment.delivered_at = timezone.now()
                shipment.save()
                
                # Auto-create NDR if it's a delivery failure
                if is_ndr:
                    ndr, created = NDR.objects.get_or_create(
                        shipment=shipment,
                        ndr_status=NDR.NDRStatus.PENDING,
                        defaults={
                            "reason_code": NDR.ReasonCode.OTHER,
                            "courier_raw_reason": raw_status,
                            "ndr_date": timezone.now(),
                        }
                    )
                    if not created:
                        ndr.attempt_number += 1
                        ndr.courier_raw_reason = raw_status
                        ndr.save(update_fields=["attempt_number", "courier_raw_reason"])

            log.is_processed = True
            log.processed_at = timezone.now()
            log.save(update_fields=["is_processed", "processed_at"])

        return Response({"status": "success"})


class TrackingAnalyticsView(APIView):
    """GET /api/tracking/analytics/ — TAT and delivery stats for dashboard."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        merchant = request.user.merchant
        shipments = merchant.shipments.all()

        total = shipments.count()
        delivered = shipments.filter(status=Shipment.Status.DELIVERED).count()
        rto = shipments.filter(status__in=[Shipment.Status.RTO_INITIATED, Shipment.Status.RTO_IN_TRANSIT, Shipment.Status.RTO_DELIVERED]).count()

        delivery_pct = round((delivered / total * 100), 2) if total > 0 else 0
        rto_pct = round((rto / total * 100), 2) if total > 0 else 0

        # Note: Actual average TAT calculation would require DB annotations on duration (delivered_at - booked_at)
        # Simplified for now.
        
        return Response({
            "total_shipments": total,
            "delivered": delivered,
            "rto": rto,
            "delivery_percentage": delivery_pct,
            "rto_percentage": rto_pct,
        })
