from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.present import apply_profile, present_person

from .models import Profile
from .serializers import ProfileSerializer


class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.select_related("user").all()
    serializer_class = ProfileSerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy", "me"):
            return [IsAuthenticated()]
        return super().get_permissions()

    @action(detail=False, methods=["get", "patch"], url_path="me")
    def me(self, request):
        """Return or update the signed-in profile in the shape the screens render."""
        try:
            profile = request.user.profile
        except Profile.DoesNotExist:
            return Response(
                {"detail": "Profile not found for this user."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if request.method == "PATCH":
            profile = apply_profile(profile, request.data)
        return Response(present_person(profile))
