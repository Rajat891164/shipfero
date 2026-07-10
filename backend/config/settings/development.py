from .base import *

DEBUG = True

ALLOWED_HOSTS = [
    "127.0.0.1",
    "localhost",
]

# CORS — allow the Vite dev server (5173) to call the API in development
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CORS_ALLOW_CREDENTIALS = True

# Email backend – print to console in development
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"