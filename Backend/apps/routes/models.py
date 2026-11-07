from django.conf import settings
from django.db import models
from django.utils import timezone


User = settings.AUTH_USER_MODEL


class Route(models.Model):
    """An ordered sequence of Spots (stop 1 -> stop 2 -> stop 3...)."""

    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    spots = models.ManyToManyField(
        "spots.Spot", through="RouteStop", related_name="routes"
    )
    created_by = models.ForeignKey(
        User, null=True, on_delete=models.SET_NULL, related_name="routes"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    @property
    def ordered_stops(self):
        return self.stops.select_related("spot").order_by("order")

    @property
    def number_of_people(self):
        from apps.events.models import Invitation

        return (
            Invitation.objects.filter(
                event__route=self,
                event__start_time__gte=timezone.now(),
                status=Invitation.Status.ACCEPTED,
            )
            .values("invitee")
            .distinct()
            .count()
        )


class RouteStop(models.Model):
    """One step in a route. `order` is 1, 2, 3... along the route."""

    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name="stops")
    spot = models.ForeignKey(
        "spots.Spot", on_delete=models.CASCADE, related_name="route_stops"
    )
    order = models.PositiveSmallIntegerField()

    class Meta:
        ordering = ["order"]
        constraints = [
            models.UniqueConstraint(
                fields=["route", "order"], name="unique_stop_order_per_route"
            )
        ]

    def __str__(self):
        return f"{self.route} #{self.order}: {self.spot}"


class ChatRoom(models.Model):
    """The 'People Chat Room' on a route."""

    route = models.OneToOneField(Route, on_delete=models.CASCADE, related_name="chat_room")

    def __str__(self):
        return f"Chat: {self.route}"


class ChatMessage(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="chat_messages")
    body = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sent_at"]
