from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class JWTWebSocketMiddleware(BaseMiddleware):
    """
    Reads a JWT access token from the `?token=` query param and attaches
    the authenticated user to the WebSocket scope.  Falls back to
    AnonymousUser if the token is missing or invalid.
    """

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token_list = params.get("token", [])

        if token_list:
            scope["user"] = await self._get_user(token_list[0])
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)

    @database_sync_to_async
    def _get_user(self, raw_token):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            token = AccessToken(raw_token)
            return User.objects.get(id=token["user_id"])
        except (InvalidToken, TokenError, User.DoesNotExist):
            return AnonymousUser()
