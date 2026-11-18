from django.db.models import Q
from rest_framework import exceptions, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Listing, Order, PriceUpdate, Species
from .serializers import ListingSerializer, OrderSerializer, PriceSerializer, SpeciesSerializer


class IsFisherman(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role == "FISHERMAN"


class SpeciesViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Species.objects.all()
    serializer_class = SpeciesSerializer
    pagination_class = None


class PriceViewSet(viewsets.ModelViewSet):
    serializer_class = PriceSerializer
    permission_classes = [IsFisherman]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        qs = PriceUpdate.objects.select_related("harbor", "species")
        if h := self.request.query_params.get("harbor"):
            qs = qs.filter(harbor_id=h)
        return qs

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)


class ListingViewSet(viewsets.ModelViewSet):
    serializer_class = ListingSerializer
    permission_classes = [IsFisherman]

    def get_queryset(self):
        qs = Listing.objects.select_related("harbor", "species", "seller")
        p = self.request.query_params
        if p.get("harbor"):
            qs = qs.filter(harbor_id=p["harbor"])
        if p.get("species"):
            qs = qs.filter(species_id=p["species"])
        if p.get("mine") and self.request.user.is_authenticated:
            return qs.filter(seller=self.request.user)
        if self.action == "list":
            qs = qs.filter(status="OPEN")
        return qs

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.seller != self.request.user:
            raise exceptions.PermissionDenied("Not your listing.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.seller != self.request.user:
            raise exceptions.PermissionDenied("Not your listing.")
        instance.delete()


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        u = self.request.user
        return Order.objects.filter(Q(buyer=u) | Q(listing__seller=u)).select_related("listing", "buyer")

    def perform_create(self, serializer):
        u = self.request.user
        # fall back to the address saved on the buyer's profile
        serializer.save(buyer=u, delivery_address=serializer.validated_data.get("delivery_address") or u.address)

    @action(detail=True, methods=["post"])
    def respond(self, request, pk=None):
        order = self.get_object()
        if order.listing.seller != request.user:
            return Response({"detail": "Only the seller can respond."}, status=403)
        accept = request.data.get("accept") is True
        order.status = Order.Status.ACCEPTED if accept else Order.Status.REJECTED
        order.save()
        if accept:
            order.listing.status = Listing.Status.SOLD
            order.listing.save()
        return Response(OrderSerializer(order).data)
