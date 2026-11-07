from rest_framework import serializers

from apps.users.serializers import UserSerializer

from .models import Review, Spot


class SpotSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    number_of_people = serializers.IntegerField(read_only=True)
    average_rating = serializers.FloatField(read_only=True, allow_null=True)

    class Meta:
        model = Spot
        fields = [
            "id",
            "name",
            "description",
            "latitude",
            "longitude",
            "created_by",
            "created_at",
            "number_of_people",
            "average_rating",
        ]
        read_only_fields = ["created_at"]


class ReviewSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ["id", "spot", "author", "stars", "text", "created_at"]
        read_only_fields = ["created_at"]
