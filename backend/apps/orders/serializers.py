from rest_framework import serializers
from core.utils import get_merchant
from .models import Order, OrderCustomer, OrderItem, OrderStatusHistory


class OrderItemSerializer(serializers.ModelSerializer):
    total_price = serializers.ReadOnlyField()

    class Meta:
        model = OrderItem
        fields = [
            "id", "product_name", "sku", "quantity",
            "unit_price", "discount", "tax_percentage",
            "hsn_code", "weight_grams",
            "length_cm", "breadth_cm", "height_cm",
            "total_price",
        ]


class OrderCustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderCustomer
        fields = ["id", "full_name", "phone", "email", "alternate_phone"]


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_email = serializers.CharField(
        source="changed_by.email", read_only=True, allow_null=True
    )

    class Meta:
        model = OrderStatusHistory
        fields = [
            "id", "from_status", "to_status",
            "changed_by_email", "note", "source", "created_at",
        ]


class OrderListSerializer(serializers.ModelSerializer):
    """Lightweight for list views."""
    carrier_name = serializers.CharField(source="assigned_carrier.name", read_only=True, allow_null=True)
    awb_number = serializers.CharField(source="shipment.awb_number", read_only=True, allow_null=True)
    item_count = serializers.IntegerField(source="items.count", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "channel_order_id", "channel_source",
            "customer_name", "customer_phone",
            "shipping_city", "shipping_state", "shipping_pincode",
            "order_amount", "payment_type", "cod_amount",
            "status", "carrier_name", "awb_number",
            "has_missing_weight", "is_flagged", "flag_reason",
            "item_count", "created_at",
        ]


class OrderDetailSerializer(serializers.ModelSerializer):
    """Full detail with nested objects."""
    items = OrderItemSerializer(many=True, read_only=True)
    customer_detail = OrderCustomerSerializer(read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    carrier_name = serializers.CharField(source="assigned_carrier.name", read_only=True, allow_null=True)
    awb_number = serializers.CharField(source="shipment.awb_number", read_only=True, allow_null=True)
    tracking_id = serializers.CharField(source="shipment.tracking_id", read_only=True, allow_null=True)
    shipment_status = serializers.CharField(source="shipment.status", read_only=True, allow_null=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "channel_order_id", "channel_source",
            "merchant",
            # Customer
            "customer_name", "customer_phone", "customer_email",
            "customer_detail",
            # Shipping address
            "shipping_address1", "shipping_address2",
            "shipping_city", "shipping_state", "shipping_pincode", "shipping_country",
            # Billing address
            "billing_same_as_shipping",
            "billing_address1", "billing_address2",
            "billing_city", "billing_state", "billing_pincode",
            "billing_gstin", "eway_bill_number",
            # Financials
            "order_amount", "discount_amount", "tax_amount",
            "shipping_charge_merchant", "payment_type", "cod_amount",
            # Package
            "total_weight", "length", "breadth", "height",
            # Courier / Shipment
            "pickup_location", "assigned_carrier", "carrier_name",
            "shipment", "awb_number", "tracking_id", "shipment_status",
            # Status
            "status", "has_missing_weight", "is_flagged", "flag_reason",
            "is_payment_mapped", "store_payment_method",
            # Nested
            "items", "status_history",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "order_number", "merchant",
            "shipment", "awb_number", "tracking_id", "shipment_status",
            "items", "status_history", "customer_detail",
            "created_at", "updated_at",
        ]


class CreateOrderSerializer(serializers.ModelSerializer):
    """Create a manual order with items."""
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = [
            "channel_order_id", "channel_source",
            "customer_name", "customer_phone", "customer_email",
            "shipping_address1", "shipping_address2",
            "shipping_city", "shipping_state", "shipping_pincode", "shipping_country",
            "billing_same_as_shipping",
            "billing_address1", "billing_address2",
            "billing_city", "billing_state", "billing_pincode",
            "billing_gstin", "eway_bill_number",
            "order_amount", "discount_amount", "tax_amount",
            "shipping_charge_merchant", "payment_type", "cod_amount",
            "total_weight", "length", "breadth", "height",
            "pickup_location", "assigned_carrier",
            "integration", "store_payment_method",
            "items",
        ]

    def validate_integration(self, value):
        if value is None:
            return value
        merchant = get_merchant(self.context["request"])
        if value.merchant_id != merchant.id:
            raise serializers.ValidationError("Integration not found.")
        return value

    def validate(self, attrs):
        payment_type = attrs.get("payment_type")
        cod_amount = attrs.get("cod_amount", 0)
        if payment_type == Order.PaymentType.COD and cod_amount <= 0:
            raise serializers.ValidationError(
                {"cod_amount": "COD amount must be > 0 for COD orders."}
            )
        if payment_type == Order.PaymentType.PREPAID and cod_amount > 0:
            raise serializers.ValidationError(
                {"cod_amount": "COD amount must be 0 for prepaid orders."}
            )
        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        merchant = get_merchant(self.context["request"])
        order = Order.objects.create(merchant=merchant, **validated_data)

        # PRD Module 3: if the order came from a channel with a raw payment
        # method name, resolve it via that channel's payment mappings. Unmapped
        # → flag the order and block processing until a mapping is created.
        integration = validated_data.get("integration")
        store_method = validated_data.get("store_payment_method")
        if integration and store_method:
            from apps.integrations.models import resolve_payment_type
            resolved = resolve_payment_type(integration, store_method)
            if resolved is None:
                order.is_payment_mapped = False
                order.is_flagged = True
                order.flag_reason = f"Unmapped payment method: {store_method}"
                order.save(update_fields=[
                    "is_payment_mapped", "is_flagged", "flag_reason",
                ])
            elif resolved != order.payment_type:
                order.payment_type = resolved
                order.save(update_fields=["payment_type"])

        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        # Auto-compute total weight from items if not provided
        if not order.total_weight and items_data:
            total_grams = sum(
                (i.get("weight_grams") or 0) * i.get("quantity", 1)
                for i in items_data
            )
            if total_grams:
                order.total_weight = total_grams / 1000
                order.has_missing_weight = False
                order.save(update_fields=["total_weight", "has_missing_weight"])
        OrderStatusHistory.objects.create(
            order=order,
            from_status=None,
            to_status=Order.OrderStatus.NEW,
            source="merchant",
        )
        return order


class UpdateOrderWeightSerializer(serializers.Serializer):
    """Update weight/dimensions for processing."""
    total_weight = serializers.DecimalField(max_digits=8, decimal_places=2)
    length = serializers.DecimalField(max_digits=8, decimal_places=2, required=False)
    breadth = serializers.DecimalField(max_digits=8, decimal_places=2, required=False)
    height = serializers.DecimalField(max_digits=8, decimal_places=2, required=False)
    assigned_carrier_id = serializers.IntegerField(required=False)
    pickup_location_id = serializers.IntegerField(required=False)


class BookAWBSerializer(serializers.Serializer):
    """Book AWB for a processed order."""
    carrier_id = serializers.IntegerField()
    pickup_location_id = serializers.IntegerField(required=False)
    service_type = serializers.ChoiceField(
        choices=["STANDARD", "EXPRESS", "SAME_DAY", "OVERNIGHT"],
        default="STANDARD"
    )


class BulkProcessSerializer(serializers.Serializer):
    """Bulk process multiple orders."""
    order_ids = serializers.ListField(
        child=serializers.IntegerField(),
        max_length=500,
    )
    carrier_id = serializers.IntegerField()
    service_type = serializers.ChoiceField(
        choices=["STANDARD", "EXPRESS", "SAME_DAY", "OVERNIGHT"],
        default="STANDARD"
    )
