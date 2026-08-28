from django.db import models

from core.models import TimeStampedModel
from core.encryption import decrypt_value, encrypt_value
from apps.merchants.models import Merchant
from apps.carriers.models import Carrier


class CarrierCredential(TimeStampedModel):
    """
    System-wide credentials owned by ShipFero.

    Example:
        Blue Dart -> Client ID + Client Secret + JWT
    """

    carrier = models.OneToOneField(
        Carrier,
        on_delete=models.CASCADE,
        related_name="system_credentials",
    )

    client_id = models.CharField(max_length=255)
    client_secret = models.CharField(max_length=500)

    access_token = models.TextField(
        blank=True,
        null=True,
    )

    token_expiry = models.DateTimeField(
        blank=True,
        null=True,
    )

    sandbox_url = models.URLField(
        blank=True,
    )

    production_url = models.URLField(
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    def __str__(self):
        return f"{self.carrier.name} System Credentials"


class MerchantCourier(TimeStampedModel):
    """
    Merchant-specific courier configuration.

    A merchant can have multiple profiles/configurations for the
    same carrier.

    Credentials are stored encrypted inside the JSONField.
    Always use get_credential() when reading credential values.
    """

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"
        CREDENTIALS_INVALID = (
            "CREDENTIALS_INVALID",
            "Credentials Invalid",
        )

    class LabelType(models.TextChoices):
        A4 = "A4", "A4"
        A6 = "A6", "A6"
        THERMAL = "THERMAL", "Thermal"

    class ShippingMode(models.TextChoices):
        SURFACE = "SURFACE", "Surface"
        AIR = "AIR", "Air"
        EXPRESS = "EXPRESS", "Express"

    merchant = models.ForeignKey(
        Merchant,
        on_delete=models.CASCADE,
        related_name="configured_couriers",
    )

    carrier = models.ForeignKey(
        Carrier,
        on_delete=models.CASCADE,
        related_name="merchant_configurations",
    )

    # ------------------------------------------------------------------
    # Legacy fields
    # ------------------------------------------------------------------

    api_key = models.CharField(
        max_length=500,
        blank=True,
        null=True,
    )

    api_secret = models.CharField(
        max_length=500,
        blank=True,
        null=True,
    )

    account_number = models.CharField(
        max_length=500,
        blank=True,
        null=True,
    )

    # ------------------------------------------------------------------
    # Flexible encrypted credentials
    # ------------------------------------------------------------------

    credentials = models.JSONField(
        default=dict,
        blank=True,
        help_text=(
            "Courier-specific credentials stored as JSON. "
            "Values are encrypted at rest via set_credential()."
        ),
    )

    # ------------------------------------------------------------------
    # Status
    # ------------------------------------------------------------------

    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    # ------------------------------------------------------------------
    # Preferences
    # ------------------------------------------------------------------

    is_default = models.BooleanField(
        default=False,
    )

    allow_cod = models.BooleanField(
        default=True,
    )

    # ------------------------------------------------------------------
    # Shipping settings
    # ------------------------------------------------------------------

    label_type = models.CharField(
        max_length=10,
        choices=LabelType.choices,
        default=LabelType.A4,
    )

    otp_delivery = models.BooleanField(
        default=False,
    )

    forward_active = models.BooleanField(
        default=True,
    )

    reverse_active = models.BooleanField(
        default=True,
    )

    shipping_mode = models.CharField(
        max_length=10,
        choices=ShippingMode.choices,
        default=ShippingMode.SURFACE,
    )

    # ------------------------------------------------------------------
    # Health / testing
    # ------------------------------------------------------------------

    last_tested_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    last_test_status = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    # ------------------------------------------------------------------
    # Credential helpers
    # ------------------------------------------------------------------

    def get_credential(self, key, default=""):
        """
        Read a credential from the encrypted credentials JSON.

        New records:
            value is encrypted -> decrypt it.

        Old records:
            value may be plaintext -> return it unchanged.

        This backward-compatible behaviour prevents older integrations
        from breaking after encryption was introduced.
        """

        data = self.credentials or {}

        raw = data.get(key, default)

        if raw is None:
            return default

        if not isinstance(raw, str):
            return raw

        if not raw:
            return default

        try:
            return decrypt_value(raw)
        except Exception:
            # Existing plaintext/legacy value.
            return raw

    def set_credential(self, key, value):
        """
        Encrypt and store one credential.

        Empty values remain empty instead of being encrypted.
        """

        data = dict(self.credentials or {})

        if value is None:
            data[key] = value
        elif isinstance(value, str) and not value:
            data[key] = value
        else:
            data[key] = encrypt_value(str(value))

        self.credentials = data

    def get_decrypted_credentials(self):
        """
        Return a decrypted copy of the complete credentials dictionary.

        IMPORTANT:
        This does NOT modify self.credentials.

        Use this in courier/booking services when the service needs
        multiple credential values at once.
        """

        data = self.credentials or {}
        decrypted = {}

        for key, value in data.items():
            if value is None:
                decrypted[key] = value
                continue

            if not isinstance(value, str):
                decrypted[key] = value
                continue

            if not value:
                decrypted[key] = value
                continue

            try:
                decrypted[key] = decrypt_value(value)
            except Exception:
                # Backward compatibility for plaintext credentials.
                decrypted[key] = value

        return decrypted

    def __str__(self):
        return (
            f"{self.merchant.company_name} - "
            f"{self.carrier.name}"
        )


class CourierHealthLog(TimeStampedModel):
    """
    Stores courier API health check history.
    """

    merchant_courier = models.ForeignKey(
        MerchantCourier,
        on_delete=models.CASCADE,
        related_name="health_logs",
    )

    is_healthy = models.BooleanField(
        default=True,
    )

    response_time_ms = models.PositiveIntegerField(
        blank=True,
        null=True,
    )

    error_message = models.TextField(
        blank=True,
        null=True,
    )

    def __str__(self):
        return (
            f"Health check for "
            f"{self.merchant_courier} at "
            f"{self.created_at}"
        )