from django.urls import path
from .views import (
    IntegrationListCreateView,
    IntegrationDetailView,
    IntegrationSyncView,
    IntegrationLogsView,
    PaymentMappingListCreateView,
    PaymentMappingDeleteView,
    BulkPrepaidMappingView,
)

urlpatterns = [
    path("", IntegrationListCreateView.as_view(), name="integration-list"),
    path("<int:pk>/", IntegrationDetailView.as_view(), name="integration-detail"),
    path("<int:pk>/sync/", IntegrationSyncView.as_view(), name="integration-sync"),
    path("<int:pk>/logs/", IntegrationLogsView.as_view(), name="integration-logs"),
    path("<int:pk>/payment-mappings/", PaymentMappingListCreateView.as_view(), name="payment-mapping-list"),
    path("<int:pk>/payment-mappings/bulk-prepaid/", BulkPrepaidMappingView.as_view(), name="payment-mapping-bulk-prepaid"),
    path("<int:pk>/payment-mappings/<int:mapping_pk>/", PaymentMappingDeleteView.as_view(), name="payment-mapping-delete"),
]
