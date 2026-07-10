from django.urls import path
from .views import (
    CarrierListView,
    CarrierDetailView,
    ServiceabilityCheckView,
    RateCalculatorView,
)

urlpatterns = [
    path("", CarrierListView.as_view(), name="carrier-list"),
    path("<int:pk>/", CarrierDetailView.as_view(), name="carrier-detail"),
    path("serviceability/", ServiceabilityCheckView.as_view(), name="carrier-serviceability"),
    path("calculate-rate/", RateCalculatorView.as_view(), name="carrier-rate-calculator"),
]
