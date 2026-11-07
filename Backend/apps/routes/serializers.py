from django.db import transaction
from rest_framework import serializers

from apps.spots.models import Spot
from apps.spots.serializers import SpotSerializer
from apps.users.serializers import UserSerializer

from .models import ChatMessage, ChatRoom, Route, RouteStop


class RouteStopSerializer(serializers.ModelSerializer):
    spot_detail = SpotSerializer(source="spot", read_only=True)

    class Meta:
        model = RouteStop
        fields = ["id", "spot", "spot_detail", "order"]


class RouteStopWriteSerializer(serializers.Serializer):
    spot = serializers.PrimaryKeyRelatedField(queryset=Spot.objects.all())
    order = serializers.IntegerField(min_value=1)


class RouteSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    ordered_stops = RouteStopSerializer(many=True, read_only=True)
    stops = RouteStopWriteSerializer(many=True, write_only=True, required=False)
    number_of_people = serializers.IntegerField(read_only=True)
    chat_room_id = serializers.IntegerField(source="chat_room.id", read_only=True)

    class Meta:
        model = Route
        fields = [
            "id",
            "name",
            "description",
            "created_by",
            "created_at",
            "ordered_stops",
            "stops",
            "number_of_people",
            "chat_room_id",
        ]
        read_only_fields = ["created_at"]

    @transaction.atomic
    def create(self, validated_data):
        stops_data = validated_data.pop("stops", [])
        route = Route.objects.create(**validated_data)
        for stop in stops_data:
            RouteStop.objects.create(route=route, **stop)
        ChatRoom.objects.create(route=route)
        return route

    @transaction.atomic
    def update(self, instance, validated_data):
        stops_data = validated_data.pop("stops", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if stops_data is not None:
            instance.stops.all().delete()
            for stop in stops_data:
                RouteStop.objects.create(route=instance, **stop)
        return instance


class ChatRoomSerializer(serializers.ModelSerializer):
    route = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = ChatRoom
        fields = ["id", "route"]


class ChatMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = ChatMessage
        fields = ["id", "room", "sender", "body", "sent_at"]
        read_only_fields = ["sent_at"]
