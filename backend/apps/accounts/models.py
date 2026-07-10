from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.conf import settings
from core.models import TimeStampedModel  
from .managers import UserManager
from django.utils import timezone



class User(TimeStampedModel, AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)

    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150, blank=True)

    mobile = models.CharField(max_length=15, unique=True)
    is_verified = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    date_joined = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name"]

    objects = UserManager()

    def __str__(self):
        return self.email



class EmailOTP(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="email_otps",
    )
    code = models.CharField(max_length=6)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()

    def mark_used(self):
        self.is_used = True
        self.save(update_fields=["is_used"])

    @classmethod
    def create_otp_for_user(cls, user):
        import random
        code = f"{random.randint(100000, 999999)}"
        return cls.objects.create(
            user=user,
            code=code,
            expires_at=timezone.now() + timezone.timedelta(minutes=15),
        )

    def is_valid(self, code: str) -> bool:
        now = timezone.now()
        return (
            self.code == code
            and not self.is_used
            and now <= self.expires_at
        )


class MerchantAPIKey(TimeStampedModel):
    """API key for merchant integrations."""
    merchant = models.ForeignKey("merchants.Merchant", on_delete=models.CASCADE, related_name="api_keys")
    key_hash = models.CharField(max_length=255)
    name = models.CharField(max_length=100, default="Default Key")
    last_used_at = models.DateTimeField(null=True, blank=True)
    last_used_ip = models.GenericIPAddressField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"API Key for {self.merchant}"


class StaffMember(TimeStampedModel):
    """Staff invited by a merchant."""
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        OPERATIONS = "OPERATIONS", "Operations"
        FINANCE = "FINANCE", "Finance"
        READ_ONLY = "READ_ONLY", "Read-Only"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="staff_profile")
    merchant = models.ForeignKey("merchants.Merchant", on_delete=models.CASCADE, related_name="staff_members")
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.READ_ONLY)
    permissions = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.email} - {self.role} at {self.merchant}"


class AuditLog(TimeStampedModel):
    """Immutable audit trail for settings changes."""
    merchant = models.ForeignKey("merchants.Merchant", on_delete=models.CASCADE, related_name="audit_logs")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action_type = models.CharField(max_length=100)
    details = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action_type} by {self.user} at {self.created_at}"