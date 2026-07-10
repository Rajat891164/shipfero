from django.contrib import admin
from .models import ChannelIntegration, IntegrationSyncLog


class IntegrationSyncLogInline(admin.TabularInline):
    model = IntegrationSyncLog
    extra = 0
    readonly_fields = ("orders_fetched", "orders_created", "errors_encountered", "is_success", "created_at")
    can_delete = False


@admin.register(ChannelIntegration)
class ChannelIntegrationAdmin(admin.ModelAdmin):
    list_display = ("merchant", "platform", "store_name", "status", "last_sync_at", "created_at")
    list_filter = ("platform", "status")
    search_fields = ("merchant__company_name", "store_name", "store_url")
    readonly_fields = ("created_at", "updated_at", "last_sync_at", "last_sync_status")
    inlines = [IntegrationSyncLogInline]


@admin.register(IntegrationSyncLog)
class IntegrationSyncLogAdmin(admin.ModelAdmin):
    list_display = ("integration", "orders_fetched", "is_success", "created_at")
    list_filter = ("is_success", "integration__platform")
    readonly_fields = ("created_at", "updated_at")
