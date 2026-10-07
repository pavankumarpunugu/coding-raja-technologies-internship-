from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, register, profile, cart, checkout, orders

router = DefaultRouter()
router.register("products", ProductViewSet, basename="product")

urlpatterns = [
    path("", include(router.urls)),
    path("auth/register/", register),
    path("auth/profile/", profile),
    path("cart/", cart),
    path("cart/<int:item_id>/", cart),
    path("checkout/", checkout),
    path("orders/", orders),
]
