from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.present import build_bootstrap


class BootstrapView(APIView):
    """One payload for the signed-in app: people, spots, routes, events, reviews, chat, gallery."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(build_bootstrap(request.user, request))


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/bootstrap/", BootstrapView.as_view()),
    path("api/", include("api.urls")),
    path("api-auth/", include("rest_framework.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
