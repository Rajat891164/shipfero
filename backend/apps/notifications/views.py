from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    """GET /api/notifications/ – List notifications for the logged-in user"""
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        qs = self.request.user.notifications.all()
        # Filter by read/unread
        is_read = self.request.query_params.get("is_read")
        if is_read is not None:
            qs = qs.filter(is_read=is_read.lower() in ["true", "1", "yes"])
        # Filter by type
        ntype = self.request.query_params.get("type")
        if ntype:
            qs = qs.filter(notification_type=ntype.upper())
        return qs


class NotificationDetailView(generics.RetrieveAPIView):
    """GET /api/notifications/<pk>/ – Get a single notification"""
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return self.request.user.notifications.all()


class MarkNotificationReadView(APIView):
    """POST /api/notifications/<pk>/read/ – Mark a single notification as read"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            notification = request.user.notifications.get(pk=pk)
        except Notification.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if not notification.is_read:
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save(update_fields=["is_read", "read_at"])

        return Response(NotificationSerializer(notification).data)


class MarkAllReadView(APIView):
    """POST /api/notifications/mark-all-read/ – Mark all notifications as read"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated = request.user.notifications.filter(is_read=False).update(
            is_read=True,
            read_at=timezone.now(),
        )
        return Response({"detail": f"{updated} notifications marked as read."})


class UnreadCountView(APIView):
    """GET /api/notifications/unread-count/ – Get count of unread notifications"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = request.user.notifications.filter(is_read=False).count()
        return Response({"unread_count": count})
