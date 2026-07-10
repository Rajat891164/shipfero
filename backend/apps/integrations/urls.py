from django.urls import path
from .views import (
    IntegrationListCreateView,
    IntegrationDetailView,
    IntegrationSyncView,
    IntegrationLogsView,
)

urlpatterns = [
    path("", IntegrationListCreateView.as_view(), name="integration-list"),
    path("<int:pk>/", IntegrationDetailView.as_view(), name="integration-detail"),
    path("<int:pk>/sync/", IntegrationSyncView.as_view(), name="integration-sync"),
    path("<int:pk>/logs/", IntegrationLogsView.as_view(), name="integration-logs"),
]
