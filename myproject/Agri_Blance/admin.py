from django.contrib import admin

# Register your models here.
from django.contrib import admin

from .models import GovernmentScheme


@admin.register(GovernmentScheme)
class GovernmentSchemeAdmin(admin.ModelAdmin):
    list_display = ("name", "state", "is_verified", "deadline", "updated_at")
    list_filter = ("state", "is_verified")
    search_fields = ("name", "department", "description")
