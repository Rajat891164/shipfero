from django.urls import path
from .views import (
    NDRListView,
    NDRDetailView,
    TakeNDRActionView,
    BulkNDRActionView,
    NDRDashboardView,
)

urlpatterns = [
    path("", NDRListView.as_view(), name="ndr-list"),
    path("dashboard/", NDRDashboardView.as_view(), name="ndr-dashboard"),
    path("bulk-action/", BulkNDRActionView.as_view(), name="ndr-bulk-action"),
    path("<int:pk>/", NDRDetailView.as_view(), name="ndr-detail"),
    path("<int:pk>/action/", TakeNDRActionView.as_view(), name="ndr-action"),
]
