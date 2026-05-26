from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path("ws/hospital/<int:hospital_id>/alerts/", consumers.HospitalAlertsConsumer.as_asgi()),
]
