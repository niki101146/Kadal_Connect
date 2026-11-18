from rest_framework import generics, permissions
from .models import Harbor
from .serializers import HarborSerializer, ProfileSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class HarborList(generics.ListAPIView):
    queryset = Harbor.objects.all()
    serializer_class = HarborSerializer
    pagination_class = None
