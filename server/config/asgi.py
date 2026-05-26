import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Must call get_asgi_application() before importing channels/consumers
# so that Django apps are fully loaded first.
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402
from apps.users.ws_auth import JWTWebSocketMiddleware  # noqa: E402
import apps.hospital.routing  # noqa: E402
import apps.ambulance.routing  # noqa: E402

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTWebSocketMiddleware(
        URLRouter(
            apps.hospital.routing.websocket_urlpatterns +
            apps.ambulance.routing.websocket_urlpatterns
        )
    ),
})
