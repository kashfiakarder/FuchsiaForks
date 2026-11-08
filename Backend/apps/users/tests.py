from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.test import APIClient, APIRequestFactory

from apps.users.authentication import (
    Auth0JWTAuthentication,
    get_or_create_user_from_payload,
    username_from_sub,
)
from apps.users.models import Profile

User = get_user_model()


class UsernameFromSubTests(TestCase):
    def test_replaces_pipe(self):
        self.assertEqual(username_from_sub("auth0|abc123"), "auth0.abc123")

    def test_truncates_long_sub(self):
        long_sub = "a" * 200
        self.assertEqual(len(username_from_sub(long_sub)), 150)


@override_settings(
    AUTH0_DOMAIN="example.auth0.com",
    AUTH0_API_AUDIENCE="https://api.example.com",
    AUTH0_ISSUER="https://example.auth0.com/",
)
class GetOrCreateUserTests(TestCase):
    def test_creates_user_and_profile(self):
        user = get_or_create_user_from_payload({"sub": "auth0|new-user"})
        self.assertFalse(user.has_usable_password())
        self.assertEqual(user.profile.auth0_id, "auth0|new-user")
        self.assertEqual(User.objects.filter(username="auth0.new-user").count(), 1)

    def test_returns_existing_user(self):
        first = get_or_create_user_from_payload({"sub": "auth0|returning"})
        second = get_or_create_user_from_payload({"sub": "auth0|returning"})
        self.assertEqual(first.pk, second.pk)
        self.assertEqual(Profile.objects.filter(auth0_id="auth0|returning").count(), 1)

    def test_missing_sub_raises(self):
        with self.assertRaises(AuthenticationFailed):
            get_or_create_user_from_payload({})

    def test_stores_namespaced_google_name(self):
        user = get_or_create_user_from_payload(
            {
                "sub": "google-oauth2|113229177731986189152",
                "https://api.fuchsiaforks.com/given_name": "Hanz",
                "https://api.fuchsiaforks.com/family_name": "De La Cruz",
                "https://api.fuchsiaforks.com/email": "hanz@example.com",
            }
        )
        self.assertEqual(user.first_name, "Hanz")
        self.assertEqual(user.last_name, "De La Cruz")
        self.assertEqual(user.profile.display_name, "Hanz De La Cruz")
        self.assertEqual(user.email, "hanz@example.com")

    def test_replaces_subject_name_on_later_login(self):
        user = get_or_create_user_from_payload(
            {"sub": "google-oauth2|113229177731986189152"}
        )
        self.assertEqual(user.profile.display_name, "")
        updated = get_or_create_user_from_payload(
            {
                "sub": "google-oauth2|113229177731986189152",
                "https://api.fuchsiaforks.com/name": "Hanz De La Cruz",
            }
        )
        updated.profile.refresh_from_db()
        self.assertEqual(updated.profile.display_name, "Hanz De La Cruz")
        self.assertEqual(updated.first_name, "Hanz")

    def test_keeps_a_name_the_person_already_chose(self):
        user = get_or_create_user_from_payload(
            {
                "sub": "google-oauth2|99",
                "name": "Hanz De La Cruz",
            }
        )
        user.profile.display_name = "Studio Name"
        user.profile.save()
        get_or_create_user_from_payload(
            {
                "sub": "google-oauth2|99",
                "https://api.fuchsiaforks.com/name": "Hanz De La Cruz",
            }
        )
        user.profile.refresh_from_db()
        self.assertEqual(user.profile.display_name, "Studio Name")


@override_settings(
    AUTH0_DOMAIN="example.auth0.com",
    AUTH0_API_AUDIENCE="https://api.example.com",
    AUTH0_ISSUER="https://example.auth0.com/",
)
class Auth0JWTAuthenticationTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.auth = Auth0JWTAuthentication()
        self.client = APIClient()

    def test_no_header_returns_none(self):
        request = self.factory.get("/api/profiles/me/")
        self.assertIsNone(self.auth.authenticate(request))

    def test_valid_bearer_creates_user(self):
        request = self.factory.get(
            "/api/profiles/me/",
            HTTP_AUTHORIZATION="Bearer fake.token.value",
        )
        payload = {"sub": "auth0|jwt-user", "aud": "https://api.example.com"}

        with patch.object(Auth0JWTAuthentication, "_decode_token", return_value=payload):
            user, auth_payload = self.auth.authenticate(request)

        self.assertEqual(user.profile.auth0_id, "auth0|jwt-user")
        self.assertEqual(auth_payload["sub"], "auth0|jwt-user")

    def test_invalid_token_raises(self):
        request = self.factory.get(
            "/api/profiles/me/",
            HTTP_AUTHORIZATION="Bearer bad-token",
        )
        with patch(
            "apps.users.authentication.get_jwks_client",
            side_effect=AuthenticationFailed("Invalid token"),
        ):
            with self.assertRaises(AuthenticationFailed):
                self.auth.authenticate(request)

    def test_me_endpoint_requires_auth(self):
        response = self.client.get("/api/profiles/me/")
        self.assertEqual(response.status_code, 401)

    def test_me_endpoint_returns_profile(self):
        user = get_or_create_user_from_payload({"sub": "auth0|me-user"})
        self.client.force_authenticate(user=user)
        response = self.client.get("/api/profiles/me/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["id"], str(user.pk))
        self.assertEqual(response.data["visibility"], "public")
        self.assertEqual(user.profile.auth0_id, "auth0|me-user")
