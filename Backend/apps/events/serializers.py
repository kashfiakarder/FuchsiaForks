from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.users.serializers import UserSerializer

from .models import Event, EventPhoto, Invitation

User = get_user_model()


class InvitationSerializer(serializers.ModelSerializer):
    invitee = UserSerializer(read_only=True)
    invited_by = UserSerializer(read_only=True)
    invitee_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="invitee", write_only=True
    )
    photo_submitted = serializers.BooleanField(read_only=True)

    class Meta:
        model = Invitation
        fields = [
            "id",
            "event",
            "invitee",
            "invitee_id",
            "invited_by",
            "status",
            "invited_at",
            "responded_at",
            "photo_submitted",
        ]
        read_only_fields = ["status", "invited_at", "responded_at"]


class EventListSerializer(serializers.ModelSerializer):
    host = UserSerializer(read_only=True)

    class Meta:
        model = Event
        fields = [
            "id",
            "spot",
            "route",
            "host",
            "title",
            "description",
            "start_time",
            "created_at",
        ]


class EventSerializer(serializers.ModelSerializer):
    host = UserSerializer(read_only=True)
    invitations = InvitationSerializer(many=True, read_only=True)
    invitee_ids = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source="invitees",
    )

    class Meta:
        model = Event
        fields = [
            "id",
            "spot",
            "route",
            "host",
            "title",
            "description",
            "start_time",
            "created_at",
            "invitations",
            "invitee_ids",
        ]
        read_only_fields = ["created_at"]

    def validate(self, attrs):
        if self.instance is None:
            spot = attrs.get("spot")
            route = attrs.get("route")
        else:
            spot = attrs.get("spot", self.instance.spot)
            route = attrs.get("route", self.instance.route)
        has_spot = spot is not None
        has_route = route is not None
        if has_spot == has_route:
            raise serializers.ValidationError(
                "Event must have exactly one of spot or route."
            )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        invitees = validated_data.pop("invitees", [])
        host = validated_data["host"]
        event = Event.objects.create(**validated_data)
        for invitee in invitees:
            Invitation.objects.create(
                event=event,
                invitee=invitee,
                invited_by=host,
            )
        return event


class EventPhotoSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)

    class Meta:
        model = EventPhoto
        fields = [
            "id",
            "invitation",
            "event",
            "uploaded_by",
            "image",
            "caption",
            "created_at",
        ]
        read_only_fields = ["event", "created_at"]

    def create(self, validated_data):
        invitation = validated_data["invitation"]
        validated_data["event"] = invitation.event
        return super().create(validated_data)


class InvitationRespondSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[Invitation.Status.ACCEPTED, Invitation.Status.DECLINED]
    )

    def update(self, instance, validated_data):
        instance.status = validated_data["status"]
        instance.responded_at = timezone.now()
        instance.save(update_fields=["status", "responded_at"])
        return instance
