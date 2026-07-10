from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import TimeStampedModel
from apps.merchants.models import Merchant


class ChannelIntegration(TimeStampedModel):
    """A merchant's connection to an external sales channel."""

    class Platform(models.TextChoices):
        SHOPIFY = "SHOPIFY", "Shopify"
        WOOCOMMERCE = "WOOCOMMERCE", "WooCommerce"
        AMAZON = "AMAZON", "Amazon"
        CUSTOM_API = "CUSTOM_API", "Custom API"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"
        ERROR = "ERROR", "Sync Error"

    merchant = models.ForeignKey(
        Merchant, on_delete=models.CASCADE, related_name="integrations"
    )
    platform = models.CharField(max_length=20, choices=Platform.choices)
    store_name = models.CharField(max_length=100)
    store_url = models.URLField(null=True, blank=True)
    
    # Credentials (in a real app, these should be encrypted in the DB)
    api_key = models.CharField(max_length=255, null=True, blank=True)
    api_secret = models.CharField(max_length=255, null=True, blank=True)
    access_token = models.CharField(max_length=500, null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    
    # Settings
    auto_sync_orders = models.BooleanField(default=True)
    push_tracking_status = models.BooleanField(default=True)
    
    last_sync_at = models.DateTimeField(null=True, blank=True)
    last_sync_status = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"{self.merchant.company_name} - {self.platform} ({self.store_name})"

    class Meta:
        unique_together = [("merchant", "platform", "store_url")]


class IntegrationSyncLog(TimeStampedModel):
    """Log of order sync events from channels."""
    
    integration = models.ForeignKey(
        ChannelIntegration, on_delete=models.CASCADE, related_name="sync_logs"
    )
    orders_fetched = models.PositiveIntegerField(default=0)
    orders_created = models.PositiveIntegerField(default=0)
    errors_encountered = models.PositiveIntegerField(default=0)
    error_details = models.TextField(null=True, blank=True)
    is_success = models.BooleanField(default=True)

    def __str__(self):
        return f"Sync Log {self.id} for {self.integration.platform}"
