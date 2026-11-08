from datetime import date

from django.utils import timezone
from PIL import Image, UnidentifiedImageError
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.present import (
    add_gallery_post,
    add_message,
    create_event_from_ui,
    joined_event_ids,
    present_event,
    present_message,
    present_post,
    set_attendance,
)

from .models import Event, EventPhoto, GalleryPost, Invitation
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
        if self.action in (
            "create",
            "update",
            "partial_update",
            "destroy",
            "invite",
            "join",
            "leave",
            "messages",
        ):
            return [IsAuthenticated()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        if "spotId" in request.data or "start" in request.data:
            event = create_event_from_ui(request.user, request.data)
            return Response(
                {"event": present_event(event), "joinedEventIds": joined_event_ids(request.user)},
                status=status.HTTP_201_CREATED,
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(host=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def join(self, request, pk=None):
        event = set_attendance(self.get_object(), request.user, going=True)
        return Response(
            {"event": present_event(event), "joinedEventIds": joined_event_ids(request.user)}
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def leave(self, request, pk=None):
        event = set_attendance(self.get_object(), request.user, going=False)
        return Response(
            {"event": present_event(event), "joinedEventIds": joined_event_ids(request.user)}
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def messages(self, request, pk=None):
        body = str(request.data.get("body") or "").strip()
        if not body:
            return Response({"detail": "Message body is required."}, status=status.HTTP_400_BAD_REQUEST)
        message = add_message(
            request.user,
            self.get_object(),
            body,
            str(request.data.get("at") or ""),
        )
        return Response(present_message(message), status=status.HTTP_201_CREATED)

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


MAX_GALLERY_IMAGE_BYTES = 8 * 1024 * 1024
ALLOWED_GALLERY_FORMATS = {"JPEG", "PNG", "GIF", "WEBP"}


def gallery_image_problem(upload):
    """A message when the upload cannot be stored, or None when it is fine."""
    if not upload or isinstance(upload, str):
        return "Choose an image."
    size = getattr(upload, "size", 0) or 0
    if size > MAX_GALLERY_IMAGE_BYTES:
        return "That image is larger than 8 MB."
    try:
        with Image.open(upload) as image:
            fmt = image.format
            image.verify()
    except (UnidentifiedImageError, OSError, ValueError):
        return "Choose a photo — JPEG, PNG, GIF, or WebP."
    finally:
        if hasattr(upload, "seek"):
            upload.seek(0)
    if fmt not in ALLOWED_GALLERY_FORMATS:
        return "Choose a photo — JPEG, PNG, GIF, or WebP."
    return None


class GalleryPostViewSet(viewsets.ModelViewSet):
    queryset = GalleryPost.objects.select_related("owner", "spot", "event").all()
    serializer_class = EventPhotoSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def list(self, request, *args, **kwargs):
        posts = self.get_queryset()
        owner = request.query_params.get("owner")
        if owner:
            posts = posts.filter(owner_id=owner)
        payload = []
        for post in posts:
            item = present_post(post, request)
            item["mine"] = post.owner_id == request.user.id
            payload.append(item)
        return Response(payload)

    def create(self, request, *args, **kwargs):
        if not str(request.data.get("title") or "").strip():
            return Response({"detail": "Give it a title."}, status=status.HTTP_400_BAD_REQUEST)
        upload = request.FILES.get("image")
        problem = gallery_image_problem(upload)
        if problem:
            return Response({"detail": problem}, status=status.HTTP_400_BAD_REQUEST)
        data = request.data.copy()
        if not data.get("date"):
            data["date"] = date.today().isoformat()
        post = add_gallery_post(request.user, data, image=upload)
        item = present_post(post, request)
        item["mine"] = True
        return Response(item, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        post = self.get_object()
        if post.owner_id != request.user.id:
            return Response({"detail": "You can only remove your own posts."}, status=status.HTTP_403_FORBIDDEN)
        image = post.image
        post.delete()
        if image:
            image.delete(save=False)
        return Response(status=status.HTTP_204_NO_CONTENT)
