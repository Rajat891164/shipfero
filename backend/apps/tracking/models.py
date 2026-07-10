from django.db import models
from core.models import TimeStampedModel
from apps.shipments.models import Shipment


class WebhookLog(TimeStampedModel):
    """Log of incoming webhooks from couriers for idempotency and debugging."""

    courier_code = models.CharField(max_length=50)
    tracking_number = models.CharField(max_length=100, db_index=True)
    raw_payload = models.JSONField()
    status_code_received = models.CharField(max_length=50, null=True, blank=True)
    is_processed = models.BooleanField(default=False)
    error_message = models.TextField(null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Webhook [{self.courier_code}] - {self.tracking_number}"

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["tracking_number", "is_processed"]),
        ]


class CustomerNotificationLog(TimeStampedModel):
    """Log of SMS/Email/WhatsApp sent to customers."""

    class NotificationType(models.TextChoices):
        SMS = "SMS", "SMS"
        EMAIL = "EMAIL", "Email"
        WHATSAPP = "WHATSAPP", "WhatsApp"

    class NotificationEvent(models.TextChoices):
        BOOKED = "BOOKED", "Booked"
        OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY", "Out for Delivery"
        DELIVERED = "DELIVERED", "Delivered"
        DELIVERY_FAILED = "DELIVERY_FAILED", "Delivery Failed"
        RTO_INITIATED = "RTO_INITIATED", "RTO Initiated"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SENT = "SENT", "Sent"
        DELIVERED = "DELIVERED", "Delivered"
        FAILED = "FAILED", "Failed"

    shipment = models.ForeignKey(
        Shipment, on_delete=models.CASCADE, related_name="customer_notifications"
    )
    notification_type = models.CharField(max_length=20, choices=NotificationType.choices)
    event = models.CharField(max_length=30, choices=NotificationEvent.choices)
    
    recipient = models.CharField(max_length=255)  # Phone or Email
    message_body = models.TextField()
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    gateway_response = models.JSONField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.notification_type} for {self.shipment.tracking_id} - {self.status}"
