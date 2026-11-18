from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView
from . import views

urlpatterns = [
    path("register/", views.RegisterView.as_view()),
    path("token/", TokenObtainPairView.as_view()),
    path("me/", views.MeView.as_view()),
    path("harbors/", views.HarborList.as_view()),
]
