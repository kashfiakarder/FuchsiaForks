from django.conf import settings
from django.db import models
from django.utils import timezone


User = settings.AUTH_USER_MODEL


class Profile(models.Model):
    """
    Identity lives in Auth0 — no passwords stored here.
    On first login, your DRF auth class validates the Auth0 JWT, then
    get_or_create()s a shadow Django User (unusable password) and this Profile,
    keyed on the token's `sub` claim.
    """

    class Visibility(models.TextChoices):
        PUBLIC = "public", "Public"
        PRIVATE = "private", "Private"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    auth0_id = models.CharField(max_length=128, unique=True)
    slug = models.SlugField(max_length=80, unique=True, null=True, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    pfp = models.ImageField(upload_to="pfps/", blank=True, null=True)
    interests = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    display_name = models.CharField(max_length=120, blank=True)
    handle = models.CharField(max_length=40, blank=True)
    pronouns = models.CharField(max_length=40, blank=True)
    bio = models.TextField(blank=True)
    mediums = models.JSONField(default=list, blank=True)
    visibility = models.CharField(
        max_length=10, choices=Visibility.choices, default=Visibility.PUBLIC
    )
    tint = models.CharField(max_length=7, blank=True, default="#F1DCEE")
    followers_count = models.PositiveIntegerField(default=0)
    following_count = models.PositiveIntegerField(default=0)
    joined_on = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.user.get_username()

    @property
    def upcoming_events(self):
        from apps.events.models import Event, Invitation

        return Event.objects.filter(
            invitations__invitee=self.user,
            invitations__status=Invitation.Status.ACCEPTED,
            start_time__gte=timezone.now(),
        ).order_by("start_time")

    @property
    def past_events(self):
        from apps.events.models import Event, Invitation

        return Event.objects.filter(
            invitations__invitee=self.user,
            invitations__status=Invitation.Status.COMPLETED,
        ).order_by("-start_time")

    @property
    def art_gallery(self):
        return self.user.event_photos.order_by("-created_at")
