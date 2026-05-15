from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AmbulanceViewSet, EmergencyViewSet, LocationUpdateViewSet

router = DefaultRouter()
router.register(r'ambulances', AmbulanceViewSet, basename='ambulance')
router.register(r'emergencies', EmergencyViewSet, basename='emergency')
router.register(r'location-updates', LocationUpdateViewSet, basename='locationupdate')

urlpatterns = [
    path('', include(router.urls)),
]
