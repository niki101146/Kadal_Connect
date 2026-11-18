from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("species", views.SpeciesViewSet, basename="species")
router.register("prices", views.PriceViewSet, basename="prices")
router.register("listings", views.ListingViewSet, basename="listings")
router.register("orders", views.OrderViewSet, basename="orders")
urlpatterns = router.urls
