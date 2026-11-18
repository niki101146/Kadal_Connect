from django.urls import path
from . import views

urlpatterns = [path("weather/", views.weather), path("weather/compute/", views.weather_compute), path("alerts/", views.alert_list)]