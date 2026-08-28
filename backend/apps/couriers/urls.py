from django.urls import path
from .views import (
    MerchantCourierListCreateView,
    MerchantCourierDetailView,
    TestCourierConnectionView,
    CourierHealthLogView,
    AvailableCarrierListView,
    TestCourierCredentialsView,
    CourierProductsView,
)

urlpatterns = [
    path("", MerchantCourierListCreateView.as_view(), name="courier-list"),
    path("<int:pk>/", MerchantCourierDetailView.as_view(), name="courier-detail"),
    path("<int:pk>/test/", TestCourierConnectionView.as_view(), name="courier-test"),
    path("<int:pk>/health/", CourierHealthLogView.as_view(), name="courier-health"),
    path("<int:pk>/products/", CourierProductsView.as_view(), name="courier-products"),
    path("available/", AvailableCarrierListView.as_view(), name="available-carriers"),
    path("test/", TestCourierCredentialsView.as_view(), name="courier-test-credentials"),
    path("products/", CourierProductsView.as_view(), name="courier-products-unsaved"),
]