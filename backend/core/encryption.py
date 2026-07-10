import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken
from decouple import config
from django.conf import settings


def _get_fernet() -> Fernet:
    """
    Build the Fernet cipher used to encrypt sensitive fields (courier/channel
    credentials) before they hit the DB.

    Prefers an explicit FIELD_ENCRYPTION_KEY (a urlsafe-base64 32-byte key,
    generate with Fernet.generate_key()). Falls back to a key derived from
    SECRET_KEY so local dev works without extra setup — production should
    set FIELD_ENCRYPTION_KEY explicitly so rotating SECRET_KEY doesn't also
    break decryption of stored credentials.
    """
    explicit_key = config("FIELD_ENCRYPTION_KEY", default=None)
    if explicit_key:
        return Fernet(explicit_key.encode())

    derived = base64.urlsafe_b64encode(
        hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    )
    return Fernet(derived)


def encrypt_value(plain: str) -> str:
    if not plain:
        return plain
    return _get_fernet().encrypt(plain.encode()).decode()


def decrypt_value(token: str) -> str:
    if not token:
        return token
    try:
        return _get_fernet().decrypt(token.encode()).decode()
    except InvalidToken:
        return ""


def mask_value(plain: str, visible: int = 4) -> str:
    if not plain:
        return ""
    if len(plain) <= visible:
        return "*" * len(plain)
    return "*" * (len(plain) - visible) + plain[-visible:]
