from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone


User = settings.AUTH_USER_MODEL


class Spot(models.Model):
    """A fixed location in the city."""

    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    created_by = models.ForeignKey(
        User, null=True, on_delete=models.SET_NULL, related_name="spots"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    @property
    def number_of_people(self):
        from apps.events.models import Invitation

        return (
            Invitation.objects.filter(
                event__spot=self,
                event__start_time__gte=timezone.now(),
                status=Invitation.Status.ACCEPTED,
            )
            .values("invitee")
            .distinct()
            .count()
        )

    @property
    def average_rating(self):
        return self.reviews.aggregate(avg=models.Avg("stars"))["avg"]


class Review(models.Model):
    spot = models.ForeignKey(Spot, on_delete=models.CASCADE, related_name="reviews")
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews")
    stars = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["spot", "author"], name="one_review_per_user_per_spot"
            )
        ]

    def __str__(self):
        return f"{self.author} -> {self.spot} ({self.stars}★)"
