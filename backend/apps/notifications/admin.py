from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "user", "notification_type", "priority",
        "title", "is_read", "read_at", "created_at",
    )
    list_filter = ("notification_type", "priority", "is_read")
    search_fields = ("user__email", "title", "message")
    readonly_fields = ("read_at", "created_at", "updated_at")
    date_hierarchy = "created_at"
