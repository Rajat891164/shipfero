from django.conf import settings
from django.db import models

from core.models import TimeStampedModel  


class Merchant(TimeStampedModel):
    class KYCStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
        VERIFIED = "VERIFIED", "Verified"
        REJECTED = "REJECTED", "Rejected"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"
        SUSPENDED = "SUSPENDED", "Suspended"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="merchant",
    )

    company_name = models.CharField(max_length=255)
    business_email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15)

    gst_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    pan_number = models.CharField(max_length=20, unique=True, null=True, blank=True)

    referral_code = models.CharField(max_length=50, null=True, blank=True)

    email_verified = models.BooleanField(default=False)

    kyc_status = models.CharField(
        max_length=20,
        choices=KYCStatus.choices,
        default=KYCStatus.PENDING,
    )

    onboarding_step = models.PositiveSmallIntegerField(default=1)
    onboarding_completed = models.BooleanField(default=False)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    def __str__(self):
        return f"{self.company_name} ({self.business_email})"


class MerchantProfile(TimeStampedModel):
    class BusinessType(models.TextChoices):
        PROPRIETORSHIP = "PROPRIETORSHIP", "Proprietorship"
        PVT_LTD = "PVT_LTD", "Private Limited"
        LLP = "LLP", "LLP"
        PARTNERSHIP = "PARTNERSHIP", "Partnership"
        OTHER = "OTHER", "Other"

    merchant = models.OneToOneField(
        Merchant,
        on_delete=models.CASCADE,
        related_name="profile",
    )

    business_type = models.CharField(max_length=50, choices=BusinessType.choices)
    industry = models.CharField(max_length=100)
    monthly_shipment_volume = models.CharField(max_length=50)

    website_url = models.URLField(max_length=500, null=True, blank=True)
    logo_url = models.URLField(max_length=500, null=True, blank=True)

    def __str__(self):
        return f"Profile for {self.merchant.company_name}"


class MerchantKYC(TimeStampedModel):
    class DocumentStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
        VERIFIED = "VERIFIED", "Verified"
        REJECTED = "REJECTED", "Rejected"

    merchant = models.ForeignKey(
        Merchant,
        on_delete=models.CASCADE,
        related_name="kyc_documents",
    )

    document_type = models.CharField(max_length=50)      # PAN / GST / AADHAAR / INCORP_CERT
    document_number = models.CharField(max_length=100, null=True, blank=True)
    document_url = models.URLField(max_length=1000)

    status = models.CharField(
        max_length=20,
        choices=DocumentStatus.choices,
        default=DocumentStatus.PENDING,
    )
    rejection_reason = models.TextField(null=True, blank=True)

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_kyc_documents",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.document_type} for {self.merchant.company_name}"


class MerchantBankDetails(TimeStampedModel):
    class AccountType(models.TextChoices):
        SAVINGS = "SAVINGS", "Savings"
        CURRENT = "CURRENT", "Current"

    merchant = models.ForeignKey(
        Merchant,
        on_delete=models.CASCADE,
        related_name="bank_accounts",
    )

    account_holder = models.CharField(max_length=255)
    bank_name = models.CharField(max_length=255)
    account_number = models.CharField(max_length=50)
    ifsc_code = models.CharField(max_length=20)
    account_type = models.CharField(
        max_length=20,
        choices=AccountType.choices,
    )

    is_verified = models.BooleanField(default=False)
    verification_reference = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )
    verified_at = models.DateTimeField(null=True, blank=True)

    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.bank_name} - {self.account_number} ({self.merchant.company_name})"


class PickupLocation(TimeStampedModel):
    merchant = models.ForeignKey(
        Merchant,
        on_delete=models.CASCADE,
        related_name="pickup_locations",
    )

    location_name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=255)
    contact_phone = models.CharField(max_length=20)

    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)

    gstin = models.CharField(max_length=20, null=True, blank=True)

    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.location_name} ({self.city})"


class MerchantPlan(TimeStampedModel):
    class PlanStatus(models.TextChoices):
        TRIAL = "TRIAL", "Trial"
        ACTIVE = "ACTIVE", "Active"
        EXPIRED = "EXPIRED", "Expired"
        CANCELLED = "CANCELLED", "Cancelled"

    merchant = models.ForeignKey(
        Merchant,
        on_delete=models.CASCADE,
        related_name="plans",
    )

    plan_name = models.CharField(max_length=50)   # Starter / Growth / Pro / Enterprise
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    features_json = models.JSONField(null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=PlanStatus.choices,
        default=PlanStatus.TRIAL,
    )

    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    is_current = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.plan_name} ({self.merchant.company_name})"