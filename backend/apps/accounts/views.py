from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from .serializers import SendEmailOTPSerializer, VerifyEmailOTPSerializer

from .serializers import(
    SignupSerializer,
    SendEmailOTPSerializer, 
    VerifyEmailOTPSerializer,
)


class SignupView(generics.CreateAPIView):
    serializer_class = SignupSerializer
    permission_classes = [AllowAny]



class SendEmailOTPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = SendEmailOTPSerializer(
            data={},
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        otp = serializer.save()

        return Response(
            {
                "status": True,
                "message": "OTP sent to your email (check console in dev).",
                "expires_at": otp.expires_at,
            },
            status=status.HTTP_200_OK,
        )



class VerifyEmailOTPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = VerifyEmailOTPSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        merchant = serializer.save()

        return Response(
            {
                "status": True,
                "message": "Email verified successfully.",
                "email_verified": merchant.email_verified,
                "onboarding_step": merchant.onboarding_step,
            },
            status=status.HTTP_200_OK,
        )