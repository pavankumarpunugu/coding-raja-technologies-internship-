from decimal import Decimal
from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Product, CartItem, Order, OrderItem
from .serializers import RegisterSerializer, ProductSerializer, CartItemSerializer, OrderSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsAdminUser()]

    def get_queryset(self):
        queryset = Product.objects.all()
        search = self.request.query_params.get("search", "").strip()
        category = self.request.query_params.get("category", "").strip()

        if search:
            queryset = queryset.filter(name__icontains=search)

        if category:
            queryset = queryset.filter(category__iexact=category)

        return queryset

@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    refresh = RefreshToken.for_user(user)

    return Response({
        "user": {"username": user.username, "email": user.email},
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }, status=status.HTTP_201_CREATED)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile(request):
    return Response({
        "username": request.user.username,
        "email": request.user.email,
    })

@api_view(["GET", "POST", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def cart(request, item_id=None):
    if request.method == "GET":
        # select_related avoids an additional product query per cart item.
        items = CartItem.objects.filter(user=request.user).select_related("product")
        return Response(CartItemSerializer(items, many=True).data)

    if request.method == "POST":
        product_id = request.data.get("product_id")
        quantity = request.data.get("quantity", 1)

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return Response({"detail": "Quantity must be a valid number."}, status=400)

        if quantity < 1:
            return Response({"detail": "Quantity must be at least 1."}, status=400)

        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            return Response({"detail": "Product not found."}, status=404)

        if quantity > product.stock:
            return Response({"detail": "Insufficient stock."}, status=400)

        item, _ = CartItem.objects.get_or_create(
            user=request.user,
            product=product
        )
        item.quantity = quantity
        item.save()

        return Response(CartItemSerializer(item).data, status=201)

    if not item_id:
        return Response({"detail": "item_id is required."}, status=400)

    try:
        item = CartItem.objects.get(pk=item_id, user=request.user)
    except CartItem.DoesNotExist:
        return Response({"detail": "Cart item not found."}, status=404)

    if request.method == "PATCH":
        try:
            quantity = int(request.data.get("quantity", item.quantity))
        except (TypeError, ValueError):
            return Response({"detail": "Quantity must be a valid number."}, status=400)

        if quantity < 1 or quantity > item.product.stock:
            return Response({"detail": "Invalid quantity."}, status=400)

        item.quantity = quantity
        item.save()
        return Response(CartItemSerializer(item).data)

    item.delete()
    return Response(status=204)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def checkout(request):
    items = list(
        CartItem.objects.filter(user=request.user)
        .select_related("product")
    )

    if not items:
        return Response({"detail": "Cart is empty."}, status=400)

    with transaction.atomic():
        total = Decimal("0.00")

        for item in items:
            if item.quantity > item.product.stock:
                return Response(
                    {"detail": f"Insufficient stock for {item.product.name}."},
                    status=400
                )
            total += item.product.price * item.quantity

        order = Order.objects.create(
            user=request.user,
            total_amount=total
        )

        for item in items:
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                price_at_purchase=item.product.price,
            )
            item.product.stock -= item.quantity
            item.product.save(update_fields=["stock"])

        CartItem.objects.filter(user=request.user).delete()

    return Response(OrderSerializer(order).data, status=201)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def orders(request):
    # prefetch_related reduces repeated queries while loading order products.
    qs = (
        Order.objects.filter(user=request.user)
        .prefetch_related("items__product")
    )
    return Response(OrderSerializer(qs, many=True).data)
