from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import ChatMessage, ChatRoom, Route
from .serializers import ChatMessageSerializer, ChatRoomSerializer, RouteSerializer


class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.select_related("created_by", "chat_room").prefetch_related(
        "stops__spot"
    ).all()
    serializer_class = RouteSerializer
    permission_classes = [AllowAny]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


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
