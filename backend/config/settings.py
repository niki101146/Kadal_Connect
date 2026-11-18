import os
from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-key")
DEBUG = os.environ.get("DEBUG", "True") == "True"
ALLOWED_HOSTS = [h.strip() for h in os.environ.get("ALLOWED_HOSTS", "*").split(",") if h.strip()]

INSTALLED_APPS = [
    "django.contrib.admin", "django.contrib.auth", "django.contrib.contenttypes",
    "django.contrib.sessions", "django.contrib.messages", "django.contrib.staticfiles",
    "rest_framework", "corsheaders",
    "accounts", "market", "alerts",
]
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # serves /admin static files on Render
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
]
ROOT_URLCONF = "config.urls"
TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates", "DIRS": [], "APP_DIRS": True,
    "OPTIONS": {"context_processors": [
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages"]},
}]
WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {"default": {
    "ENGINE": "django.db.backends.postgresql",
    "NAME": os.environ.get("DB_NAME", "kadal"),
    "USER": os.environ.get("DB_USER", "postgres"),
    "PASSWORD": os.environ.get("DB_PASSWORD", "postgres"),
    "HOST": os.environ.get("DB_HOST", "localhost"),
    "PORT": os.environ.get("DB_PORT", "5432"),
    # Neon (and any hosted Postgres) requires SSL; local Postgres does not
    "OPTIONS": {"sslmode": os.environ.get("DB_SSLMODE", "disable" if os.environ.get("DB_HOST", "localhost") in ("localhost", "127.0.0.1") else "require")},
}}

AUTH_USER_MODEL = "accounts.User"
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_TZ = True
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOW_ALL_ORIGINS = DEBUG
# production: the frontend address(es), comma separated, e.g. https://kadal-connect.onrender.com
CORS_ALLOWED_ORIGINS = [o.strip().rstrip("/") for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]
CSRF_TRUSTED_ORIGINS = [o for o in CORS_ALLOWED_ORIGINS if o.startswith("https://")]
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["rest_framework_simplejwt.authentication.JWTAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticatedOrReadOnly"],
}
SIMPLE_JWT = {"ACCESS_TOKEN_LIFETIME": timedelta(days=1)}
