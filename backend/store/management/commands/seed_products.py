from django.core.management.base import BaseCommand
from store.models import Product

PRODUCTS = [
    ("Wireless Headphones", "Audio", 2499, 20, "https://placehold.co/600x400?text=Headphones"),
    ("Mechanical Keyboard", "Accessories", 3499, 15, "https://placehold.co/600x400?text=Keyboard"),
    ("Smart Watch", "Wearables", 4999, 12, "https://placehold.co/600x400?text=Smart+Watch"),
    ("Laptop Backpack", "Bags", 1599, 30, "https://placehold.co/600x400?text=Backpack"),
    ("USB-C Hub", "Accessories", 1299, 25, "https://placehold.co/600x400?text=USB-C+Hub"),
    ("Bluetooth Speaker", "Audio", 1999, 18, "https://placehold.co/600x400?text=Speaker"),
]

class Command(BaseCommand):
    help = "Create sample products"

    def handle(self, *args, **kwargs):
        for name, category, price, stock, image_url in PRODUCTS:
            Product.objects.update_or_create(
                name=name,
                defaults={
                    "description": f"{name} from the ShopNest demo catalog.",
                    "category": category,
                    "price": price,
                    "stock": stock,
                    "image_url": image_url,
                },
            )
        self.stdout.write(self.style.SUCCESS("Sample products created."))
