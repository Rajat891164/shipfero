import uuid
from django.db import models
from django.conf import settings
from core.models import TimeStampedModel
from apps.merchants.models import Merchant, PickupLocation


class Order(TimeStampedModel):
    """
    Core order entity — sourced from channel sync (Shopify/Amazon/WooCommerce)
    or created manually. One Order → One Shipment (after AWB booking).
    """

    class OrderStatus(models.TextChoices):
        NEW = "NEW", "New"
        PROCESSING = "PROCESSING", "Processing"
        READY_TO_SHIP = "READY_TO_SHIP", "Ready to Ship"
        BOOKED = "BOOKED", "AWB Booked"
        IN_TRANSIT = "IN_TRANSIT", "In Transit"
        OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY", "Out for Delivery"
        DELIVERED = "DELIVERED", "Delivered"
        FAILED_DELIVERY = "FAILED_DELIVERY", "Failed Delivery"
        RTO_INITIATED = "RTO_INITIATED", "RTO Initiated"
        RTO_DELIVERED = "RTO_DELIVERED", "RTO Delivered"
        CANCELLED = "CANCELLED", "Cancelled"
        ON_HOLD = "ON_HOLD", "On Hold"

    class PaymentType(models.TextChoices):
        COD = "COD", "Cash on Delivery"
        PREPAID = "PREPAID", "Prepaid"

    class ChannelSource(models.TextChoices):
        MANUAL = "MANUAL", "Manual"
        SHOPIFY = "SHOPIFY", "Shopify"
        AMAZON = "AMAZON", "Amazon"
        WOOCOMMERCE = "WOOCOMMERCE", "WooCommerce"
        FLIPKART = "FLIPKART", "Flipkart"
        MAGENTO = "MAGENTO", "Magento"
        WIX = "WIX", "Wix"
        BIGCOMMERCE = "BIGCOMMERCE", "BigCommerce"
        OTHER = "OTHER", "Other"

    # Identity
    order_number = models.CharField(max_length=100, db_index=True)
    channel_order_id = models.CharField(max_length=200, null=True, blank=True, db_index=True)
    channel_source = models.CharField(
        max_length=20, choices=ChannelSource.choices, default=ChannelSource.MANUAL
    )

    # Merchant
    merchant = models.ForeignKey(
        Merchant, on_delete=models.CASCADE, related_name="orders"
    )
    pickup_location = models.ForeignKey(
        PickupLocation, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="orders"
    )

    # Customer (denormalized for quick access)
    customer_name = models.CharField(max_length=255)
    customer_phone = models.CharField(max_length=20)
    customer_email = models.EmailField(null=True, blank=True)

    # Shipping address
    shipping_address1 = models.CharField(max_length=255)
    shipping_address2 = models.CharField(max_length=255, null=True, blank=True)
    shipping_city = models.CharField(max_length=100)
    shipping_state = models.CharField(max_length=100)
    shipping_pincode = models.CharField(max_length=10)
    shipping_country = models.CharField(max_length=50, default="India")

    # Billing address (for B2B)
    billing_same_as_shipping = models.BooleanField(default=True)
    billing_address1 = models.CharField(max_length=255, null=True, blank=True)
    billing_address2 = models.CharField(max_length=255, null=True, blank=True)
    billing_city = models.CharField(max_length=100, null=True, blank=True)
    billing_state = models.CharField(max_length=100, null=True, blank=True)
    billing_pincode = models.CharField(max_length=10, null=True, blank=True)
    billing_gstin = models.CharField(max_length=20, null=True, blank=True)
    eway_bill_number = models.CharField(max_length=50, null=True, blank=True)

    # Order financials
    order_amount = models.DecimalField(max_digits=12, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping_charge_merchant = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_type = models.CharField(max_length=10, choices=PaymentType.choices)
    cod_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Package details (filled at processing)
    total_weight = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    length = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    breadth = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    height = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)

    # Courier selection (filled when processing)
    assigned_carrier = models.ForeignKey(
        "carriers.Carrier", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="orders"
    )

    # Linked shipment (created on AWB booking)
    shipment = models.OneToOneField(
        "shipments.Shipment", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="order"
    )

    # Status
    status = models.CharField(
        max_length=30, choices=OrderStatus.choices, default=OrderStatus.NEW, db_index=True
    )

    # Flags
    has_missing_weight = models.BooleanField(default=False)
    is_payment_mapped = models.BooleanField(default=True)
    is_flagged = models.BooleanField(default=False)
    flag_reason = models.CharField(max_length=255, null=True, blank=True)

    # Source metadata
    channel_raw_data = models.JSONField(null=True, blank=True)

    # Integration reference
    integration = models.ForeignKey(
        "integrations.ChannelIntegration", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="orders"
    )

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = f"ORD-{uuid.uuid4().hex[:10].upper()}"
        # Check missing weight
        if not self.total_weight:
            self.has_missing_weight = True
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.order_number} — {self.customer_name} ({self.status})"

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["merchant", "status"]),
            models.Index(fields=["merchant", "created_at"]),
            models.Index(fields=["merchant", "channel_source"]),
        ]
        unique_together = [("merchant", "channel_order_id", "channel_source")]


class OrderCustomer(TimeStampedModel):
    """Extended customer details for an order."""

    order = models.OneToOneField(
        Order, on_delete=models.CASCADE, related_name="customer_detail"
    )
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField(null=True, blank=True)
    alternate_phone = models.CharField(max_length=20, null=True, blank=True)

    def __str__(self):
        return f"Customer for {self.order.order_number}"


class OrderItem(TimeStampedModel):
    """Line items in an order."""

    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="items"
    )
    product_name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    hsn_code = models.CharField(max_length=20, null=True, blank=True)
    weight_grams = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    length_cm = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    breadth_cm = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    height_cm = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)

    @property
    def total_price(self):
        return (self.unit_price - self.discount) * self.quantity

    def __str__(self):
        return f"{self.product_name} x{self.quantity} (Order: {self.order.order_number})"


class OrderStatusHistory(TimeStampedModel):
    """Audit trail of all order status transitions."""

    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="status_history"
    )
    from_status = models.CharField(max_length=30, null=True, blank=True)
    to_status = models.CharField(max_length=30)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="order_status_changes"
    )
    note = models.CharField(max_length=255, null=True, blank=True)
    source = models.CharField(max_length=30, default="system")  # system / merchant / webhook / admin

    def __str__(self):
        return f"{self.order.order_number}: {self.from_status} → {self.to_status}"

    class Meta:
        ordering = ["-created_at"]
