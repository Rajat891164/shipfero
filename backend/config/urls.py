from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    # API Routes
    path("api/auth/", include("apps.accounts.urls")),
    path("api/settings/", include("apps.accounts.settings_urls")),
    path("api/merchants/", include("apps.merchants.urls")),
    path("api/orders/", include("apps.orders.urls")),
    path("api/shipments/", include("apps.shipments.urls")),
    path("api/tracking/", include("apps.tracking.urls")),
    path("api/ndr/", include("apps.ndr.urls")),
    path("api/returns/", include("apps.returns.urls")),
    path("api/carriers/", include("apps.carriers.urls")),
    path("api/couriers/", include("apps.couriers.urls")),
    path("api/integrations/", include("apps.integrations.urls")),
    path("api/pricing/", include("apps.pricing.urls")),
    path("api/reports/", include("apps.reports.urls")),
    path("api/billing/", include("apps.billing.urls")),
    path("api/notifications/", include("apps.notifications.urls")),
    path("api/admin/", include("apps.admin_panel.urls")),
]
