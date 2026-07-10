from django.db import models
from core.models import TimeStampedModel


class Carrier(TimeStampedModel):
    """Courier partner / carrier."""

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"
        MAINTENANCE = "MAINTENANCE", "Under Maintenance"

    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)   # e.g. "DTDC", "BLUEDART"
    logo_url = models.URLField(max_length=500, null=True, blank=True)
    website_url = models.URLField(max_length=500, null=True, blank=True)

    # Capabilities
    supports_cod = models.BooleanField(default=True)
    supports_prepaid = models.BooleanField(default=True)
    supports_express = models.BooleanField(default=False)
    supports_same_day = models.BooleanField(default=False)
    supports_reverse = models.BooleanField(default=False)

    # Limits
    max_weight_kg = models.DecimalField(max_digits=6, decimal_places=2, default=50)
    min_weight_kg = models.DecimalField(max_digits=6, decimal_places=2, default=0.1)

    # Integration
    api_endpoint = models.URLField(max_length=500, null=True, blank=True)
    api_key = models.CharField(max_length=500, null=True, blank=True)
    api_secret = models.CharField(max_length=500, null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    priority = models.PositiveSmallIntegerField(default=10)  # Lower = higher priority

    def __str__(self):
        return f"{self.name} ({self.code})"

    class Meta:
        ordering = ["priority", "name"]


class CarrierRate(TimeStampedModel):
    """Shipping rate slab for a carrier."""

    class ServiceType(models.TextChoices):
        STANDARD = "STANDARD", "Standard"
        EXPRESS = "EXPRESS", "Express"
        SAME_DAY = "SAME_DAY", "Same Day"
        OVERNIGHT = "OVERNIGHT", "Overnight"

    carrier = models.ForeignKey(
        Carrier,
        on_delete=models.CASCADE,
        related_name="rates",
    )
    service_type = models.CharField(
        max_length=20,
        choices=ServiceType.choices,
        default=ServiceType.STANDARD,
    )

    origin_zone = models.CharField(max_length=10)   # A, B, C, D or pincode prefix
    destination_zone = models.CharField(max_length=10)

    # Weight slabs
    min_weight_kg = models.DecimalField(max_digits=6, decimal_places=2)
    max_weight_kg = models.DecimalField(max_digits=6, decimal_places=2)

    # Rate
    base_rate = models.DecimalField(max_digits=10, decimal_places=2)
    rate_per_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cod_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cod_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    is_active = models.BooleanField(default=True)

    def __str__(self):
        return (
            f"{self.carrier.code} | {self.service_type} | "
            f"{self.origin_zone}→{self.destination_zone} | "
            f"{self.min_weight_kg}–{self.max_weight_kg}kg"
        )


class ServiceablePincode(TimeStampedModel):
    """Tracks which pincodes are serviceable by a carrier."""

    carrier = models.ForeignKey(
        Carrier,
        on_delete=models.CASCADE,
        related_name="serviceable_pincodes",
    )
    pincode = models.CharField(max_length=10, db_index=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    zone = models.CharField(max_length=10, null=True, blank=True)

    is_cod_available = models.BooleanField(default=True)
    is_prepaid_available = models.BooleanField(default=True)
    is_pickup_available = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.carrier.code} – {self.pincode} ({self.city})"

    class Meta:
        unique_together = ("carrier", "pincode")
        indexes = [
            models.Index(fields=["pincode"]),
        ]
