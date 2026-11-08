from django.contrib import admin

from .models import Event, EventPhoto, Invitation


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "host", "spot", "route", "start_time")
    list_filter = ("start_time",)
    search_fields = ("title",)


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ("event", "invitee", "status", "invited_at")
    list_filter = ("status",)


@admin.register(EventPhoto)
class EventPhotoAdmin(admin.ModelAdmin):
    list_display = ("event", "uploaded_by", "created_at")
