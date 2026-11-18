from rest_framework import serializers
from .models import Harbor, User


class HarborSerializer(serializers.ModelSerializer):
    class Meta:
        model = Harbor
        fields = ["id", "name", "latitude", "longitude"]


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["id", "username", "password", "first_name", "role", "phone", "town", "address", "harbor"]

    def create(self, data):
        return User.objects.create_user(**data)


class ProfileSerializer(serializers.ModelSerializer):
    """Used by /auth/me/ so people can update their own contact details."""
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "role", "phone", "town", "address", "harbor"]
        read_only_fields = ["username", "role"]
