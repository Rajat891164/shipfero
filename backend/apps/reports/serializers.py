from rest_framework import serializers
from .models import ReportJob, ScheduledReport


class ReportJobSerializer(serializers.ModelSerializer):
    requested_by_email = serializers.CharField(source="requested_by.email", read_only=True, allow_null=True)

    class Meta:
        model = ReportJob
        fields = [
            "id", "report_type", "date_from", "date_to", "filters_json",
            "status", "download_url", "expires_at", "error_message",
            "requested_by_email", "created_at", "completed_at"
        ]
        read_only_fields = [
            "id", "status", "download_url", "expires_at", "error_message",
            "requested_by_email", "created_at", "completed_at"
        ]


class GenerateReportRequestSerializer(serializers.Serializer):
    report_type = serializers.ChoiceField(choices=ReportJob.ReportType.choices)
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    filters_json = serializers.JSONField(required=False, default=dict)


class ScheduledReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduledReport
        fields = [
            "id", "report_type", "frequency", "recipient_emails",
            "is_active", "last_run_at", "created_at"
        ]
        read_only_fields = ["id", "last_run_at", "created_at"]
