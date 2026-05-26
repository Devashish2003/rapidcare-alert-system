from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path("ws/ambulance/<int:ambulance_id>/location/", consumers.AmbulanceLocationConsumer.as_asgi()),
]
