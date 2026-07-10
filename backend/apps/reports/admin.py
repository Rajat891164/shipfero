from django.contrib import admin
from .models import ReportJob, ScheduledReport


@admin.register(ReportJob)
class ReportJobAdmin(admin.ModelAdmin):
    list_display = ("merchant", "report_type", "status", "requested_by", "created_at")
    list_filter = ("status", "report_type")
    search_fields = ("merchant__company_name", "task_id")
    readonly_fields = ("created_at", "updated_at", "completed_at")


@admin.register(ScheduledReport)
class ScheduledReportAdmin(admin.ModelAdmin):
    list_display = ("merchant", "report_type", "frequency", "is_active", "last_run_at")
    list_filter = ("frequency", "is_active", "report_type")
    search_fields = ("merchant__company_name",)
    readonly_fields = ("created_at", "updated_at", "last_run_at")
