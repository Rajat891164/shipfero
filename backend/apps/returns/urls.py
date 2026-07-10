from django.urls import path
from .views import (
    ReturnListView,
    ReturnDetailView,
    CreateReversePickupView,
    MarkReceivedView,
    ReturnStatsView,
)

urlpatterns = [
    path("", ReturnListView.as_view(), name="return-list"),
    path("stats/", ReturnStatsView.as_view(), name="return-stats"),
    path("create-reverse/", CreateReversePickupView.as_view(), name="return-create-reverse"),
    path("<int:pk>/", ReturnDetailView.as_view(), name="return-detail"),
    path("<int:pk>/mark-received/", MarkReceivedView.as_view(), name="return-mark-received"),
]
