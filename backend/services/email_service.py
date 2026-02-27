import os
from flask import current_app
from flask_mail import Mail, Message

mail = Mail()

# backend/services/email_service.py → backend/
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

# backend/emails/
EMAIL_DIR = os.path.join(BASE_DIR, "emails")


def load_template(template_path: str, **kwargs) -> str:
    """
    Load an HTML email template and replace {{variable}} placeholders.
    Example:
        {{name}}, {{OTP_CODE}}
    """
    file_path = os.path.join(EMAIL_DIR, template_path)

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Email template not found: {file_path}")

    with open(file_path, "r", encoding="utf-8") as file:
        html = file.read()

    # Replace placeholders
    for key, value in kwargs.items():
        html = html.replace(f"{{{{{key}}}}}", str(value))

    return html


def send_email(
    to: str,
    subject: str,
    template_path: str,
    **kwargs
) -> None:
    """
    Low-level helper — load a template and send via Flask-Mail.
    Must be called within a Flask application context.
    """
    html_content = load_template(template_path, **kwargs)

    msg = Message(
        subject=subject,
        recipients=[to],
        html=html_content,
        sender=current_app.config.get("MAIL_DEFAULT_SENDER")
    )

    mail.send(msg)


# ──────────────────────────────────────────────────────────────
#  Named helpers — one per email template
#  All must be called within a Flask application/request context.
# ──────────────────────────────────────────────────────────────

def send_welcome_email(to: str, name: str) -> None:
    """
    Send a welcome email after successful user signup.

    Template : emails/welcome.html
    Subject  : 🌾 Welcome to AgriGPT – Your Smart Farming Assistant!
    """
    send_email(
        to=to,
        subject="🌾 Welcome to AgriGPT – Your Smart Farming Assistant!",
        template_path="welcome.html",
        name=name
    )


def send_account_deleted_email(to: str, name: str) -> None:
    """
    Send a goodbye email after the user deletes their account.

    Template : emails/account_deleted.html
    Subject  : We're Sorry to See You Go 🌾 | AgriGPT
    """
    send_email(
        to=to,
        subject="We're Sorry to See You Go 🌾 | AgriGPT",
        template_path="account_deleted.html",
        name=name
    )


def send_otp_verification_email(to: str, otp_code: str) -> None:
    """
    Send an OTP verification email (signup / password-reset / login).

    Template : emails/otp.html
    Subject  : 🔐 Your AgriGPT OTP Code
    """
    send_email(
        to=to,
        subject="🔐 Your AgriGPT OTP Code",
        template_path="otp.html",
        OTP_CODE=otp_code
    )


def send_password_changed_email(to: str, name: str) -> None:
    """
    Send a confirmation email after a successful password change.

    Template : emails/password_changed.html
    Subject  : 🔒 Your AgriGPT Password Was Changed Successfully
    """
    send_email(
        to=to,
        subject="🔒 Your AgriGPT Password Was Changed Successfully",
        template_path="password_changed.html",
        name=name
    )
