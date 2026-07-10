from django.contrib import admin
from .models import Order, OrderCustomer, OrderItem, OrderStatusHistory


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("total_price",)


class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    readonly_fields = ("from_status", "to_status", "changed_by", "note", "source", "created_at")
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number", "merchant", "customer_name", "customer_phone",
        "shipping_city", "shipping_pincode", "payment_type", "order_amount",
        "status", "channel_source", "has_missing_weight", "is_flagged", "created_at",
    )
    list_filter = ("status", "channel_source", "payment_type", "has_missing_weight", "is_flagged")
    search_fields = (
        "order_number", "channel_order_id", "customer_name",
        "customer_phone", "merchant__company_name",
    )
    readonly_fields = ("order_number", "created_at", "updated_at")
    date_hierarchy = "created_at"
    inlines = [OrderItemInline, OrderStatusHistoryInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("order", "product_name", "sku", "quantity", "unit_price")
    search_fields = ("order__order_number", "product_name", "sku")
    readonly_fields = ("created_at", "updated_at")


@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ("order", "from_status", "to_status", "changed_by", "source", "created_at")
    list_filter = ("source", "to_status")
    readonly_fields = ("created_at", "updated_at")
