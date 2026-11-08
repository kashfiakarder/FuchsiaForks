# FuchsiaForks

Django REST API for spots, routes, events, invitations, and photo galleries.

## Layout

```
apps/
  users/     # Profile (+ shared UserSerializer)
  spots/     # Spot, Review
  routes/    # Route, RouteStop, ChatRoom, ChatMessage
  events/    # Event, Invitation, EventPhoto
api/         # Aggregates all app URL routers under /api/
config/      # Django project settings
```

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py createsuperuser
python manage.py runserver
```

API root: http://127.0.0.1:8000/api/  
Admin: http://127.0.0.1:8000/admin/

## Endpoints

| Resource | Path |
|---|---|
| Profiles | `/api/profiles/` |
| Spots | `/api/spots/` |
| Reviews | `/api/reviews/` |
| Routes | `/api/routes/` |
| Chat rooms | `/api/chat-rooms/` |
| Chat messages | `/api/chat-messages/` |
| Events | `/api/events/` |
| Invitations | `/api/invitations/` |
| Event photos | `/api/event-photos/` |

### Useful actions

- `POST /api/events/{id}/invite/` — invite a user (`invitee_id`)
- `POST /api/invitations/{id}/respond/` — `{ "status": "accepted" | "declined" }`
- `POST /api/invitations/{id}/complete/` — requires an uploaded photo
- `GET /api/bootstrap/` — signed-in catalog in the shape the screens render (people, spots, events, reviews, event chat, galleries, saves, joins)
- `PATCH /api/profiles/me/` — update the signed-in profile (`name`, `bio`, `pronouns`, `city`, `mediums`, `visibility`, `handle`)
- `POST /api/events/` with `spotId`, `start`, and `end` — create a paint-out and join it
- `POST /api/events/{id}/join/` and `/leave/` — attend or leave
- `POST /api/events/{id}/messages/` — post to that event's chat
- `POST /api/spots/{id}/save/` — toggle a saved spot
- `POST /api/spots/{id}/reviews/` — `{ "rating", "body" }`
- `GET|POST /api/gallery-posts/` and `DELETE /api/gallery-posts/{id}/` — profile gallery
- `GET|POST /api/chat-rooms/{id}/messages/` — route chat, separate from event chat

### Auth

- Access tokens: send `Authorization: Bearer <Auth0 access token>` (audience = your Auth0 API identifier).
- `GET /api/profiles/me/` — current user in the screen shape (requires a valid JWT; creates the shadow User + Profile on first call). `PATCH` updates it.
- Reads stay open (`AllowAny`); writes require authentication.
- Set `AUTH0_DOMAIN` and `AUTH0_API_AUDIENCE` in `.env` (see `.env.example`).
