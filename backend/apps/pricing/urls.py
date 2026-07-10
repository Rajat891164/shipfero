from django.urls import path
from .views import PricingZoneListView, RateCardListView, CompareRatesView

urlpatterns = [
    path("zones/", PricingZoneListView.as_view(), name="pricing-zones"),
    path("rate-cards/", RateCardListView.as_view(), name="pricing-rate-cards"),
    path("compare/", CompareRatesView.as_view(), name="pricing-compare"),
]
