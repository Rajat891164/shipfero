from django.conf import settings
from django.db import models
from core.models import TimeStampedModel
from apps.shipments.models import Shipment


class NDR(TimeStampedModel):
    """Non-Delivery Report — created when a courier fails to deliver."""

    class NDRStatus(models.TextChoices):
        PENDING = "PENDING", "Pending Action"
        ACTION_TAKEN = "ACTION_TAKEN", "Action Taken"
        RE_ATTEMPTING = "RE_ATTEMPTING", "Re-attempting"
        DELIVERED = "DELIVERED", "Delivered after NDR"
        RTO_INITIATED = "RTO_INITIATED", "RTO Initiated"
        CLOSED = "CLOSED", "Closed"

    class ReasonCode(models.TextChoices):
        DR01 = "DR-01", "Customer not available"
        DR02 = "DR-02", "Refused delivery"
        DR03 = "DR-03", "Wrong / incomplete address"
        DR04 = "DR-04", "Consignee out of station"
        DR05 = "DR-05", "COD amount not ready"
        DR06 = "DR-06", "Shipment damaged"
        DR07 = "DR-07", "Fake delivery attempt"
        DR08 = "DR-08", "Business / shop closed"
        OTHER = "OTHER", "Other"

    shipment = models.ForeignKey(
        Shipment, on_delete=models.CASCADE, related_name="ndr_records"
    )
    ndr_status = models.CharField(
        max_length=20, choices=NDRStatus.choices, default=NDRStatus.PENDING, db_index=True
    )
    reason_code = models.CharField(max_length=10, choices=ReasonCode.choices)
    courier_raw_reason = models.CharField(max_length=255, null=True, blank=True)
    attempt_number = models.PositiveSmallIntegerField(default=1)
    ndr_date = models.DateTimeField()

    # Updated address (if merchant provides)
    updated_address = models.CharField(max_length=500, null=True, blank=True)
    updated_phone = models.CharField(max_length=20, null=True, blank=True)

    # Reschedule date
    rescheduled_date = models.DateField(null=True, blank=True)

    # Escalation
    is_escalated = models.BooleanField(default=False)
    escalated_at = models.DateTimeField(null=True, blank=True)
    auto_rto_triggered = models.BooleanField(default=False)

    def __str__(self):
        return f"NDR #{self.id} | {self.shipment.tracking_id} | {self.reason_code}"

    class Meta:
        ordering = ["-ndr_date"]
        indexes = [
            models.Index(fields=["shipment", "ndr_status"]),
        ]


class NDRAction(TimeStampedModel):
    """Merchant action taken on an NDR."""

    class ActionType(models.TextChoices):
        RE_ATTEMPT = "RE_ATTEMPT", "Re-attempt Delivery"
        RESCHEDULE = "RESCHEDULE", "Reschedule Delivery"
        UPDATE_ADDRESS = "UPDATE_ADDRESS", "Update Address"
        INITIATE_RTO = "INITIATE_RTO", "Initiate RTO"
        MARK_FAKE = "MARK_FAKE", "Mark as Fake Attempt"

    ndr = models.ForeignKey(
        NDR, on_delete=models.CASCADE, related_name="actions"
    )
    action_type = models.CharField(max_length=20, choices=ActionType.choices)
    taken_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="ndr_actions"
    )
    notes = models.TextField(null=True, blank=True)

    # Outcome
    outcome = models.CharField(max_length=50, null=True, blank=True)  # Delivered / Failed Again / etc.
    outcome_recorded_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.action_type} on NDR #{self.ndr_id}"
