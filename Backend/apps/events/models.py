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
    slug = models.SlugField(max_length=80, unique=True, null=True, blank=True)
    start_local = models.CharField(max_length=40, blank=True)
    end_local = models.CharField(max_length=40, blank=True)
    badge = models.CharField(max_length=80, blank=True)
    meeting_point = models.CharField(max_length=255, blank=True)
    skill_note = models.CharField(max_length=120, blank=True)
    scene = models.CharField(max_length=20, blank=True)
    headline = models.CharField(max_length=200, blank=True)
    kit_title = models.CharField(max_length=120, blank=True)
    kit_body = models.TextField(blank=True)
    weather_title = models.CharField(max_length=120, blank=True)
    weather_body = models.TextField(blank=True)
    gallery_scenes = models.JSONField(default=list, blank=True)
    timezone_label = models.CharField(max_length=80, blank=True, default="Mountain Standard Time")
    listed_attendees = models.PositiveIntegerField(default=0)
    pinned_message = models.CharField(max_length=255, blank=True)
    is_past = models.BooleanField(default=False)
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


class EventMessage(models.Model):
    """A message in an event chat. `sent_local` is the wall-clock string the UI prints."""

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="event_messages")
    body = models.TextField()
    sent_local = models.CharField(max_length=40, blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sent_at"]


class GalleryPost(models.Model):
    """A profile gallery entry.

    Seeded posts keep a scene illustration. Posts people add store the
    uploaded file in `image` and leave the scene as a fallback only.
    """

    class Kind(models.TextChoices):
        ARTWORK = "artwork", "Artwork"
        MOMENT = "moment", "Moment"

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="gallery_posts")
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.ARTWORK)
    scene = models.CharField(max_length=20)
    image = models.ImageField(upload_to="gallery/", blank=True)
    title = models.CharField(max_length=150)
    medium = models.CharField(max_length=80, blank=True)
    caption = models.TextField(blank=True)
    spot = models.ForeignKey(
        "spots.Spot",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="gallery_posts",
    )
    event = models.ForeignKey(
        Event, null=True, blank=True, on_delete=models.SET_NULL, related_name="gallery_posts"
    )
    likes = models.PositiveIntegerField(default=0)
    posted_on = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-posted_on", "-created_at"]
