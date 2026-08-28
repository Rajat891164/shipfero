from rest_framework import viewsets
from rest_framework.permissions import AllowAny   # or IsAuthenticated

from .models import Carrier
from .serializers import CarrierSerializer


class CarrierViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CarrierSerializer
    permission_classes = [AllowAny]   # change back to IsAuthenticated later

    def get_queryset(self):
        return Carrier.objects.filter(
            status="ACTIVE"
        ).order_by("priority", "name")