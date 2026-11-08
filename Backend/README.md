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
- `GET|POST /api/chat-rooms/{id}/messages/` — list or post chat messages

Auth0 JWT validation is not wired yet — Session/Basic auth is enabled for local development. Writes require authentication; reads are open.
