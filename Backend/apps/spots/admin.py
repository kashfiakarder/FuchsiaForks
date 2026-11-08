from django.contrib import admin

from .models import Review, Spot


@admin.register(Spot)
class SpotAdmin(admin.ModelAdmin):
    list_display = ("name", "latitude", "longitude", "created_by", "created_at")
    search_fields = ("name",)


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("spot", "author", "stars", "created_at")
    list_filter = ("stars",)
