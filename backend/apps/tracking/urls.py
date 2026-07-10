from django.urls import path
from .views import (
    TrackingTimelineView,
    CourierWebhookReceiverView,
    TrackingAnalyticsView,
)

urlpatterns = [
    path("analytics/", TrackingAnalyticsView.as_view(), name="tracking-analytics"),
    path("<str:awb>/", TrackingTimelineView.as_view(), name="tracking-timeline"),
    path("webhooks/<str:courier_code>/", CourierWebhookReceiverView.as_view(), name="tracking-webhook"),
]
