from rest_framework.routers import DefaultRouter

from .views import CarrierViewSet

router = DefaultRouter()
router.register("", CarrierViewSet, basename="carrier")

urlpatterns = router.urls