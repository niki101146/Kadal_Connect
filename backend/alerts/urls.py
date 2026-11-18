from django.urls import path
from . import views

urlpatterns = [path("weather/", views.weather), path("alerts/", views.alert_list)]
