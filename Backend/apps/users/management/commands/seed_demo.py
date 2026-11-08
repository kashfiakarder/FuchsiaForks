"""Load the demo catalog the screens were designed around."""

import json
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from apps.events.models import Event, EventMessage, GalleryPost, Invitation
from apps.present import parse_wall_clock
from apps.routes.models import ChatRoom, Route, RouteInvite, RouteStop
from apps.spots.models import Review, Spot
from apps.users.models import Profile

CALGARY_ROUTE_STOPS = (
    "fish-creek",
    "north-glenmore",
    "crescent-heights",
    "bowness-park",
)

User = get_user_model()
FIXTURE = Path(__file__).resolve().parents[4] / "fixtures" / "demo.json"

# Routes other people planned. Hanz has not joined, so Join is available on his account.
OPEN_ROUTES = (
    {
        "name": "Rockies colour loop",
        "description": "Louise, Moraine, then the Peyto overlook. A long day of cold colour.",
        "stops": ("lake-louise", "moraine-lake", "peyto-lake"),
        "owner": "priya",
        "joined": ("alex",),
    },
    {
        "name": "Badlands pigment trail",
        "description": "Three stops of ochre, hoodoos, and a very wide sky.",
        "stops": ("horseshoe-canyon", "writing-on-stone", "dinosaur-park"),
        "owner": "sam",
        "joined": ("priya", "maya"),
    },
    {
        "name": "Foothills watercolour walk",
        "description": "Canmore creek, then two lakes. Bring a board that can take wind.",
        "stops": ("policemans-creek", "upper-kananaskis", "waterton-townsite"),
        "owner": "alex",
        "joined": ("jamie",),
    },
)

# Routes on Hanz's profile. He planned them, so anyone else can join.
HANZ_ROUTES = (
    {
        "name": "Bow valley sketch loop",
        "description": "Skyline first, then the sanctuary, and down to the creek.",
        "stops": ("crescent-heights", "inglewood-sanctuary", "fish-creek"),
        "joined": ("maya", "sam"),
    },
    {
        "name": "Reservoir to the hill",
        "description": "Water, a park lagoon, then the prairie on Nose Hill.",
        "stops": ("north-glenmore", "bowness-park", "nose-hill"),
        "joined": ("alex",),
    },
    {
        "name": "Canmore to the lakes",
        "description": "Start in town and finish above the water. One day, three views.",
        "stops": ("policemans-creek", "upper-kananaskis", "lake-louise"),
        "joined": ("priya", "jamie"),
    },
)

HANZ_PAST_EVENTS = (
    {
        "slug": "hanz-past-nose-hill",
        "title": "Dusk Studies on Nose Hill",
        "spot": "nose-hill",
        "start": "2026-10-18T16:30:00-06:00",
        "end": "2026-10-18T18:30:00-06:00",
        "scene": "prairie",
        "headline": "The grass went gold and then grey.",
        "description": "A short evening on the hill. We chased the last warm light, then stayed for the blue.",
        "meetingPoint": "North parking lot, Nose Hill Park",
        "attendees": 9,
    },
    {
        "slug": "hanz-past-glenmore",
        "title": "Wind Sketches at Glenmore",
        "spot": "north-glenmore",
        "start": "2026-10-04T13:00:00-06:00",
        "end": "2026-10-04T15:30:00-06:00",
        "scene": "reservoir",
        "headline": "Fast studies before the wind took the paper.",
        "description": "Small panels, big water. We worked in short bursts and compared what the light did to the reservoir.",
        "meetingPoint": "Sailing school parking lot",
        "attendees": 12,
    },
    {
        "slug": "hanz-past-inglewood",
        "title": "Morning Wash at Inglewood",
        "spot": "inglewood-sanctuary",
        "start": "2026-09-20T09:30:00-06:00",
        "end": "2026-09-20T12:00:00-06:00",
        "scene": "woods",
        "headline": "Quiet water and a slow first wash.",
        "description": "Met at the sanctuary gate and painted the river edge before the path got busy.",
        "meetingPoint": "Sanctuary entrance gate",
        "attendees": 7,
    },
)


class Command(BaseCommand):
    help = "Create or update the demo spots, artists, routes, events, reviews, chats, and galleries."

    @transaction.atomic
    def handle(self, *args, **options):
        data = json.loads(FIXTURE.read_text())
        people = {row["slug"]: self._person(row) for row in data["people"]}
        spots = {row["slug"]: self._spot(row) for row in data["spots"]}
        route = self._route(people, spots)
        events = {}
        for row in data["events"]:
            event = self._event(row, people, spots)
            if event:
                events[row["slug"]] = event

        review_count = 0
        for row in data["reviews"]:
            spot = spots.get(row["spot"])
            author = people.get(row["author"])
            if not spot or not author:
                continue
            Review.objects.update_or_create(
                spot=spot,
                author=author,
                defaults={
                    "stars": row["rating"],
                    "text": row["body"],
                    "reviewed_on": row["date"],
                },
            )
            review_count += 1

        message_count = 0
        for row in data["messages"]:
            event = events.get(row["event"])
            sender = people.get(row["author"])
            if not event or not sender:
                continue
            EventMessage.objects.update_or_create(
                event=event,
                sender=sender,
                sent_local=row["at"],
                defaults={"body": row["body"]},
            )
            message_count += 1

        post_count = 0
        for row in data["gallery"]:
            owner = people.get(row["owner"])
            if not owner:
                continue
            GalleryPost.objects.update_or_create(
                owner=owner,
                title=row["title"],
                defaults={
                    "kind": row["kind"],
                    "scene": row["scene"],
                    "medium": row.get("medium") or "",
                    "caption": row.get("caption") or "",
                    "spot": spots.get(row.get("spot") or ""),
                    "event": events.get(row.get("event") or ""),
                    "likes": row.get("likes") or 0,
                    "posted_on": row["date"],
                },
            )
            post_count += 1

        hanz_routes, hanz_events = self._hanz_account(people, spots)

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {len(people)} people, {len(spots)} spots, "
                f"{(1 if route else 0) + hanz_routes} routes, "
                f"{len(events) + hanz_events} events, {review_count} reviews, "
                f"{message_count} messages, {post_count} gallery posts."
            )
        )

    def _person(self, row):
        username = row["slug"][:150]
        user, _created = User.objects.get_or_create(
            username=username,
            defaults={"email": f"{username}@seed.fuchsia.local"},
        )
        parts = row["name"].split()
        user.first_name = parts[0] if parts else ""
        user.last_name = " ".join(parts[1:])
        user.email = user.email or f"{username}@seed.fuchsia.local"
        user.set_unusable_password()
        user.save()
        profile, _created = Profile.objects.get_or_create(
            user=user,
            defaults={"auth0_id": f"seed|{username}"},
        )
        if not profile.auth0_id:
            profile.auth0_id = f"seed|{username}"
        profile.slug = username
        profile.display_name = row["name"]
        profile.handle = row["handle"]
        profile.city = row.get("city") or ""
        profile.pronouns = row.get("pronouns") or ""
        profile.bio = row.get("bio") or ""
        profile.mediums = row.get("mediums") or []
        profile.visibility = row.get("visibility") or Profile.Visibility.PUBLIC
        profile.tint = row.get("tint") or "#F1DCEE"
        profile.followers_count = row.get("followers") or 0
        profile.following_count = row.get("following") or 0
        profile.joined_on = row.get("joined") or None
        profile.save()
        return user

    def _spot(self, row):
        spot, _created = Spot.objects.update_or_create(
            slug=row["slug"],
            defaults={
                "name": row["name"],
                "description": row.get("about") or "",
                "address": row.get("address") or "",
                "city": row.get("city") or "",
                "region": row.get("region") or "",
                "tagline": row.get("tagline") or "",
                "scene": row.get("scene") or "",
                "features": row.get("features") or [],
                "latitude": row["latitude"],
                "longitude": row["longitude"],
                "distance_km": row.get("distanceKm") or 0,
                "standing_rating": row.get("rating") or 0,
                "standing_review_count": row.get("reviewCount") or 0,
                "artist_count": row.get("artistCount") or 0,
            },
        )
        return spot

    def _route(self, people, spots):
        ordered = [spots[slug] for slug in CALGARY_ROUTE_STOPS if slug in spots]
        if len(ordered) < 2:
            self.stderr.write("Skipping Calgary river loop: not enough spots")
            return None
        route, _created = Route.objects.update_or_create(
            name="Calgary river loop",
            defaults={
                "description": "Four painting stops from Fish Creek, along the reservoir, and up to Bowness.",
                "created_by": people.get("maya"),
            },
        )
        route.stops.all().delete()
        RouteStop.objects.bulk_create(
            [
                RouteStop(route=route, spot=spot, order=index)
                for index, spot in enumerate(ordered, start=1)
            ]
        )
        ChatRoom.objects.get_or_create(route=route)
        return route

    def _hanz_account(self, people, spots):
        """Routes Hanz can join, routes he planned, and past paint-outs on his account."""
        hanz = (
            User.objects.filter(
                Q(profile__display_name__iexact="Hanz Dela Cruz")
                | Q(profile__display_name__iexact="Hanz De La Cruz")
                | Q(first_name__iexact="Hanz", last_name__iexact="Dela Cruz")
                | Q(first_name__iexact="Hanz", last_name__iexact="De La Cruz")
            )
            .distinct()
            .first()
        )
        if hanz is None:
            self.stdout.write("Hanz Dela Cruz has not signed in yet — skipping his demo routes and past events.")
            return 0, 0

        owners = {**people, "hanz": hanz}
        route_count = 0
        for row in (*OPEN_ROUTES, *({**row, "owner": "hanz"} for row in HANZ_ROUTES)):
            if self._named_route(row, owners, spots, hanz):
                route_count += 1

        event_count = 0
        for row in HANZ_PAST_EVENTS:
            spot = spots.get(row["spot"])
            if spot is None:
                continue
            event, _created = Event.objects.update_or_create(
                slug=row["slug"],
                defaults={
                    "spot": spot,
                    "route": None,
                    "host": hanz,
                    "title": row["title"],
                    "description": row["description"],
                    "start_time": parse_wall_clock(row["start"]),
                    "start_local": row["start"],
                    "end_local": row["end"],
                    "badge": "Past paint-out",
                    "meeting_point": row["meetingPoint"],
                    "skill_note": "All skill levels welcome",
                    "scene": row["scene"],
                    "headline": row["headline"],
                    "kit_title": "Bring your outdoor kit",
                    "kit_body": "Whatever you like to work with, plus layers.",
                    "weather_title": "Check the forecast",
                    "weather_body": "Alberta weather turns fast.",
                    "gallery_scenes": [row["scene"], "palette", "meadow"],
                    "timezone_label": "Mountain Standard Time",
                    "listed_attendees": row["attendees"],
                    "pinned_message": "",
                    "is_past": True,
                },
            )
            Invitation.objects.update_or_create(
                event=event,
                invitee=hanz,
                defaults={
                    "invited_by": hanz,
                    "status": Invitation.Status.ACCEPTED,
                    "responded_at": timezone.now(),
                },
            )
            event_count += 1
        return route_count, event_count

    def _named_route(self, row, owners, spots, hanz):
        ordered = [spots[slug] for slug in row["stops"] if slug in spots]
        owner = owners.get(row["owner"])
        if owner is None or len(ordered) < 2:
            self.stderr.write(f"Skipping route {row['name']}")
            return None
        route, _created = Route.objects.update_or_create(
            name=row["name"],
            defaults={"description": row["description"], "created_by": owner},
        )
        route.stops.all().delete()
        RouteStop.objects.bulk_create(
            [
                RouteStop(route=route, spot=spot, order=index)
                for index, spot in enumerate(ordered, start=1)
            ]
        )
        ChatRoom.objects.get_or_create(route=route)
        # Hanz is not invited onto these. Routes he did not plan stay joinable
        # on his account. Routes he planned already count him as the host.
        for slug in row.get("joined") or ():
            person = owners.get(slug)
            if person is None or person.id in (owner.id, hanz.id):
                continue
            RouteInvite.objects.update_or_create(
                route=route,
                invitee=person,
                defaults={
                    "invited_by": owner,
                    "status": RouteInvite.Status.ACCEPTED,
                    "responded_at": timezone.now(),
                },
            )
        return route

    def _event(self, row, people, spots):
        spot = spots.get(row["spot"])
        host = people.get(row["host"])
        if not spot or not host:
            self.stderr.write(f"Skipping event {row['slug']}: missing spot or host")
            return None
        description = row.get("description") or []
        if isinstance(description, list):
            description = "\n\n".join(description)
        kit = row.get("kit") or {}
        weather = row.get("weatherNote") or {}
        event, _created = Event.objects.update_or_create(
            slug=row["slug"],
            defaults={
                "spot": spot,
                "route": None,
                "host": host,
                "title": row["title"],
                "description": description,
                "start_time": parse_wall_clock(row["start"]),
                "start_local": row["start"],
                "end_local": row.get("end") or row["start"],
                "badge": row.get("badge") or "",
                "meeting_point": row.get("meetingPoint") or "",
                "skill_note": row.get("skillNote") or "",
                "scene": row.get("scene") or spot.scene,
                "headline": row.get("headline") or row["title"],
                "kit_title": kit.get("title") or "",
                "kit_body": kit.get("body") or "",
                "weather_title": weather.get("title") or "",
                "weather_body": weather.get("body") or "",
                "gallery_scenes": row.get("gallery") or [],
                "timezone_label": row.get("timezone") or "Mountain Standard Time",
                "listed_attendees": row.get("attendees") or 0,
                "pinned_message": row.get("pinned") or "",
                "is_past": bool(row.get("past")),
            },
        )
        return event
