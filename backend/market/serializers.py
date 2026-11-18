from rest_framework import serializers
from .models import Listing, Order, PriceUpdate, Species


class SpeciesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Species
        fields = ["id", "name", "name_ta", "category"]


class PriceSerializer(serializers.ModelSerializer):
    harbor_name = serializers.CharField(source="harbor.name", read_only=True)
    species_name = serializers.CharField(source="species.name", read_only=True)

    class Meta:
        model = PriceUpdate
        fields = ["id", "harbor", "harbor_name", "species", "species_name", "price_per_kg", "created_at"]


class ListingSerializer(serializers.ModelSerializer):
    harbor_name = serializers.CharField(source="harbor.name", read_only=True)
    species_name = serializers.CharField(source="species.name", read_only=True)
    seller_name = serializers.CharField(source="seller.first_name", read_only=True)

    class Meta:
        model = Listing
        fields = ["id", "seller", "harbor", "harbor_name", "species", "species_name", "seller_name",
                  "quantity_kg", "price_per_kg", "caught_on", "status", "created_at"]
        read_only_fields = ["status", "seller"]


class OrderSerializer(serializers.ModelSerializer):
    listing_info = ListingSerializer(source="listing", read_only=True)
    buyer_name = serializers.CharField(source="buyer.first_name", read_only=True)
    buyer_town = serializers.CharField(source="buyer.town", read_only=True)
    seller_phone = serializers.SerializerMethodField()
    buyer_phone = serializers.SerializerMethodField()
    buyer_address = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ["id", "listing", "listing_info", "buyer_name", "buyer_town", "buyer_address", "seller_phone",
                  "buyer_phone", "delivery_address", "note", "quantity_kg", "status", "created_at"]
        read_only_fields = ["status"]
        extra_kwargs = {"delivery_address": {"required": False}, "note": {"required": False}}

    # The seller always sees who is asking (name, town, note). Phone number and the full
    # delivery address are shared only after the seller accepts the request.
    def get_seller_phone(self, o):
        return o.listing.seller.phone if o.status == Order.Status.ACCEPTED else ""

    def get_buyer_phone(self, o):
        return o.buyer.phone if o.status == Order.Status.ACCEPTED else ""

    def get_buyer_address(self, o):
        return (o.delivery_address or o.buyer.address) if o.status == Order.Status.ACCEPTED else ""

    def validate(self, data):
        listing = data["listing"]
        if listing.status != Listing.Status.OPEN:
            raise serializers.ValidationError("This catch is already sold.")
        if data["quantity_kg"] > listing.quantity_kg:
            raise serializers.ValidationError("Requested quantity is more than available.")
        return data
