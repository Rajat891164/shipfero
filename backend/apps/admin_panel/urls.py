from django.urls import path
from .views import (
    AdminDashboardView,
    AdminKYCListView,
    AdminKYCDetailView,
    AdminReviewKYCView,
    AdminMerchantListView,
    AdminMerchantDetailView,
    AdminMerchantStatusView,
    AdminCarrierListCreateView,
    AdminCarrierDetailView,
    AdminServiceablePincodeListCreateView,
    AdminWalletAdjustmentView,
)

urlpatterns = [
    # Dashboard
    path("dashboard/", AdminDashboardView.as_view(), name="admin-dashboard"),

    # KYC
    path("kyc/", AdminKYCListView.as_view(), name="admin-kyc-list"),
    path("kyc/<int:pk>/", AdminKYCDetailView.as_view(), name="admin-kyc-detail"),
    path("kyc/<int:pk>/review/", AdminReviewKYCView.as_view(), name="admin-kyc-review"),

    # Merchants
    path("merchants/", AdminMerchantListView.as_view(), name="admin-merchant-list"),
    path("merchants/<int:pk>/", AdminMerchantDetailView.as_view(), name="admin-merchant-detail"),
    path("merchants/<int:pk>/status/", AdminMerchantStatusView.as_view(), name="admin-merchant-status"),

    # Carriers
    path("carriers/", AdminCarrierListCreateView.as_view(), name="admin-carrier-list"),
    path("carriers/<int:pk>/", AdminCarrierDetailView.as_view(), name="admin-carrier-detail"),
    path("carriers/pincodes/", AdminServiceablePincodeListCreateView.as_view(), name="admin-pincode-list"),

    # Billing
    path("billing/adjust/", AdminWalletAdjustmentView.as_view(), name="admin-wallet-adjust"),
]
