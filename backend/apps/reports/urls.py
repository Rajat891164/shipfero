from django.urls import path
from .views import (
    GenerateReportView,
    ReportJobListView,
    ReportJobStatusView,
    ScheduledReportListCreateView,
    ScheduledReportDetailView,
)

urlpatterns = [
    path("", ReportJobListView.as_view(), name="report-list"),
    path("generate/", GenerateReportView.as_view(), name="report-generate"),
    path("<int:pk>/status/", ReportJobStatusView.as_view(), name="report-status"),
    path("scheduled/", ScheduledReportListCreateView.as_view(), name="scheduled-report-list"),
    path("scheduled/<int:pk>/", ScheduledReportDetailView.as_view(), name="scheduled-report-detail"),
]
