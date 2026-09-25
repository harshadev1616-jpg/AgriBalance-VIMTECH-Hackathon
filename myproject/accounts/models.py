from django.db import models
from django.conf import settings


class FarmerProfile(models.Model):
    FARMER_CATEGORIES = [
        ("small", "Small farmer"),
        ("marginal", "Marginal farmer"),
        ("tenant", "Tenant farmer"),
        ("women", "Women farmer"),
        ("other", "Other"),
    ]
    IRRIGATION_TYPES = [
        ("rainfed", "Rainfed"),
        ("canal", "Canal"),
        ("borewell", "Borewell"),
        ("drip", "Drip"),
        ("sprinkler", "Sprinkler"),
        ("other", "Other"),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="farmer_profile")
    state = models.CharField(max_length=80, blank=True)
    district = models.CharField(max_length=80, blank=True)
    crops = models.JSONField(default=list, blank=True)
    land_size_hectares = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    farmer_category = models.CharField(max_length=20, choices=FARMER_CATEGORIES, blank=True)
    irrigation_type = models.CharField(max_length=20, choices=IRRIGATION_TYPES, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile for {self.user.username}"

# Create your models here.
