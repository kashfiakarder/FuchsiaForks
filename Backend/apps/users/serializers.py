from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Profile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]
        read_only_fields = fields


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="user", write_only=True, required=False
    )
    upcoming_events = serializers.SerializerMethodField()
    past_events = serializers.SerializerMethodField()
    art_gallery = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            "id",
            "user",
            "user_id",
            "auth0_id",
            "phone_number",
            "pfp",
            "interests",
            "city",
            "upcoming_events",
            "past_events",
            "art_gallery",
        ]

    def create(self, validated_data):
        request = self.context.get("request")
        if "user" not in validated_data and request and request.user.is_authenticated:
            validated_data["user"] = request.user
        return super().create(validated_data)

    def get_upcoming_events(self, obj):
        from apps.events.serializers import EventListSerializer

        return EventListSerializer(obj.upcoming_events, many=True).data

    def get_past_events(self, obj):
        from apps.events.serializers import EventListSerializer

        return EventListSerializer(obj.past_events, many=True).data

    def get_art_gallery(self, obj):
        from apps.events.serializers import EventPhotoSerializer

        return EventPhotoSerializer(obj.art_gallery, many=True, context=self.context).data
