from rest_framework.exceptions import PermissionDenied


def get_merchant(request):
    """
    Safely resolve the Merchant linked to the current user.

    request.user.merchant is a reverse OneToOneField accessor: Django raises
    RelatedObjectDoesNotExist (itself a subclass of AttributeError) when the
    link is missing, so getattr(..., None) resolves it to None instead of a
    500. Any authenticated user without a merchant (e.g. an internal staff
    account or superuser) gets a clean 403 instead of an unhandled crash.
    """
    merchant = getattr(request.user, "merchant", None)
    if merchant is None:
        raise PermissionDenied("This account is not linked to a merchant.")
    return merchant
