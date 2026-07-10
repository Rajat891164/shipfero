from django.urls import path
from .views import (
    MerchantCourierListCreateView,
    MerchantCourierDetailView,
    TestCourierConnectionView,
    CourierHealthLogView,
)

urlpatterns = [
    path("", MerchantCourierListCreateView.as_view(), name="courier-list"),
    path("<int:pk>/", MerchantCourierDetailView.as_view(), name="courier-detail"),
    path("<int:pk>/test/", TestCourierConnectionView.as_view(), name="courier-test"),
    path("<int:pk>/health/", CourierHealthLogView.as_view(), name="courier-health"),
]
