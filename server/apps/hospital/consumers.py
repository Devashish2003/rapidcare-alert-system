import json

from channels.generic.websocket import AsyncWebsocketConsumer


class HospitalAlertsConsumer(AsyncWebsocketConsumer):
    """
    Hospital staff connect to /ws/hospital/<hospital_id>/alerts/
    They receive real-time EmergencyAlert and PatientReferral pushes.
    """

    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        self.hospital_id = self.scope["url_route"]["kwargs"]["hospital_id"]
        self.group_name = f"hospital_{self.hospital_id}_alerts"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # Clients don't send messages over this socket (read-only channel)
    async def receive(self, text_data=None, bytes_data=None):
        pass

    # ── Handlers called by channel_layer.group_send ──────────────────────────

    async def new_alert(self, event):
        """Push a new EmergencyAlert to all connected hospital clients."""
        await self.send(text_data=json.dumps({"type": "new_alert", "data": event["data"]}))

    async def alert_updated(self, event):
        """Push an alert status change (acknowledged / rejected)."""
        await self.send(text_data=json.dumps({"type": "alert_updated", "data": event["data"]}))

    async def new_referral(self, event):
        """Push a new PatientReferral to connected hospital clients."""
        await self.send(text_data=json.dumps({"type": "new_referral", "data": event["data"]}))
