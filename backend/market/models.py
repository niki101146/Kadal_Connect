from django.conf import settings
from django.db import models


class Species(models.Model):
    name = models.CharField(max_length=60, unique=True)
    name_ta = models.CharField("Tamil name", max_length=60, blank=True)
    category = models.CharField(max_length=40, blank=True)

    class Meta:
        verbose_name_plural = "species"
        ordering = ["category", "name"]

    def __str__(self):
        return self.name


class PriceUpdate(models.Model):
    harbor = models.ForeignKey("accounts.Harbor", on_delete=models.CASCADE)
    species = models.ForeignKey(Species, on_delete=models.CASCADE)
    price_per_kg = models.DecimalField(max_digits=8, decimal_places=2)
    reported_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class Listing(models.Model):
    class Status(models.TextChoices):
        OPEN = "OPEN"
        SOLD = "SOLD"

    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="listings")
    harbor = models.ForeignKey("accounts.Harbor", on_delete=models.CASCADE)
    species = models.ForeignKey(Species, on_delete=models.CASCADE)
    quantity_kg = models.DecimalField(max_digits=8, decimal_places=2)
    price_per_kg = models.DecimalField(max_digits=8, decimal_places=2)
    caught_on = models.DateField()
    status = models.CharField(max_length=4, choices=Status.choices, default=Status.OPEN)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING"
        ACCEPTED = "ACCEPTED"
        REJECTED = "REJECTED"

    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="orders")
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders")
    quantity_kg = models.DecimalField(max_digits=8, decimal_places=2)
    # where the buyer wants the fish delivered / picked up, plus an optional message to the seller
    delivery_address = models.CharField(max_length=255, blank=True)
    note = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=8, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
