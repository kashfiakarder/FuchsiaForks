from django.contrib import admin

from .models import Review, Spot


@admin.register(Spot)
class SpotAdmin(admin.ModelAdmin):
    list_display = ("name", "city", "region", "scene", "latitude", "longitude", "created_by", "created_at")
    list_filter = ("region", "scene")
    search_fields = ("name", "city", "address")


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("spot", "author", "stars", "created_at")
    list_filter = ("stars",)
