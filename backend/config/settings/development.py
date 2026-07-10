from .base import *

DEBUG = True

ALLOWED_HOSTS = [
    "127.0.0.1",
    "localhost",
]

# Allow CORS in development
CORS_ALLOW_ALL_ORIGINS = True

# Email backend – print to console in development
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"