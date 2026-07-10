from django.db import models
from core.models import TimeStampedModel
from apps.merchants.models import Merchant
from apps.carriers.models import Carrier


class MerchantCourier(TimeStampedModel):
    """A merchant's specific configuration and credentials for a courier partner."""

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"
        CREDENTIALS_INVALID = "CREDENTIALS_INVALID", "Credentials Invalid"

    merchant = models.ForeignKey(
        Merchant, on_delete=models.CASCADE, related_name="configured_couriers"
    )
    carrier = models.ForeignKey(
        Carrier, on_delete=models.CASCADE, related_name="merchant_configurations"
    )
    
    # Credentials (in a real app, these must be encrypted)
    api_key = models.CharField(max_length=255, null=True, blank=True)
    api_secret = models.CharField(max_length=255, null=True, blank=True)
    account_number = models.CharField(max_length=100, null=True, blank=True)
    
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.ACTIVE)
    
    # Preferences
    is_default = models.BooleanField(default=False)
    allow_cod = models.BooleanField(default=True)
    
    last_tested_at = models.DateTimeField(null=True, blank=True)
    last_test_status = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"{self.merchant.company_name} - {self.carrier.name}"

    class Meta:
        unique_together = [("merchant", "carrier")]


class CourierHealthLog(TimeStampedModel):
    """Log of automated health checks (ping) for the courier API."""
    
    merchant_courier = models.ForeignKey(
        MerchantCourier, on_delete=models.CASCADE, related_name="health_logs"
    )
    is_healthy = models.BooleanField(default=True)
    response_time_ms = models.PositiveIntegerField(null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Health check for {self.merchant_courier} at {self.created_at}"
