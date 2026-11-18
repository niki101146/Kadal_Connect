from django.contrib import admin
from .models import Listing, Order, PriceUpdate, Species

for m in (Species, PriceUpdate, Listing, Order):
    admin.site.register(m)
