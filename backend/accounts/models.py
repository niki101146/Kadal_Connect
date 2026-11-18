from django.contrib.auth.models import AbstractUser
from django.db import models


class Harbor(models.Model):
    name = models.CharField(max_length=80, unique=True)
    latitude = models.FloatField()
    longitude = models.FloatField()

    def __str__(self):
        return self.name


class User(AbstractUser):
    class Role(models.TextChoices):
        FISHERMAN = "FISHERMAN", "Fisherman"
        BUYER = "BUYER", "Buyer"

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.BUYER)
    phone = models.CharField(max_length=15, blank=True)
    town = models.CharField("Town / village", max_length=60, blank=True)
    address = models.CharField("Full address", max_length=255, blank=True)
    harbor = models.ForeignKey(Harbor, null=True, blank=True, on_delete=models.SET_NULL)
