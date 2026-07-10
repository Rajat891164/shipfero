from django.urls import path
from .settings_views import (
    APIKeyListCreateView,
    APIKeyRevokeView,
    StaffMemberListView,
    InviteStaffView,
    StaffMemberDetailView,
    AuditLogListView,
)

urlpatterns = [
    path("api-keys/", APIKeyListCreateView.as_view(), name="settings-api-keys"),
    path("api-keys/<int:pk>/", APIKeyRevokeView.as_view(), name="settings-api-keys-revoke"),
    
    path("staff/", StaffMemberListView.as_view(), name="settings-staff-list"),
    path("staff/invite/", InviteStaffView.as_view(), name="settings-staff-invite"),
    path("staff/<int:pk>/", StaffMemberDetailView.as_view(), name="settings-staff-detail"),
    
    path("audit-logs/", AuditLogListView.as_view(), name="settings-audit-logs"),
]
