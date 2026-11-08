from django.contrib import admin

from .models import ChatMessage, ChatRoom, Route, RouteInvite, RouteStop


class RouteStopInline(admin.TabularInline):
    model = RouteStop
    extra = 1


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ("name", "created_by", "created_at")
    search_fields = ("name",)
    inlines = [RouteStopInline]


@admin.register(RouteInvite)
class RouteInviteAdmin(admin.ModelAdmin):
    list_display = ("route", "invitee", "status", "invited_at")


@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ("id", "route")


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ("room", "sender", "sent_at")
    search_fields = ("body",)
