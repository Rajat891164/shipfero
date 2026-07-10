from django.urls import path
from .views import (
    ShipmentListCreateView,
    ShipmentDetailView,
    BookShipmentView,
    TrackShipmentView,
    ShipmentStatsView,
)

urlpatterns = [
    path("", ShipmentListCreateView.as_view(), name="shipment-list-create"),
    path("stats/", ShipmentStatsView.as_view(), name="shipment-stats"),
    path("track/<str:tracking_id>/", TrackShipmentView.as_view(), name="shipment-track"),
    path("<int:pk>/", ShipmentDetailView.as_view(), name="shipment-detail"),
    path("<int:pk>/book/", BookShipmentView.as_view(), name="shipment-book"),
]
