from datetime import timedelta
import random

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import EmailOTP
from .utils import send_otp_email

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    class Meta:
        model = User
        fields = ["email", "password"]

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
        )

        return user


class SendVerificationOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate(self, data):
        email = data["email"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "If an account exists with this email, a verification code will be sent."
            )

        if user.is_verified:
            raise serializers.ValidationError(
                "This email is already verified."
            )

        data["user"] = user

        return data


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(
        min_length=6,
        max_length=6,
    )

    def validate(self, data):
        email = data["email"]
        otp = data["otp"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Invalid verification details."
            )

        if user.is_verified:
            raise serializers.ValidationError(
                "Email is already verified."
            )

        try:
            otp_record = EmailOTP.objects.filter(
                user=user,
                is_used=False,
            ).latest("created_at")
        except EmailOTP.DoesNotExist:
            raise serializers.ValidationError(
                "No valid OTP found."
            )

        if otp_record.otp != otp:
            raise serializers.ValidationError(
                "Invalid OTP."
            )

        expiry_time = (
            otp_record.created_at
            + timedelta(minutes=5)
        )

        if timezone.now() > expiry_time:
            raise serializers.ValidationError(
                "OTP has expired."
            )

        data["user"] = user
        data["otp_record"] = otp_record

        return data


class LoginSerializer(TokenObtainPairSerializer):

    def validate(self, attrs):
        data = super().validate(attrs)

        if not self.user.is_verified:
            raise serializers.ValidationError(
                "Please verify your email before logging in."
            )

        return data