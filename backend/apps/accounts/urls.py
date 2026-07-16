from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import SignupView, SendEmailOTPView, VerifyEmailOTPView, CheckEmailView

urlpatterns = [
    path("signup/", SignupView.as_view(), name="signup"),
    path("check-email/", CheckEmailView.as_view(), name="check-email"),
    path("send-email-otp/", SendEmailOTPView.as_view(), name="send-email-otp"),
    path("verify-email-otp/", VerifyEmailOTPView.as_view(), name="verify-email-otp"),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]