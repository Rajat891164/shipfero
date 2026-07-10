from django.conf import settings
from django.db import models

from core.models import TimeStampedModel


class Notification(TimeStampedModel):
    """In-app notification for a merchant user."""

    class NotificationType(models.TextChoices):
        SHIPMENT = "SHIPMENT", "Shipment Update"
        KYC = "KYC", "KYC Update"
        WALLET = "WALLET", "Wallet Update"
        INVOICE = "INVOICE", "Invoice"
        SYSTEM = "SYSTEM", "System"
        PROMOTION = "PROMOTION", "Promotion"
        ALERT = "ALERT", "Alert"

    class Priority(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        CRITICAL = "CRITICAL", "Critical"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM,
    )
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )

    title = models.CharField(max_length=255)
    message = models.TextField()

    # Optional link to related object
    action_url = models.CharField(max_length=500, null=True, blank=True)
    entity_type = models.CharField(max_length=50, null=True, blank=True)  # "shipment", "invoice" etc.
    entity_id = models.CharField(max_length=50, null=True, blank=True)

    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"[{self.notification_type}] {self.title} → {self.user.email}"

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read"]),
            models.Index(fields=["user", "created_at"]),
        ]


def create_notification(user, title, message, notification_type="SYSTEM",
                         priority="MEDIUM", action_url=None,
                         entity_type=None, entity_id=None):
    """Utility function to create a notification for a user."""
    return Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type,
        priority=priority,
        action_url=action_url,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id else None,
    )
