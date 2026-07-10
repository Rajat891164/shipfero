from django.contrib import admin
from .models import WebhookLog, CustomerNotificationLog


@admin.register(WebhookLog)
class WebhookLogAdmin(admin.ModelAdmin):
    list_display = ("courier_code", "tracking_number", "status_code_received", "is_processed", "created_at")
    list_filter = ("courier_code", "is_processed")
    search_fields = ("tracking_number", "error_message")
    readonly_fields = ("created_at", "updated_at", "processed_at")
    date_hierarchy = "created_at"


@admin.register(CustomerNotificationLog)
class CustomerNotificationLogAdmin(admin.ModelAdmin):
    list_display = ("notification_type", "event", "recipient", "status", "sent_at")
    list_filter = ("notification_type", "event", "status")
    search_fields = ("recipient", "shipment__tracking_id")
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "sent_at"
