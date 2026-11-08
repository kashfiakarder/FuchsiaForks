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

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    auth0_id = models.CharField(max_length=128, unique=True)
    phone_number = models.CharField(max_length=20, blank=True)
    pfp = models.ImageField(upload_to="pfps/", blank=True, null=True)
    interests = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)

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
