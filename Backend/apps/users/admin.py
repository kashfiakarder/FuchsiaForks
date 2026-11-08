from django.contrib import admin

from .models import Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "auth0_id", "city", "phone_number")
    search_fields = ("user__username", "auth0_id", "city")
