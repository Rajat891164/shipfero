from django.urls import path
from .views import (
    WalletView,
    AddFundsView,
    TransactionListView,
    TransactionDetailView,
    InvoiceListView,
    InvoiceDetailView,
    BillingSummaryView,
)

urlpatterns = [
    path("wallet/", WalletView.as_view(), name="wallet"),
    path("wallet/add-funds/", AddFundsView.as_view(), name="wallet-add-funds"),
    path("transactions/", TransactionListView.as_view(), name="transaction-list"),
    path("transactions/<int:pk>/", TransactionDetailView.as_view(), name="transaction-detail"),
    path("invoices/", InvoiceListView.as_view(), name="invoice-list"),
    path("invoices/<int:pk>/", InvoiceDetailView.as_view(), name="invoice-detail"),
    path("summary/", BillingSummaryView.as_view(), name="billing-summary"),
]
