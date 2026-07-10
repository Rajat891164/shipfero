from .base import *

DEBUG = True

ALLOWED_HOSTS = [
    "127.0.0.1",
    "localhost",
]

# CORS — allow the Vite dev server to call the API in development.
# vite.config.js sets server.port = 3000; 5173 is Vite's default fallback.
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CORS_ALLOW_CREDENTIALS = True

# Email backend – print to console in development
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"