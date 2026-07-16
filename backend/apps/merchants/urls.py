from django.urls import path
from .views import (
    OnboardingStatusView,
    MerchantProfileView,
    BusinessProfileView,
    MerchantKYCListCreateView,
    MerchantKYCDetailView,
    BankDetailsListCreateView,
    BankDetailsDetailView,
    PickupLocationListCreateView,
    PickupLocationDetailView,
    SetDefaultPickupLocationView,
    CompleteOnboardingView,
    MerchantPlanView,
    DashboardView,
    DashboardAnalyticsView,
)

urlpatterns = [
    # Merchant profile (basic info)
    path("me/", MerchantProfileView.as_view(), name="merchant-me"),
    path("dashboard/", DashboardView.as_view(), name="merchant-dashboard"),
    path("dashboard/analytics/", DashboardAnalyticsView.as_view(), name="merchant-dashboard-analytics"),

    # Onboarding
    path("onboarding/status/", OnboardingStatusView.as_view(), name="onboarding-status"),
    path("onboarding/business-profile/", BusinessProfileView.as_view(), name="onboarding-business-profile"),
    path("onboarding/kyc/", MerchantKYCListCreateView.as_view(), name="onboarding-kyc-list"),
    path("onboarding/kyc/<int:pk>/", MerchantKYCDetailView.as_view(), name="onboarding-kyc-detail"),
    path("onboarding/bank-details/", BankDetailsListCreateView.as_view(), name="onboarding-bank-list"),
    path("onboarding/bank-details/<int:pk>/", BankDetailsDetailView.as_view(), name="onboarding-bank-detail"),
    path("onboarding/pickup-locations/", PickupLocationListCreateView.as_view(), name="onboarding-pickup-list"),
    path("onboarding/pickup-locations/<int:pk>/", PickupLocationDetailView.as_view(), name="onboarding-pickup-detail"),
    path("onboarding/pickup-locations/<int:pk>/set-default/", SetDefaultPickupLocationView.as_view(), name="onboarding-pickup-set-default"),
    path("onboarding/complete/", CompleteOnboardingView.as_view(), name="onboarding-complete"),

    # Plan
    path("plan/", MerchantPlanView.as_view(), name="merchant-plan"),
]