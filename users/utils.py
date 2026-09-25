from django.core.mail import send_mail
from django.conf import settings


def send_otp_email(email, otp):
    subject = "Your ChatGPT Replica Verification Code"

    message = f"""
Hello,

Your email verification code is:

{otp}

This code will expire in 5 minutes.

If you did not create an account, you can ignore this email.

Regards,
ChatGPT Replica
"""

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )
