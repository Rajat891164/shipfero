from django.urls import path
from .views import (
    OrderListCreateView,
    OrderDetailView,
    ProcessOrderView,
    BookAWBView,
    BulkProcessOrdersView,
    CancelOrderView,
    OrderStatsView,
)

urlpatterns = [
    path("", OrderListCreateView.as_view(), name="order-list-create"),
    path("stats/", OrderStatsView.as_view(), name="order-stats"),
    path("bulk-process/", BulkProcessOrdersView.as_view(), name="order-bulk-process"),
    path("<int:pk>/", OrderDetailView.as_view(), name="order-detail"),
    path("<int:pk>/process/", ProcessOrderView.as_view(), name="order-process"),
    path("<int:pk>/book-awb/", BookAWBView.as_view(), name="order-book-awb"),
    path("<int:pk>/cancel/", CancelOrderView.as_view(), name="order-cancel"),
]
