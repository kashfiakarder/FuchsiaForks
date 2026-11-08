from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.events.views import gallery_image_problem
from apps.present import create_route_from_ui, present_route
from apps.spots.models import Spot

from .models import ChatMessage, ChatRoom, Route, RouteInvite, RouteJoinPhoto
from .serializers import ChatMessageSerializer, ChatRoomSerializer, RouteSerializer

User = get_user_model()


def presented_route(route_id, request):
    """Reload stops and invites so a write is not hidden by a stale prefetch."""
    route = Route.objects.prefetch_related("stops", "invites__photo").get(pk=route_id)
    return present_route(route, request)


class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.select_related("created_by", "chat_room").prefetch_related(
        "stops__spot"
    ).all()
    serializer_class = RouteSerializer
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in (
            "create",
            "update",
            "partial_update",
            "destroy",
            "invite",
            "respond",
            "join",
            "leave",
        ):
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
                {"route": presented_route(route.pk, request)}, status=status.HTTP_201_CREATED
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
        return Response({"route": presented_route(route.pk, request)})

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
        return Response({"route": presented_route(route.pk, request)})

    @action(detail=True, methods=["post"])
    def join(self, request, pk=None):
        """Join any route. A photo is what confirms you were on it."""
        route = self.get_object()
        if route.created_by_id == request.user.id:
            return Response(
                {"detail": "You planned this route."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        problem = gallery_image_problem(request.FILES.get("image"))
        if problem:
            return Response({"detail": problem}, status=status.HTTP_400_BAD_REQUEST)
        upload = request.FILES["image"]
        with transaction.atomic():
            invite, _created = RouteInvite.objects.get_or_create(
                route=route,
                invitee=request.user,
                defaults={
                    "invited_by_id": route.created_by_id or request.user.id,
                    "status": RouteInvite.Status.PENDING,
                },
            )
            existing = RouteJoinPhoto.objects.filter(invite=invite).first()
            if invite.status == RouteInvite.Status.ACCEPTED and existing is not None:
                return Response(
                    {"detail": "You have already joined this route."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if existing is not None:
                if existing.image:
                    existing.image.delete(save=False)
                existing.image = upload
                existing.save(update_fields=["image"])
            else:
                RouteJoinPhoto.objects.create(invite=invite, image=upload)
            invite.status = RouteInvite.Status.ACCEPTED
            invite.responded_at = timezone.now()
            invite.save(update_fields=["status", "responded_at"])
        return Response({"route": presented_route(route.pk, request)})

    @action(detail=True, methods=["post"])
    def leave(self, request, pk=None):
        route = self.get_object()
        if route.created_by_id == request.user.id:
            return Response(
                {"detail": "You planned this route."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        invite = RouteInvite.objects.filter(route=route, invitee=request.user).first()
        if invite is not None and invite.status != RouteInvite.Status.DECLINED:
            photo = RouteJoinPhoto.objects.filter(invite=invite).first()
            if photo is not None:
                image = photo.image
                photo.delete()
                if image:
                    image.delete(save=False)
            invite.status = RouteInvite.Status.DECLINED
            invite.responded_at = timezone.now()
            invite.save(update_fields=["status", "responded_at"])
        return Response({"route": presented_route(route.pk, request)})


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
