import secrets
import hashlib
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import MerchantAPIKey, StaffMember, AuditLog
from .settings_serializers import (
    MerchantAPIKeySerializer,
    StaffMemberSerializer,
    InviteStaffSerializer,
    AuditLogSerializer
)
from django.contrib.auth import get_user_model

User = get_user_model()


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


class APIKeyListCreateView(APIView):
    """GET /api/settings/api-keys/ | POST /api/settings/api-keys/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        merchant = request.user.merchant
        keys = MerchantAPIKey.objects.filter(merchant=merchant, is_active=True)
        return Response(MerchantAPIKeySerializer(keys, many=True).data)

    def post(self, request):
        merchant = request.user.merchant
        name = request.data.get("name", "Default Key")
        
        # Generate API Key
        raw_key = f"sf_live_{secrets.token_urlsafe(32)}"
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        
        key_obj = MerchantAPIKey.objects.create(
            merchant=merchant,
            name=name,
            key_hash=key_hash,
        )

        AuditLog.objects.create(
            merchant=merchant,
            user=request.user,
            action_type="API_KEY_CREATED",
            details=f"Created new API key: {name}",
            ip_address=get_client_ip(request)
        )

        # We return the raw key only ONCE
        return Response({
            "api_key": raw_key,
            "id": key_obj.id,
            "name": key_obj.name,
            "message": "Please copy this key now. It will not be shown again."
        }, status=status.HTTP_201_CREATED)


class APIKeyRevokeView(APIView):
    """DELETE /api/settings/api-keys/<id>/"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            key = MerchantAPIKey.objects.get(pk=pk, merchant=request.user.merchant)
            key.is_active = false
            key.delete()
            
            AuditLog.objects.create(
                merchant=request.user.merchant,
                user=request.user,
                action_type="API_KEY_REVOKED",
                details=f"Revoked API key: {key.name}",
                ip_address=get_client_ip(request)
            )
            return Response({"detail": "API key revoked."}, status=status.HTTP_204_NO_CONTENT)
        except MerchantAPIKey.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)


class StaffMemberListView(generics.ListAPIView):
    """GET /api/settings/staff/"""
    permission_classes = [IsAuthenticated]
    serializer_class = StaffMemberSerializer

    def get_queryset(self):
        return StaffMember.objects.filter(merchant=self.request.user.merchant).select_related("user")


class InviteStaffView(APIView):
    """POST /api/settings/staff/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InviteStaffSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if User.objects.filter(email=data["email"]).exists():
            return Response({"detail": "User with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        # Create user
        user = User.objects.create_user(
            email=data["email"],
            first_name=data["first_name"],
            last_name=data["last_name"],
            mobile=data["mobile"],
            is_verified=True,
            password=User.objects.make_random_password()
        )

        # Create staff profile
        staff = StaffMember.objects.create(
            user=user,
            merchant=request.user.merchant,
            role=data["role"],
            permissions=data.get("permissions", {})
        )

        AuditLog.objects.create(
            merchant=request.user.merchant,
            user=request.user,
            action_type="STAFF_INVITED",
            details=f"Invited staff: {data['email']} with role {data['role']}",
            ip_address=get_client_ip(request)
        )

        # In real app: Send invite email here with password reset link

        return Response(StaffMemberSerializer(staff).data, status=status.HTTP_201_CREATED)


class StaffMemberDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/settings/staff/<id>/"""
    permission_classes = [IsAuthenticated]
    serializer_class = StaffMemberSerializer

    def get_queryset(self):
        return StaffMember.objects.filter(merchant=self.request.user.merchant)


class AuditLogListView(generics.ListAPIView):
    """GET /api/settings/audit-logs/"""
    permission_classes = [IsAuthenticated]
    serializer_class = AuditLogSerializer

    def get_queryset(self):
        return AuditLog.objects.filter(merchant=self.request.user.merchant)
