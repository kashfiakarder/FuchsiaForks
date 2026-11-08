from rest_framework.routers import DefaultRouter

from apps.events.views import EventPhotoViewSet, EventViewSet, GalleryPostViewSet, InvitationViewSet
from apps.routes.views import ChatMessageViewSet, ChatRoomViewSet, RouteViewSet
from apps.spots.views import ReviewViewSet, SpotViewSet
from apps.users.views import ProfileViewSet

router = DefaultRouter()
router.register("profiles", ProfileViewSet)
router.register("spots", SpotViewSet)
router.register("reviews", ReviewViewSet)
router.register("routes", RouteViewSet)
router.register("chat-rooms", ChatRoomViewSet)
router.register("chat-messages", ChatMessageViewSet)
router.register("events", EventViewSet)
router.register("invitations", InvitationViewSet)
router.register("event-photos", EventPhotoViewSet)
router.register("gallery-posts", GalleryPostViewSet)

urlpatterns = router.urls
