import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone


class AmbulanceLocationConsumer(AsyncWebsocketConsumer):
    """
    Ambulance driver connects to /ws/ambulance/<ambulance_id>/location/

    - Driver sends: { latitude, longitude, address, speed, heading }
    - Server saves the location to DB and broadcasts to everyone in the group
    - Hospital staff / dispatch can also join this group to watch live position
    """

    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        self.ambulance_id = self.scope["url_route"]["kwargs"]["ambulance_id"]
        self.group_name = f"ambulance_{self.ambulance_id}_location"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data or "{}")
        except json.JSONDecodeError:
            return

        lat = data.get("latitude")
        lng = data.get("longitude")
        if lat is None or lng is None:
            return

        await self._save_location(
            lat, lng,
            data.get("address", ""),
            data.get("speed"),
            data.get("heading"),
        )

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "location_update",
                "data": {
                    "ambulance_id": self.ambulance_id,
                    "latitude": lat,
                    "longitude": lng,
                    "address": data.get("address", ""),
                    "speed": data.get("speed"),
                    "heading": data.get("heading"),
                    "timestamp": timezone.now().isoformat(),
                },
            },
        )

    async def location_update(self, event):
        """Broadcast location to all group members."""
        await self.send(text_data=json.dumps(event["data"]))

    @database_sync_to_async
    def _save_location(self, lat, lng, address, speed, heading):
        from .models import Ambulance, LocationUpdate
        try:
            ambulance = Ambulance.objects.get(id=self.ambulance_id)
            ambulance.current_location_lat = lat
            ambulance.current_location_lng = lng
            ambulance.save(update_fields=["current_location_lat", "current_location_lng", "last_location_update"])
            LocationUpdate.objects.create(
                ambulance=ambulance,
                latitude=lat,
                longitude=lng,
                address=address,
                speed=speed,
                heading=heading,
            )
        except Ambulance.DoesNotExist:
            pass


class AmbulanceStatusConsumer(AsyncWebsocketConsumer):
    """
    Driver connects to /ws/ambulance/<ambulance_id>/status/
    Receives alert acknowledgement / rejection notifications from hospitals.
    """

    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        self.ambulance_id = self.scope["url_route"]["kwargs"]["ambulance_id"]
        self.group_name = f"ambulance_{self.ambulance_id}_status"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        pass

    async def alert_acknowledged(self, event):
        await self.send(text_data=json.dumps({"type": "alert_acknowledged", "data": event["data"]}))

    async def alert_rejected(self, event):
        await self.send(text_data=json.dumps({"type": "alert_rejected", "data": event["data"]}))
