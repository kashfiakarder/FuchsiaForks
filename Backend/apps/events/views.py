from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Event, EventPhoto, Invitation
from .serializers import (
    EventPhotoSerializer,
    EventSerializer,
    InvitationRespondSerializer,
    InvitationSerializer,
)


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.select_related("host", "spot", "route").prefetch_related(
        "invitations__invitee", "invitations__invited_by"
    ).all()
    serializer_class = EventSerializer
    permission_classes = [AllowAny]
    filterset_fields = ["spot", "route", "host"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy", "invite"):
            return [IsAuthenticated()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(host=self.request.user)

    @action(detail=True, methods=["post"])
    def invite(self, request, pk=None):
        event = self.get_object()
        serializer = InvitationSerializer(
            data={**request.data, "event": event.id},
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        invitation = Invitation.objects.create(
            event=event,
            invitee=serializer.validated_data["invitee"],
            invited_by=request.user,
        )
        return Response(
            InvitationSerializer(invitation).data, status=status.HTTP_201_CREATED
        )


class InvitationViewSet(viewsets.ModelViewSet):
    queryset = Invitation.objects.select_related(
        "event", "invitee", "invited_by"
    ).all()
    serializer_class = InvitationSerializer
    permission_classes = [AllowAny]
    filterset_fields = ["event", "invitee", "status"]

    def get_permissions(self):
        if self.action in (
            "create",
            "update",
            "partial_update",
            "destroy",
            "respond",
            "complete",
        ):
            return [IsAuthenticated()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(invited_by=self.request.user)

    @action(detail=True, methods=["post"])
    def respond(self, request, pk=None):
        invitation = self.get_object()
        if invitation.invitee_id != request.user.id:
            return Response(
                {"detail": "Only the invitee can respond."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = InvitationRespondSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invitation = serializer.update(invitation, serializer.validated_data)
        return Response(InvitationSerializer(invitation).data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        invitation = self.get_object()
        if invitation.invitee_id != request.user.id:
            return Response(
                {"detail": "Only the invitee can complete this invitation."},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            invitation.complete()
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(InvitationSerializer(invitation).data)


class EventPhotoViewSet(viewsets.ModelViewSet):
    queryset = EventPhoto.objects.select_related(
        "uploaded_by", "event", "invitation"
    ).all()
    serializer_class = EventPhotoSerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ["event", "uploaded_by"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated()]
        return super().get_permissions()

    def perform_create(self, serializer):
        photo = serializer.save(uploaded_by=self.request.user)
        invitation = photo.invitation
        if invitation.status == Invitation.Status.ACCEPTED:
            invitation.status = Invitation.Status.COMPLETED
            invitation.responded_at = invitation.responded_at or timezone.now()
            invitation.save(update_fields=["status", "responded_at"])
