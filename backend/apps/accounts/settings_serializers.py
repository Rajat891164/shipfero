from rest_framework import serializers
from .models import MerchantAPIKey, StaffMember, AuditLog
from django.contrib.auth import get_user_model

User = get_user_model()


class MerchantAPIKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = MerchantAPIKey
        fields = ["id", "name", "last_used_at", "last_used_ip", "is_active", "created_at"]
        read_only_fields = ["id", "last_used_at", "last_used_ip", "created_at"]


class StaffMemberSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    mobile = serializers.CharField(source="user.mobile", read_only=True)

    class Meta:
        model = StaffMember
        fields = ["id", "email", "first_name", "last_name", "mobile", "role", "permissions", "is_active", "created_at"]
        read_only_fields = ["id", "email", "first_name", "last_name", "mobile", "created_at"]


class InviteStaffSerializer(serializers.Serializer):
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    mobile = serializers.CharField(max_length=15)
    role = serializers.ChoiceField(choices=StaffMember.Role.choices)
    permissions = serializers.JSONField(default=dict)


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True, allow_null=True)

    class Meta:
        model = AuditLog
        fields = ["id", "action_type", "details", "user_email", "ip_address", "created_at"]
        read_only_fields = ["id", "action_type", "details", "user_email", "ip_address", "created_at"]
