from rest_framework import serializers

from apps.users.serializers import UserSerializer

from .models import Review, Spot


class SpotSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, coerce_to_string=False)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, coerce_to_string=False)
    number_of_people = serializers.IntegerField(read_only=True)
    average_rating = serializers.FloatField(read_only=True, allow_null=True)
    review_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Spot
        fields = [
            "id",
            "name",
            "description",
            "address",
            "city",
            "region",
            "tagline",
            "scene",
            "features",
            "latitude",
            "longitude",
            "created_by",
            "created_at",
            "number_of_people",
            "average_rating",
            "review_count",
        ]
        read_only_fields = ["created_at"]


class ReviewSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ["id", "spot", "author", "stars", "text", "created_at"]
        read_only_fields = ["created_at"]
