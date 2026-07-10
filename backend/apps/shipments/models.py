import uuid
from django.conf import settings
from django.db import models

from core.models import TimeStampedModel
from apps.merchants.models import Merchant, PickupLocation


class Shipment(TimeStampedModel):
    """Core shipment model representing an order being shipped."""

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        BOOKED = "BOOKED", "Booked"
        PICKUP_SCHEDULED = "PICKUP_SCHEDULED", "Pickup Scheduled"
        PICKED_UP = "PICKED_UP", "Picked Up"
        IN_TRANSIT = "IN_TRANSIT", "In Transit"
        OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY", "Out for Delivery"
        DELIVERED = "DELIVERED", "Delivered"
        FAILED_DELIVERY = "FAILED_DELIVERY", "Failed Delivery"
        RTO_INITIATED = "RTO_INITIATED", "RTO Initiated"
        RTO_IN_TRANSIT = "RTO_IN_TRANSIT", "RTO In Transit"
        RTO_DELIVERED = "RTO_DELIVERED", "RTO Delivered"
        CANCELLED = "CANCELLED", "Cancelled"
        LOST = "LOST", "Lost"

    class PaymentMode(models.TextChoices):
        PREPAID = "PREPAID", "Prepaid"
        COD = "COD", "Cash on Delivery"

    class ServiceType(models.TextChoices):
        STANDARD = "STANDARD", "Standard"
        EXPRESS = "EXPRESS", "Express"
        SAME_DAY = "SAME_DAY", "Same Day"
        OVERNIGHT = "OVERNIGHT", "Overnight"

    # Identity
    tracking_id = models.CharField(max_length=50, unique=True, db_index=True)
    awb_number = models.CharField(max_length=50, unique=True, null=True, blank=True, db_index=True)
    order_id = models.CharField(max_length=100, db_index=True)  # merchant's order ID

    # Relations
    merchant = models.ForeignKey(
        Merchant,
        on_delete=models.CASCADE,
        related_name="shipments",
    )
    carrier = models.ForeignKey(
        "carriers.Carrier",  # app_label is 'carriers' (from apps.carriers)
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="shipments",
    )
    pickup_location = models.ForeignKey(
        PickupLocation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="shipments",
    )

    # Consignee (recipient)
    consignee_name = models.CharField(max_length=255)
    consignee_phone = models.CharField(max_length=20)
    consignee_email = models.EmailField(null=True, blank=True)
    consignee_address1 = models.CharField(max_length=255)
    consignee_address2 = models.CharField(max_length=255, null=True, blank=True)
    consignee_city = models.CharField(max_length=100)
    consignee_state = models.CharField(max_length=100)
    consignee_pincode = models.CharField(max_length=10)
    consignee_country = models.CharField(max_length=50, default="India")

    # Package details
    weight = models.DecimalField(max_digits=8, decimal_places=2)  # in kg
    length = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)  # cm
    breadth = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)  # cm
    height = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)  # cm
    volumetric_weight = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)

    # Order value
    declared_value = models.DecimalField(max_digits=12, decimal_places=2)
    cod_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Service
    payment_mode = models.CharField(
        max_length=10,
        choices=PaymentMode.choices,
        default=PaymentMode.PREPAID,
    )
    service_type = models.CharField(
        max_length=20,
        choices=ServiceType.choices,
        default=ServiceType.STANDARD,
    )

    # Charges
    shipping_charge = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cod_charge = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_charge = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Status
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True,
    )

    # Product info
    product_name = models.CharField(max_length=255, null=True, blank=True)
    product_category = models.CharField(max_length=100, null=True, blank=True)
    hsn_code = models.CharField(max_length=20, null=True, blank=True)
    product_quantity = models.PositiveIntegerField(default=1)

    # Label
    label_url = models.URLField(max_length=1000, null=True, blank=True)

    # Timestamps for key events
    booked_at = models.DateTimeField(null=True, blank=True)
    picked_up_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    # Notes
    internal_notes = models.TextField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.tracking_id:
            self.tracking_id = f"SHP{uuid.uuid4().hex[:12].upper()}"
        # Compute volumetric weight if dimensions are set
        if self.length and self.breadth and self.height:
            self.volumetric_weight = (self.length * self.breadth * self.height) / 5000
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.tracking_id} – {self.consignee_name} ({self.status})"

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["merchant", "status"]),
            models.Index(fields=["merchant", "created_at"]),
        ]


class ShipmentStatusEvent(TimeStampedModel):
    """Tracking history for a shipment."""

    shipment = models.ForeignKey(
        Shipment,
        on_delete=models.CASCADE,
        related_name="status_events",
    )
    status = models.CharField(max_length=30)
    location = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    event_time = models.DateTimeField()
    source = models.CharField(max_length=50, default="system")  # system / carrier / manual

    def __str__(self):
        return f"{self.shipment.tracking_id} – {self.status} @ {self.event_time}"

    class Meta:
        ordering = ["-event_time"]


class ShipmentLabel(TimeStampedModel):
    """Shipping label associated with a shipment."""

    shipment = models.OneToOneField(
        Shipment,
        on_delete=models.CASCADE,
        related_name="label",
    )
    label_url = models.URLField(max_length=1000)
    label_format = models.CharField(max_length=10, default="PDF")  # PDF / ZPL
    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Label for {self.shipment.tracking_id}"
