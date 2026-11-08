from datetime import date

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.present import add_review, present_review, saved_spot_ids, toggle_save

from .models import Review, Spot
from .serializers import ReviewSerializer, SpotSerializer


class SpotViewSet(viewsets.ModelViewSet):
    queryset = Spot.objects.select_related("created_by").all()
    serializer_class = SpotSerializer
    permission_classes = [AllowAny]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy", "save", "add_review"):
            return [IsAuthenticated()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def save(self, request, pk=None):
        toggle_save(request.user, self.get_object())
        return Response({"savedSpotIds": saved_spot_ids(request.user)})

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated], url_path="reviews")
    def add_review(self, request, pk=None):
        try:
            rating = int(request.data.get("rating") or request.data.get("stars"))
        except (TypeError, ValueError):
            return Response({"detail": "A rating from 1 to 5 is required."}, status=status.HTTP_400_BAD_REQUEST)
        if rating < 1 or rating > 5:
            return Response({"detail": "A rating from 1 to 5 is required."}, status=status.HTTP_400_BAD_REQUEST)
        reviewed_on = request.data.get("date") or date.today().isoformat()
        review = add_review(
            request.user,
            self.get_object(),
            rating,
            str(request.data.get("body") or request.data.get("text") or "").strip(),
            reviewed_on,
        )
        return Response(present_review(review, request.user), status=status.HTTP_201_CREATED)


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
