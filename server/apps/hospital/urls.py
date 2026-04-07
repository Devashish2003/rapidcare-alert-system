from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    HospitalViewSet, DepartmentViewSet, BloodInventoryViewSet,
    EquipmentViewSet, EmergencyAlertViewSet, PatientReferralViewSet,
    DashboardViewSet, HospitalSignupView
)

router = DefaultRouter()
router.register(r'hospitals', HospitalViewSet, basename='hospital')
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'blood-inventory', BloodInventoryViewSet, basename='blood-inventory')
router.register(r'equipment', EquipmentViewSet, basename='equipment')
router.register(r'emergency-alerts', EmergencyAlertViewSet, basename='emergency-alert')
router.register(r'patient-referrals', PatientReferralViewSet, basename='patient-referral')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
    path('signup/', HospitalSignupView.as_view(), name='hospital-signup'),
]
