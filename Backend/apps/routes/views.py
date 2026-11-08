from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.present import create_route_from_ui, present_route
from apps.spots.models import Spot

from .models import ChatMessage, ChatRoom, Route, RouteInvite
from .serializers import ChatMessageSerializer, ChatRoomSerializer, RouteSerializer

User = get_user_model()


def presented_route(route_id):
    """Reload stops and invites so a write is not hidden by a stale prefetch."""
    route = Route.objects.prefetch_related("stops", "invites").get(pk=route_id)
    return present_route(route)


class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.select_related("created_by", "chat_room").prefetch_related(
        "stops__spot"
    ).all()
    serializer_class = RouteSerializer
    permission_classes = [AllowAny]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy", "invite", "respond"):
            return [IsAuthenticated()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        if "spotIds" in request.data:
            name = str(request.data.get("name") or "").strip()
            spot_ids = request.data.get("spotIds") or []
            errors = {}
            if not name:
                errors["name"] = "Give the route a name."
            if not isinstance(spot_ids, list) or len(spot_ids) < 2:
                errors["spotIds"] = "A route needs at least two spots."
            if errors:
                return Response(errors, status=status.HTTP_400_BAD_REQUEST)
            try:
                route = create_route_from_ui(request.user, {**request.data, "name": name})
            except (Spot.DoesNotExist, TypeError, ValueError):
                return Response(
                    {"detail": "One of those spots no longer exists."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(
                {"route": presented_route(route.pk)}, status=status.HTTP_201_CREATED
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def invite(self, request, pk=None):
        route = self.get_object()
        if route.created_by_id != request.user.id:
            return Response(
                {"detail": "Only the person who planned this route can invite."},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            invitee = User.objects.get(pk=request.data.get("userId"))
        except (User.DoesNotExist, TypeError, ValueError):
            return Response(
                {"detail": "That person could not be found."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if invitee.id == request.user.id:
            return Response(
                {"detail": "You are already on this route."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        invite, created = RouteInvite.objects.get_or_create(
            route=route,
            invitee=invitee,
            defaults={
                "invited_by": request.user,
                "status": RouteInvite.Status.PENDING,
            },
        )
        if not created and invite.status == RouteInvite.Status.DECLINED:
            invite.status = RouteInvite.Status.PENDING
            invite.invited_by = request.user
            invite.responded_at = None
            invite.save(update_fields=["status", "invited_by", "responded_at"])
        elif not created and invite.status == RouteInvite.Status.ACCEPTED:
            return Response(
                {"detail": "They have already joined."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        elif not created:
            return Response(
                {"detail": "They are already invited."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"route": presented_route(route.pk)})

    @action(detail=True, methods=["post"])
    def respond(self, request, pk=None):
        route = self.get_object()
        choice = request.data.get("status")
        if choice not in (RouteInvite.Status.ACCEPTED, RouteInvite.Status.DECLINED):
            return Response(
                {"detail": "Say whether you are joining or not."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        invite = RouteInvite.objects.filter(route=route, invitee=request.user).first()
        if invite is None:
            return Response(
                {"detail": "You do not have an invite to this route."},
                status=status.HTTP_404_NOT_FOUND,
            )
        invite.status = choice
        invite.responded_at = timezone.now()
        invite.save(update_fields=["status", "responded_at"])
        return Response({"route": presented_route(route.pk)})


class ChatRoomViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ChatRoom.objects.select_related("route").all()
    serializer_class = ChatRoomSerializer
    permission_classes = [AllowAny]

    @action(detail=True, methods=["get", "post"], permission_classes=[AllowAny])
    def messages(self, request, pk=None):
        room = self.get_object()
        if request.method == "GET":
            messages = room.messages.select_related("sender").all()
            return Response(ChatMessageSerializer(messages, many=True).data)

        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        serializer = ChatMessageSerializer(data={**request.data, "room": room.id})
        serializer.is_valid(raise_exception=True)
        serializer.save(sender=request.user, room=room)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ChatMessageViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.select_related("sender", "room").all()
    serializer_class = ChatMessageSerializer
    permission_classes = [AllowAny]
    filterset_fields = ["room"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)
