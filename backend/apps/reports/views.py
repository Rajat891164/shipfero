from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from core.utils import get_merchant
from .models import ReportJob, ScheduledReport
from .serializers import (
    ReportJobSerializer,
    GenerateReportRequestSerializer,
    ScheduledReportSerializer,
)


class GenerateReportView(APIView):
    """POST /api/reports/generate/ — Kick off async report generation."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = GenerateReportRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        job = ReportJob.objects.create(
            merchant=get_merchant(request),
            requested_by=request.user,
            report_type=data["report_type"],
            date_from=data.get("date_from"),
            date_to=data.get("date_to"),
            filters_json=data.get("filters_json", {}),
            status=ReportJob.Status.PROCESSING,
        )

        # In a real app, you would trigger a Celery task here:
        # generate_report_task.delay(job.id)
        
        # Simulating completion for demonstration
        job.status = ReportJob.Status.COMPLETED
        job.download_url = "https://s3.amazonaws.com/dummy-bucket/reports/dummy-report.csv"
        job.expires_at = timezone.now() + timezone.timedelta(days=1)
        job.completed_at = timezone.now()
        job.save()

        return Response(ReportJobSerializer(job).data, status=status.HTTP_201_CREATED)


class ReportJobListView(generics.ListAPIView):
    """GET /api/reports/ — Download center (past reports)."""
    permission_classes = [IsAuthenticated]
    serializer_class = ReportJobSerializer

    def get_queryset(self):
        # Return past 90 days of reports
        ninety_days_ago = timezone.now() - timezone.timedelta(days=90)
        return ReportJob.objects.filter(
            merchant=get_merchant(self.request),
            created_at__gte=ninety_days_ago
        ).order_by("-created_at")


class ReportJobStatusView(generics.RetrieveAPIView):
    """GET /api/reports/<id>/status/ — Polling endpoint."""
    permission_classes = [IsAuthenticated]
    serializer_class = ReportJobSerializer

    def get_queryset(self):
        return ReportJob.objects.filter(merchant=get_merchant(self.request))


class ScheduledReportListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/reports/scheduled/
    POST /api/reports/scheduled/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ScheduledReportSerializer

    def get_queryset(self):
        return ScheduledReport.objects.filter(merchant=get_merchant(self.request))

    def perform_create(self, serializer):
        serializer.save(merchant=get_merchant(self.request))


class ScheduledReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/reports/scheduled/<id>/"""
    permission_classes = [IsAuthenticated]
    serializer_class = ScheduledReportSerializer

    def get_queryset(self):
        return ScheduledReport.objects.filter(merchant=get_merchant(self.request))
