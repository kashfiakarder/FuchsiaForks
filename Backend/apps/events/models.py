from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q


User = settings.AUTH_USER_MODEL


class Event(models.Model):
    """Happens at a Spot OR along a Route (exactly one)."""

    spot = models.ForeignKey(
        "spots.Spot",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="events",
    )
    route = models.ForeignKey(
        "routes.Route",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="events",
    )
    host = models.ForeignKey(User, on_delete=models.CASCADE, related_name="hosted_events")
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    start_time = models.DateTimeField()
    invitees = models.ManyToManyField(
        User,
        through="Invitation",
        through_fields=("event", "invitee"),
        related_name="events",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["start_time"]
        constraints = [
            models.CheckConstraint(
                condition=(
                    (Q(spot__isnull=False) & Q(route__isnull=True))
                    | (Q(spot__isnull=True) & Q(route__isnull=False))
                ),
                name="event_has_exactly_one_of_spot_or_route",
            )
        ]

    def clean(self):
        has_spot = self.spot_id is not None
        has_route = self.route_id is not None
        if has_spot == has_route:
            raise ValidationError("Event must have exactly one of spot or route.")

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} @ {self.start_time:%Y-%m-%d %H:%M}"

    @property
    def attendees(self):
        return self.invitations.filter(
            status__in=[Invitation.Status.ACCEPTED, Invitation.Status.COMPLETED]
        ).select_related("invitee")


class Invitation(models.Model):
    """
    An invite to an event. Replaces a separate attendance table:
    status ACCEPTED = attending. Each invitation must end with a photo post
    before it can be marked COMPLETED.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        DECLINED = "declined", "Declined"
        COMPLETED = "completed", "Completed (photo posted)"

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="invitations")
    invitee = models.ForeignKey(User, on_delete=models.CASCADE, related_name="invitations")
    invited_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="sent_invitations"
    )
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )
    invited_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["event", "invitee"], name="one_invitation_per_user_per_event"
            )
        ]

    def __str__(self):
        return f"{self.invitee} -> {self.event} [{self.status}]"

    @property
    def photo_submitted(self):
        return hasattr(self, "photo")

    def complete(self):
        if not self.photo_submitted:
            raise ValidationError("A photo is required to complete this invitation.")
        self.status = self.Status.COMPLETED
        self.save(update_fields=["status"])


class EventPhoto(models.Model):
    """
    The photo owed for an invitation (exactly one per invitation).
    Shows up in the uploader's profile art gallery.
    """

    invitation = models.OneToOneField(
        Invitation, on_delete=models.CASCADE, related_name="photo"
    )
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="photos")
    uploaded_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="event_photos"
    )
    image = models.ImageField(upload_to="event_photos/")
    caption = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.invitation_id and (
            self.invitation.invitee_id != self.uploaded_by_id
            or self.invitation.event_id != self.event_id
        ):
            raise ValidationError(
                "Photo must be uploaded by the invitee for the invited event."
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)
