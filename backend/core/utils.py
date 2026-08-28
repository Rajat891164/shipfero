from rest_framework.exceptions import PermissionDenied


def get_merchant(request):
    print("USER:", request.user)
    print("USER ID:", request.user.id)
    print("AUTH:", request.user.is_authenticated)
    print("HAS MERCHANT:", hasattr(request.user, "merchant"))

    merchant = getattr(request.user, "merchant", None)

    if merchant is None:
        raise PermissionDenied("This account is not linked to a merchant.")

    return merchant