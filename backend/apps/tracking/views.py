from datetime import datetime

from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from apps.shipments.models import Shipment, ShipmentStatusEvent
from apps.ndr.models import NDR
from apps.couriers.models import MerchantCourier
from apps.couriers.services.bluedart import BlueDartService
from core.utils import get_merchant

from .models import WebhookLog
from .serializers import TrackingTimelineSerializer


def _map_courier_status(raw_status_upper):
    """
    Maps a carrier's free-text status to our internal Shipment.Status.
    Shared by both the webhook receiver and the live tracking pull so the
    two never drift apart.

    Order matters: "UNDELIVERED" contains "DELIVERED" as a substring, so
    the failure/RTO checks must run before the generic DELIVERED check.
    """
    if "UNDELIVERED" in raw_status_upper or "FAILED" in raw_status_upper:
        return Shipment.Status.FAILED_DELIVERY, True
    if "RTO" in raw_status_upper or "RETURN" in raw_status_upper:
        return Shipment.Status.RTO_IN_TRANSIT, False
    if "OUT FOR DELIVERY" in raw_status_upper:
        return Shipment.Status.OUT_FOR_DELIVERY, False
    if "IN TRANSIT" in raw_status_upper:
        return Shipment.Status.IN_TRANSIT, False
    if "DELIVERED" in raw_status_upper:
        return Shipment.Status.DELIVERED, False
    return None, False


def _parse_scan_datetime(date_str, time_str):
    """Blue Dart scan dates look like '30-Jan-2023', times like '11:41'."""
    try:
        return timezone.make_aware(datetime.strptime(f"{date_str} {time_str}", "%d-%b-%Y %H:%M"))
    except (ValueError, TypeError):
        return timezone.now()


# Terminal states — nothing left to refresh from the carrier.
_TERMINAL_STATUSES = [
    Shipment.Status.DELIVERED,
    Shipment.Status.RTO_DELIVERED,
    Shipment.Status.CANCELLED,
]


class TrackingTimelineView(APIView):
    """
    GET /api/tracking/<awb>/ — Get full tracking timeline.
    Accessible publicly (for branded tracking page).

    Pulls a live status update from the carrier before responding (unless
    the shipment is already in a terminal state), so the timeline stays
    accurate even if a push webhook was missed, delayed, or never
    configured for this merchant. The live call is best-effort: if it
    fails for any reason, we still serve whatever we already have locally
    rather than erroring out the whole request.
    """
    permission_classes = [AllowAny]

    def get(self, request, awb):
        shipment = self._resolve_shipment(awb)
        if shipment is None:
            return Response(
                {"detail": "Tracking number not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        self._sync_live_status(shipment)

        serializer = TrackingTimelineSerializer(shipment)
        return Response(serializer.data)

    def _resolve_shipment(self, awb):
        qs = Shipment.objects.select_related("merchant", "carrier").prefetch_related("status_events")
        try:
            return qs.get(awb_number=awb)
        except Shipment.DoesNotExist:
            try:
                return qs.get(tracking_id=awb)
            except Shipment.DoesNotExist:
                return None

    def _sync_live_status(self, shipment):
        if shipment.status in _TERMINAL_STATUSES:
            return

        merchant_courier = MerchantCourier.objects.filter(
            merchant=shipment.merchant, carrier=shipment.carrier, status="ACTIVE"
        ).first()
        if not merchant_courier:
            return

        # Only Blue Dart is wired for live pull today.
        # NOTE: confirm 'BLUEDART' matches this merchant's actual Carrier.code value.
        if shipment.carrier.code != "BLUEDART":
            return

        try:
            service = BlueDartService(merchant_courier)
            live = service.track_shipment(shipment.awb_number or shipment.tracking_id)
        except Exception:
            return  # best-effort — serve local data if the carrier call fails

        mapped_status, is_ndr = _map_courier_status((live.get("status") or "").upper())

        # Blue Dart returns scans newest-first; replay oldest-first so
        # created_at ordering on our side stays chronological.
        for scan in reversed(live.get("scans", [])):
            event_time = _parse_scan_datetime(scan.get("date"), scan.get("time"))
            description = scan.get("description") or ""
            location = scan.get("location") or ""

            if ShipmentStatusEvent.objects.filter(
                shipment=shipment, description=description, event_time=event_time
            ).exists():
                continue

            scan_status, _ = _map_courier_status(description.upper())
            ShipmentStatusEvent.objects.create(
                shipment=shipment,
                status=scan_status or shipment.status,
                location=location,
                description=description,
                event_time=event_time,
                source="carrier_live_pull",
            )

        if mapped_status and mapped_status != shipment.status:
            shipment.status = mapped_status
            update_fields = ["status"]
            if mapped_status == Shipment.Status.DELIVERED:
                shipment.delivered_at = timezone.now()
                update_fields.append("delivered_at")
            shipment.save(update_fields=update_fields)

            if is_ndr:
                NDR.objects.get_or_create(
                    shipment=shipment,
                    ndr_status=NDR.NDRStatus.PENDING,
                    defaults={
                        "reason_code": NDR.ReasonCode.OTHER,
                        "courier_raw_reason": live.get("status", ""),
                        "ndr_date": timezone.now(),
                    },
                )


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
            try:
                shipment = Shipment.objects.get(tracking_id=tracking_number)
            except Shipment.DoesNotExist:
                log.error_message = "Shipment not found."
                log.save(update_fields=["error_message"])
                return Response({"status": "ignored", "detail": "Shipment not found"}, status=status.HTTP_200_OK)

        mapped_status, is_ndr = _map_courier_status(raw_status.upper())

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

                shipment.status = mapped_status
                if mapped_status == Shipment.Status.DELIVERED:
                    shipment.delivered_at = timezone.now()
                shipment.save()

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
        merchant = get_merchant(request)
        shipments = merchant.shipments.all()

        total = shipments.count()
        delivered = shipments.filter(status=Shipment.Status.DELIVERED).count()
        rto = shipments.filter(status__in=[Shipment.Status.RTO_INITIATED, Shipment.Status.RTO_IN_TRANSIT, Shipment.Status.RTO_DELIVERED]).count()

        delivery_pct = round((delivered / total * 100), 2) if total > 0 else 0
        rto_pct = round((rto / total * 100), 2) if total > 0 else 0

        return Response({
            "total_shipments": total,
            "delivered": delivered,
            "rto": rto,
            "delivery_percentage": delivery_pct,
            "rto_percentage": rto_pct,
        })