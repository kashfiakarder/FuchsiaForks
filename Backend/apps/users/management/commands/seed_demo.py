"""Load the demo catalog the screens were designed around."""

import json
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.events.models import Event, EventMessage, GalleryPost
from apps.present import parse_wall_clock
from apps.routes.models import ChatRoom, Route, RouteStop
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

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {len(people)} people, {len(spots)} spots, {1 if route else 0} routes, "
                f"{len(events)} events, {review_count} reviews, {message_count} messages, "
                f"{post_count} gallery posts."
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
