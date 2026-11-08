"""Auth0 access-token (JWT) authentication for DRF."""

from __future__ import annotations

import re

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from rest_framework import authentication, exceptions

from .models import Profile

User = get_user_model()

_jwks_client: jwt.PyJWKClient | None = None

# Auth0 will not put OIDC profile claims on an API access token unless a
# Post Login Action copies them under a namespace.
CLAIM_NAMESPACE = "https://api.fuchsiaforks.com/"
_SUBJECT_NAME = re.compile(
    r"^(google-oauth2|auth0|github|facebook|apple|windowslive)[.|]"
)


def get_jwks_client() -> jwt.PyJWKClient:
    """Reuse one PyJWKClient so JWKS responses stay cached in-process."""
    global _jwks_client
    if _jwks_client is None:
        domain = getattr(settings, "AUTH0_DOMAIN", "") or ""
        if not domain:
            raise exceptions.AuthenticationFailed("Auth0 is not configured.")
        _jwks_client = jwt.PyJWKClient(
            f"https://{domain}/.well-known/jwks.json",
            cache_keys=True,
        )
    return _jwks_client


def username_from_sub(sub: str) -> str:
    """Map Auth0 `sub` to a Django username (max 150 chars)."""
    return sub.replace("|", ".")[:150]


def claim(payload: dict, key: str) -> str:
    """Read a profile claim, preferring the namespaced copy from a Post Login Action."""
    value = payload.get(f"{CLAIM_NAMESPACE}{key}")
    if value is None or str(value).strip() == "":
        value = payload.get(key)
    return str(value or "").strip()


def looks_like_subject(value: str) -> bool:
    """True when a stored name is still the Auth0 subject, not a person's name."""
    return bool(_SUBJECT_NAME.match((value or "").strip()))


def person_name_from_payload(payload: dict) -> str:
    """Google account name from given/family name, then the name claim."""
    given = claim(payload, "given_name")
    family = claim(payload, "family_name")
    full = " ".join(part for part in (given, family) if part).strip()
    name = full or claim(payload, "name")
    if looks_like_subject(name) or "@" in name:
        return ""
    return name


def apply_token_identity(user: User, payload: dict) -> User:
    """Fill a blank or subject-id profile from the access token. Keep a chosen name."""
    profile = user.profile
    name = person_name_from_payload(payload)
    email = claim(payload, "email")
    nickname = claim(payload, "nickname")
    user_changed = False
    profile_changed = False

    if name and (not profile.display_name or looks_like_subject(profile.display_name)):
        profile.display_name = name[:120]
        parts = name.split()
        user.first_name = parts[0][:150]
        user.last_name = " ".join(parts[1:])[:150]
        user_changed = True
        profile_changed = True
    if email and not user.email:
        user.email = email
        user_changed = True
    if nickname and not looks_like_subject(nickname) and (
        not profile.handle or looks_like_subject(profile.handle)
    ):
        profile.handle = nickname[:40]
        profile_changed = True

    if user_changed:
        user.save()
    if profile_changed:
        profile.save()
    return user


def get_or_create_user_from_payload(payload: dict) -> User:
    """Shadow Django User + Profile keyed on the token `sub` claim."""
    sub = payload.get("sub")
    if not sub:
        raise exceptions.AuthenticationFailed("Token is missing the sub claim.")

    try:
        user = Profile.objects.select_related("user").get(auth0_id=sub).user
    except Profile.DoesNotExist:
        user = None

    if user is not None:
        return apply_token_identity(user, payload)

    username = username_from_sub(sub)
    email = claim(payload, "email")
    name = person_name_from_payload(payload)
    nickname = claim(payload, "nickname")
    if looks_like_subject(nickname):
        nickname = ""

    try:
        with transaction.atomic():
            user = User(username=username, email=email)
            if name:
                parts = name.split()
                user.first_name = parts[0][:150]
                user.last_name = " ".join(parts[1:])[:150]
            user.set_unusable_password()
            user.save()
            Profile.objects.create(
                user=user,
                auth0_id=sub,
                display_name=name[:120],
                handle=(nickname or username)[:40],
            )
            return user
    except IntegrityError:
        # Concurrent first login — another request created the row.
        user = Profile.objects.select_related("user").get(auth0_id=sub).user
        return apply_token_identity(user, payload)


class Auth0JWTAuthentication(authentication.BaseAuthentication):
    """
    Validate Auth0 RS256 access tokens and map `sub` to a local User.

    Returns None when no Authorization header is present so other
    authenticators (Session) can still run for the browsable API.
    """

    keyword = "Bearer"

    def authenticate(self, request):
        auth = authentication.get_authorization_header(request).split()
        if not auth:
            return None
        if auth[0].lower() != self.keyword.lower().encode():
            return None
        if len(auth) == 1:
            raise exceptions.AuthenticationFailed("Invalid Authorization header.")
        if len(auth) > 2:
            raise exceptions.AuthenticationFailed("Invalid Authorization header.")

        token = auth[1].decode("utf-8")
        payload = self._decode_token(token)
        user = get_or_create_user_from_payload(payload)
        return (user, payload)

    def authenticate_header(self, request):
        # Makes DRF return 401 (not 403) when IsAuthenticated fails with no credentials.
        return self.keyword

    def _decode_token(self, token: str) -> dict:
        audience = getattr(settings, "AUTH0_API_AUDIENCE", "") or ""
        issuer = getattr(settings, "AUTH0_ISSUER", "") or ""
        if not audience or not issuer:
            raise exceptions.AuthenticationFailed("Auth0 is not configured.")

        try:
            signing_key = get_jwks_client().get_signing_key_from_jwt(token)
            return jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=audience,
                issuer=issuer,
            )
        except jwt.ExpiredSignatureError as exc:
            raise exceptions.AuthenticationFailed("Token has expired.") from exc
        except jwt.InvalidAudienceError as exc:
            raise exceptions.AuthenticationFailed("Invalid token audience.") from exc
        except jwt.InvalidIssuerError as exc:
            raise exceptions.AuthenticationFailed("Invalid token issuer.") from exc
        except jwt.PyJWTError as exc:
            raise exceptions.AuthenticationFailed(f"Invalid token: {exc}") from exc
