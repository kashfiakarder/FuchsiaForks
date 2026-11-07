from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Review, Spot
from .serializers import ReviewSerializer, SpotSerializer


class SpotViewSet(viewsets.ModelViewSet):
    queryset = Spot.objects.select_related("created_by").all()
    serializer_class = SpotSerializer
    permission_classes = [AllowAny]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.select_related("author", "spot").all()
    serializer_class = ReviewSerializer
    permission_classes = [AllowAny]
    filterset_fields = ["spot"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
