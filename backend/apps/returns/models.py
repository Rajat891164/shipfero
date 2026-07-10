import uuid
from django.db import models
from django.conf import settings
from core.models import TimeStampedModel
from apps.shipments.models import Shipment


class Return(TimeStampedModel):
    """
    Handles both RTO (Return to Origin) and Reverse Pickup (Merchant initiated).
    """

    class ReturnType(models.TextChoices):
        RTO = "RTO", "Return to Origin (RTO)"
        REVERSE = "REVERSE", "Reverse Pickup"

    class ReturnStatus(models.TextChoices):
        INITIATED = "INITIATED", "Initiated"
        PICKUP_SCHEDULED = "PICKUP_SCHEDULED", "Pickup Scheduled"
        PICKUP_FAILED = "PICKUP_FAILED", "Pickup Failed"
        IN_TRANSIT = "IN_TRANSIT", "In Transit"
        DELIVERED = "DELIVERED", "Delivered at Warehouse"
        CANCELLED = "CANCELLED", "Cancelled"

    original_shipment = models.ForeignKey(
        Shipment, on_delete=models.CASCADE, related_name="returns"
    )
    return_type = models.CharField(max_length=20, choices=ReturnType.choices)
    
    # Return logistics
    return_awb = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    return_carrier = models.ForeignKey(
        "carriers.Carrier", on_delete=models.SET_NULL, null=True, blank=True, related_name="returns"
    )
    status = models.CharField(
        max_length=20, choices=ReturnStatus.choices, default=ReturnStatus.INITIATED, db_index=True
    )

    reason = models.CharField(max_length=255, null=True, blank=True)
    customer_notes = models.TextField(null=True, blank=True)

    # Pricing
    return_shipping_charge = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Received confirmation
    is_received = models.BooleanField(default=False)
    received_at = models.DateTimeField(null=True, blank=True)
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )

    def __str__(self):
        return f"{self.return_type} for {self.original_shipment.tracking_id}"

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["return_type"]),
        ]


class Refund(TimeStampedModel):
    """Refund processing for returned orders."""

    class RefundStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        INITIATED = "INITIATED", "Initiated"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"

    return_record = models.OneToOneField(
        Return, on_delete=models.CASCADE, related_name="refund"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=RefundStatus.choices, default=RefundStatus.PENDING)
    refund_method = models.CharField(max_length=50, null=True, blank=True)  # Wallet / Bank / Gateway
    gateway_txn_id = models.CharField(max_length=255, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Refund {self.id} | ₹{self.amount} | {self.status}"
