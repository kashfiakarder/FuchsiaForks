"""Map Django rows onto the shape the React screens already render.

Ids are strings. Event times stay as the authored wall-clock strings
(`2026-11-14T10:00:00-07:00`) because the frontend prints those digits
verbatim and does not convert time zones.
"""

from datetime import date, datetime

from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from apps.events.models import Event, EventMessage, GalleryPost, Invitation
from apps.routes.models import ChatRoom, Route, RouteStop
from apps.spots.models import Review, SavedSpot, Spot
from apps.users.models import Profile


def sid(pk) -> str:
    return str(pk)


def parse_wall_clock(value: str) -> datetime:
    parsed = parse_datetime(value) or datetime.fromisoformat(value)
    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed, timezone.get_fixed_timezone(-7 * 60))
    return parsed


def initials(name: str) -> str:
    parts = [part for part in (name or "").split() if part]
    if not parts:
        return "?"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return f"{parts[0][0]}{parts[-1][0]}".upper()


def present_person(profile: Profile) -> dict:
    user = profile.user
    name = profile.display_name or user.get_full_name() or user.get_username()
    first = user.first_name or (name.split()[0] if name else "there")
    joined = profile.joined_on or user.date_joined.date()
    return {
        "id": sid(user.pk),
        "name": name,
        "firstName": first,
        "initials": initials(name),
        "handle": profile.handle or user.get_username(),
        "city": profile.city,
        "tint": profile.tint or "#F1DCEE",
        "visibility": profile.visibility,
        "pronouns": profile.pronouns,
        "bio": profile.bio,
        "mediums": profile.mediums or [],
        "joined": joined.isoformat(),
        "followers": profile.followers_count,
        "following": profile.following_count,
        "phone": profile.phone_number,
        "email": user.email,
    }


def present_spot(spot: Spot) -> dict:
    return {
        "id": sid(spot.pk),
        "lonLat": [float(spot.longitude), float(spot.latitude)],
        "region": spot.region,
        "name": spot.name,
        "address": spot.address,
        "city": spot.city,
        "distanceKm": float(spot.distance_km or 0),
        "rating": float(spot.standing_rating or 0),
        "reviewCount": spot.standing_review_count,
        "artistCount": spot.artist_count,
        "tagline": spot.tagline,
        "scene": spot.scene,
        "about": spot.description,
        "features": spot.features or [],
    }


def _paragraphs(text: str) -> list[str]:
    parts = [part.strip() for part in (text or "").split("\n\n") if part.strip()]
    return parts


def present_route(route: Route) -> dict:
    return {
        "id": sid(route.pk),
        "name": route.name,
        "description": route.description or "",
        "hostId": sid(route.created_by_id) if route.created_by_id else None,
        "stops": [
            {"order": stop.order, "spotId": sid(stop.spot_id)}
            for stop in route.stops.all()
        ],
        "invites": [
            {"userId": sid(invite.invitee_id), "status": invite.status}
            for invite in route.invites.all()
        ],
    }


def present_event(event: Event) -> dict:
    scene = event.scene or (event.spot.scene if event.spot_id else "meadow")
    return {
        "id": sid(event.pk),
        "title": event.title,
        "badge": event.badge,
        "spotId": sid(event.spot_id) if event.spot_id else None,
        "meetingPoint": event.meeting_point,
        "hostId": sid(event.host_id),
        "skillNote": event.skill_note,
        "start": event.start_local or event.start_time.isoformat(),
        "end": event.end_local or event.start_local or event.start_time.isoformat(),
        "timezone": event.timezone_label or "Mountain Standard Time",
        "attendees": event.listed_attendees,
        "scene": scene,
        "headline": event.headline or event.title,
        "description": _paragraphs(event.description),
        "kit": {"title": event.kit_title, "body": event.kit_body},
        "weatherNote": {"title": event.weather_title, "body": event.weather_body},
        "gallery": event.gallery_scenes or [],
        "pinned": event.pinned_message,
        "past": event.is_past,
    }


def present_review(review: Review, viewer) -> dict:
    date = review.reviewed_on.isoformat() if review.reviewed_on else review.created_at.date().isoformat()
    return {
        "id": sid(review.pk),
        "authorId": sid(review.author_id),
        "date": date,
        "rating": review.stars,
        "body": review.text,
        "mine": bool(viewer and viewer.is_authenticated and review.author_id == viewer.id),
    }


def present_message(message: EventMessage) -> dict:
    return {
        "id": sid(message.pk),
        "authorId": sid(message.sender_id),
        "at": message.sent_local or message.sent_at.isoformat(),
        "body": message.body,
    }


def gallery_image_url(post: GalleryPost, request=None) -> str:
    """Absolute URL for an uploaded gallery file, or "" when there is none.

    S3 already returns an absolute URL. A file on local disk is stored as
    `/media/...`, which the frontend (a different origin) cannot load unless
    it is expanded against this request.
    """
    if not post.image:
        return ""
    url = post.image.url
    if url.startswith(("http://", "https://")) or request is None:
        return url
    return request.build_absolute_uri(url)


def present_post(post: GalleryPost, request=None) -> dict:
    return {
        "id": sid(post.pk),
        "ownerId": sid(post.owner_id),
        "kind": post.kind,
        "scene": post.scene,
        "imageUrl": gallery_image_url(post, request),
        "title": post.title,
        "medium": post.medium,
        "caption": post.caption,
        "spotId": sid(post.spot_id) if post.spot_id else None,
        "eventId": sid(post.event_id) if post.event_id else None,
        "date": (post.posted_on or post.created_at.date()).isoformat(),
        "likes": post.likes,
        "mine": False,
    }


def joined_event_ids(user) -> list[str]:
    invited = Invitation.objects.filter(
        invitee=user,
        status__in=[Invitation.Status.ACCEPTED, Invitation.Status.COMPLETED],
    ).values_list("event_id", flat=True)
    hosted = Event.objects.filter(host=user).values_list("pk", flat=True)
    return [sid(pk) for pk in sorted(set(invited) | set(hosted))]


def saved_spot_ids(user) -> list[str]:
    return [sid(pk) for pk in SavedSpot.objects.filter(user=user).values_list("spot_id", flat=True)]


def build_bootstrap(user, request=None) -> dict:
    profiles = list(Profile.objects.select_related("user").order_by("display_name", "id"))
    spots = list(Spot.objects.all().order_by("name"))
    routes = list(
        Route.objects.prefetch_related("stops", "invites").order_by("-created_at", "name")
    )
    events = list(Event.objects.select_related("spot", "host").order_by("start_time"))
    reviews = list(Review.objects.all().order_by("-reviewed_on", "-created_at"))
    messages = list(EventMessage.objects.all().order_by("sent_at"))
    posts = list(GalleryPost.objects.all())

    people = [present_person(profile) for profile in profiles]
    me = next((person for person in people if person["id"] == sid(user.pk)), None)

    reviews_by_spot: dict[str, list] = {}
    for review in reviews:
        reviews_by_spot.setdefault(sid(review.spot_id), []).append(present_review(review, user))

    messages_by_event: dict[str, list] = {}
    for message in messages:
        messages_by_event.setdefault(sid(message.event_id), []).append(present_message(message))

    visible_owner_ids = {
        profile.user_id
        for profile in profiles
        if profile.visibility == Profile.Visibility.PUBLIC or profile.user_id == user.id
    }
    gallery: dict[str, list] = {}
    gallery_counts: dict[str, int] = {}
    for post in posts:
        owner = sid(post.owner_id)
        gallery_counts[owner] = gallery_counts.get(owner, 0) + 1
        if post.owner_id in visible_owner_ids:
            item = present_post(post, request)
            item["mine"] = post.owner_id == user.id
            gallery.setdefault(owner, []).append(item)
    for owner in gallery_counts:
        gallery.setdefault(owner, [])

    upcoming = [present_event(event) for event in events if not event.is_past]
    past = [present_event(event) for event in events if event.is_past]

    return {
        "me": me,
        "people": people,
        "spots": [present_spot(spot) for spot in spots],
        "routes": [present_route(route) for route in routes],
        "events": upcoming,
        "pastEvents": past,
        "reviews": reviews_by_spot,
        "messages": messages_by_event,
        "gallery": gallery,
        "galleryCounts": gallery_counts,
        "savedSpotIds": saved_spot_ids(user),
        "joinedEventIds": joined_event_ids(user),
    }


def apply_profile(profile: Profile, data: dict) -> Profile:
    user = profile.user
    if "name" in data:
        name = str(data["name"]).strip()
        profile.display_name = name
        parts = name.split()
        user.first_name = parts[0] if parts else ""
        user.last_name = " ".join(parts[1:]) if len(parts) > 1 else ""
    if "pronouns" in data:
        profile.pronouns = str(data["pronouns"]).strip()
    if "city" in data:
        profile.city = str(data["city"]).strip()
    if "bio" in data:
        profile.bio = str(data["bio"]).strip()
    if "mediums" in data:
        mediums = data["mediums"]
        if isinstance(mediums, str):
            mediums = [part.strip() for part in mediums.split(",") if part.strip()]
        profile.mediums = list(mediums)
    if "visibility" in data and data["visibility"] in Profile.Visibility.values:
        profile.visibility = data["visibility"]
    if "phone" in data:
        profile.phone_number = str(data["phone"]).strip()
    if "handle" in data:
        profile.handle = str(data["handle"]).strip().lstrip("@")
    user.save(update_fields=["first_name", "last_name"])
    profile.save()
    return profile


def create_event_from_ui(user, data: dict) -> Event:
    spot = Spot.objects.get(pk=data["spotId"])
    start = data["start"]
    end = data.get("end") or start
    description = data.get("description") or ""
    if isinstance(description, list):
        description = "\n\n".join(str(part) for part in description if str(part).strip())
    kit = data.get("kit") or {}
    weather = data.get("weatherNote") or {}
    event = Event(
        spot=spot,
        host=user,
        title=str(data["title"]).strip(),
        description=description,
        start_time=parse_wall_clock(start),
        start_local=start,
        end_local=end,
        badge=data.get("badge") or "Community paint-out",
        meeting_point=(data.get("meetingPoint") or spot.address or "").strip(),
        skill_note=data.get("skillNote") or "All skill levels welcome",
        scene=data.get("scene") or spot.scene,
        headline=(data.get("headline") or str(data["title"])).strip(),
        kit_title=kit.get("title") or "Bring your outdoor kit",
        kit_body=kit.get("body") or "Whatever you like to work with, plus layers.",
        weather_title=weather.get("title") or "Check the forecast",
        weather_body=weather.get("body") or "Alberta weather turns fast. Watch the chat for changes.",
        gallery_scenes=data.get("gallery") or [spot.scene, "palette", "meadow"],
        timezone_label=data.get("timezone") or "Mountain Standard Time",
        listed_attendees=1,
        is_past=False,
    )
    event.save()
    Invitation.objects.create(
        event=event,
        invitee=user,
        invited_by=user,
        status=Invitation.Status.ACCEPTED,
        responded_at=timezone.now(),
    )
    return event


def create_route_from_ui(user, data: dict) -> Route:
    """Save an ordered list of existing spots. `spotIds` is stop 1, stop 2, ..."""
    name = str(data["name"]).strip()
    description = str(data.get("description") or "").strip()
    spots = [Spot.objects.get(pk=spot_id) for spot_id in data.get("spotIds") or []]
    with transaction.atomic():
        route = Route.objects.create(name=name, description=description, created_by=user)
        RouteStop.objects.bulk_create(
            [
                RouteStop(route=route, spot=spot, order=index)
                for index, spot in enumerate(spots, start=1)
            ]
        )
        ChatRoom.objects.create(route=route)
    return route


def set_attendance(event: Event, user, going: bool) -> Event:
    if event.host_id == user.id:
        return event
    invitation = Invitation.objects.filter(event=event, invitee=user).first()
    if going:
        if invitation is None:
            Invitation.objects.create(
                event=event,
                invitee=user,
                invited_by=event.host,
                status=Invitation.Status.ACCEPTED,
                responded_at=timezone.now(),
            )
            event.listed_attendees += 1
            event.save(update_fields=["listed_attendees"])
        elif invitation.status not in (Invitation.Status.ACCEPTED, Invitation.Status.COMPLETED):
            invitation.status = Invitation.Status.ACCEPTED
            invitation.responded_at = timezone.now()
            invitation.save(update_fields=["status", "responded_at"])
            event.listed_attendees += 1
            event.save(update_fields=["listed_attendees"])
    elif invitation and invitation.status in (Invitation.Status.ACCEPTED, Invitation.Status.COMPLETED):
        invitation.status = Invitation.Status.DECLINED
        invitation.responded_at = timezone.now()
        invitation.save(update_fields=["status", "responded_at"])
        event.listed_attendees = max(0, event.listed_attendees - 1)
        event.save(update_fields=["listed_attendees"])
    return event


def toggle_save(user, spot: Spot) -> bool:
    existing = SavedSpot.objects.filter(user=user, spot=spot).first()
    if existing:
        existing.delete()
        return False
    SavedSpot.objects.create(user=user, spot=spot)
    return True


def add_review(user, spot: Spot, rating: int, body: str, reviewed_on) -> Review:
    if isinstance(reviewed_on, str):
        reviewed_on = date.fromisoformat(reviewed_on[:10])
    review, _created = Review.objects.update_or_create(
        spot=spot,
        author=user,
        defaults={"stars": rating, "text": body, "reviewed_on": reviewed_on},
    )
    return review


def add_message(user, event: Event, body: str, sent_local: str) -> EventMessage:
    return EventMessage.objects.create(
        event=event,
        sender=user,
        body=body.strip(),
        sent_local=sent_local,
    )


def add_gallery_post(user, data: dict, image=None) -> GalleryPost:
    spot = None
    if data.get("spotId"):
        spot = Spot.objects.filter(pk=data["spotId"]).first()
    event = None
    if data.get("eventId"):
        event = Event.objects.filter(pk=data["eventId"]).first()
    posted_on = data.get("date") or timezone.localdate()
    if isinstance(posted_on, str):
        posted_on = date.fromisoformat(posted_on[:10])
    return GalleryPost.objects.create(
        owner=user,
        kind=data.get("kind") or GalleryPost.Kind.ARTWORK,
        scene=data.get("scene") or "creek",
        image=image if image is not None else "",
        title=str(data.get("title") or "").strip(),
        medium=str(data.get("medium") or "").strip(),
        caption=str(data.get("caption") or "").strip(),
        spot=spot,
        event=event,
        posted_on=posted_on,
    )
