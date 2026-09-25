from django.contrib import admin

# Register your models here.
from django.contrib import admin

from .models import FarmerProfile


@admin.register(FarmerProfile)
class FarmerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "state", "district", "farmer_category", "updated_at")
