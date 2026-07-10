from django.contrib.auth import get_user_model
from rest_framework import serializers
from django.utils import timezone
from apps.merchants.models import Merchant
from .models import EmailOTP

User = get_user_model()


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["email", "first_name", "last_name", "mobile", "password"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(**validated_data, password=password)

        Merchant.objects.create(
            user=user,
            company_name=validated_data.get("first_name"),
            business_email=user.email,
            phone=validated_data.get("mobile", ""),
        )

        EmailOTP.create_otp_for_user(user)
        return user


class SendEmailOTPSerializer(serializers.Serializer):
    """Generate OTP for the current logged-in user."""

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")

        # 60-second cooldown
        last_otp = (
            EmailOTP.objects.filter(user=user)
            .order_by("-created_at")
            .first()
        )
        if last_otp:
            delta = timezone.now() - last_otp.created_at
            if delta.total_seconds() < 60:
                raise serializers.ValidationError(
                    "Please wait before requesting a new OTP."
                )

        return attrs

    def create(self, validated_data):
        import random

        user = self.context["request"].user
        code = f"{random.randint(100000, 999999)}"

        otp = EmailOTP.objects.create(
            user=user,
            code=code,
            expires_at=timezone.now() + timezone.timedelta(minutes=15),
        )

        # In dev, print to console; in prod, send via email
        print(f"[EmailOTP] User={user.email}, OTP={code}")

        return otp


class VerifyEmailOTPSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")

        code = attrs["code"]

        otp_qs = EmailOTP.objects.filter(
            user=user,
            is_used=False,
        ).order_by("-created_at")

        otp = otp_qs.first()
        if not otp:
            raise serializers.ValidationError("No active OTP found.")

        now = timezone.now()
        if otp.expires_at < now:
            raise serializers.ValidationError("OTP has expired.")

        if otp.code != code:
            raise serializers.ValidationError("Invalid OTP.")

        attrs["otp"] = otp
        return attrs

    def create(self, validated_data):
        user = self.context["request"].user
        otp = validated_data["otp"]

        otp.is_used = True
        otp.save(update_fields=["is_used"])

        try:
            merchant = Merchant.objects.get(user=user)
        except Merchant.DoesNotExist:
            raise serializers.ValidationError("Merchant not found for this user.")

        merchant.email_verified = True
        merchant.onboarding_step = 3  # next: Business Profile
        merchant.save(update_fields=["email_verified", "onboarding_step"])

        return merchant