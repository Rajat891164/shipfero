import uuid
from django.db import models
from django.conf import settings
from core.models import TimeStampedModel
from apps.merchants.models import Merchant


class ReportJob(TimeStampedModel):
    """Background report generation task tracking."""

    class ReportType(models.TextChoices):
        MASTER_MIS = "MASTER_MIS", "Master MIS"
        ORDERS = "ORDERS", "Orders Report"
        CURRENT_SHIPMENT = "CURRENT_SHIPMENT", "Current Shipment"
        NDR = "NDR", "NDR Report"
        IN_TRANSIT_DELAY = "IN_TRANSIT_DELAY", "In-Transit Delay"
        PRODUCT = "PRODUCT", "Product-wise"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PROCESSING = "PROCESSING", "Processing"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"

    merchant = models.ForeignKey(
        Merchant, on_delete=models.CASCADE, related_name="report_jobs"
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    report_type = models.CharField(max_length=50, choices=ReportType.choices)
    
    # Filters applied
    date_from = models.DateField(null=True, blank=True)
    date_to = models.DateField(null=True, blank=True)
    filters_json = models.JSONField(default=dict, blank=True)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    # Celery task ID
    task_id = models.CharField(max_length=255, null=True, blank=True)
    
    # Result
    download_url = models.URLField(max_length=1000, null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.report_type} for {self.merchant.company_name} ({self.status})"

    class Meta:
        ordering = ["-created_at"]


class ScheduledReport(TimeStampedModel):
    """Configuration for recurring reports."""

    class Frequency(models.TextChoices):
        DAILY = "DAILY", "Daily"
        WEEKLY = "WEEKLY", "Weekly"
        MONTHLY = "MONTHLY", "Monthly"

    merchant = models.ForeignKey(
        Merchant, on_delete=models.CASCADE, related_name="scheduled_reports"
    )
    report_type = models.CharField(max_length=50, choices=ReportJob.ReportType.choices)
    frequency = models.CharField(max_length=20, choices=Frequency.choices)
    
    # List of emails
    recipient_emails = models.JSONField(default=list)
    
    is_active = models.BooleanField(default=True)
    last_run_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.frequency} {self.report_type} for {self.merchant.company_name}"
