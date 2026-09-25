from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    LoginSerializer,
    RegisterSerializer,
    SendVerificationOTPSerializer,
    VerifyOTPSerializer,
)
from .models import EmailOTP
from .utils import send_otp_email
import random


class RegisterView(APIView):

    def post(self, request):
        serializer = RegisterSerializer(
            data=request.data
        )

        if serializer.is_valid():
            serializer.save()

            return Response(
                {
                    "message": "Registration successful. Please verify your email."
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class SendVerificationOTPView(APIView):

    def post(self, request):
        serializer = SendVerificationOTPSerializer(
            data=request.data
        )

        if serializer.is_valid():
            user = serializer.validated_data["user"]

            otp = str(
                random.randint(100000, 999999)
            )

            EmailOTP.objects.filter(
                user=user,
                is_used=False,
            ).update(
                is_used=True
            )

            EmailOTP.objects.create(
                user=user,
                otp=otp,
            )

            send_otp_email(
                email=user.email,
                otp=otp,
            )

            return Response(
                {
                    "message": "If an account exists with this email, a verification code has been sent."
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class VerifyOTPView(APIView):

    def post(self, request):
        serializer = VerifyOTPSerializer(
            data=request.data
        )

        if serializer.is_valid():
            user = serializer.validated_data["user"]
            otp_record = serializer.validated_data[
                "otp_record"
            ]

            user.is_verified = True
            user.save(
                update_fields=["is_verified"]
            )

            otp_record.is_used = True
            otp_record.save(
                update_fields=["is_used"]
            )

            return Response(
                {
                    "message": "Email verified successfully."
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            {
                "email": request.user.email,
                "is_verified": request.user.is_verified,
            }
        )