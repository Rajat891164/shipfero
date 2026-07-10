from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """Only allow Django staff/admin users to access admin panel endpoints."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or request.user.is_superuser)
        )
