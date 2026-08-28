from rest_framework.exceptions import ValidationError

from .models import MerchantCourier


def select_merchant_courier(merchant, carrier):
    """Select the active merchant/carrier profile used for booking.

    One profile: use it automatically.
    Multiple profiles: use the one marked is_default=True.
    Multiple profiles with no default: fail with a clear UI-facing message.
    """
    qs = MerchantCourier.objects.filter(
        merchant=merchant,
        carrier=carrier,
        status=MerchantCourier.Status.ACTIVE,
    ).order_by("-is_default", "-updated_at", "-id")

    profiles = list(qs[:2])

    if not profiles:
        raise MerchantCourier.DoesNotExist

    if len(profiles) == 1:
        return profiles[0]

    default = next((profile for profile in profiles if profile.is_default), None)
    if default:
        return default

    raise ValidationError(
        "Multiple profiles are configured for this carrier. "
        "Please set one profile as default in Courier Settings before booking."
    )
