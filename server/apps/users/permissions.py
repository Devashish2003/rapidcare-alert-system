from rest_framework.permissions import BasePermission

AMBULANCE_ROLES = {'AMBULANCE_DRIVER', 'PARAMEDIC_ASSISTANT'}
HOSPITAL_ROLES = {'DOCTOR', 'PARAMEDIC_STAFF', 'FRONT_DESK'}


class IsAmbulanceStaff(BasePermission):
    """Allow access only to ambulance drivers and paramedic assistants."""
    message = "Only ambulance staff can perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in AMBULANCE_ROLES)


class IsHospitalStaff(BasePermission):
    """Allow access only to hospital staff (doctors, paramedic staff, front desk)."""
    message = "Only hospital staff can perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in HOSPITAL_ROLES)


class IsHospitalStaffOrReadOnly(BasePermission):
    """Read access for any authenticated user; write access only for hospital staff."""
    message = "Only hospital staff can modify this resource."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return request.user.role in HOSPITAL_ROLES


class IsAmbulanceStaffOrReadOnly(BasePermission):
    """Read access for any authenticated user; write access only for ambulance staff."""
    message = "Only ambulance staff can modify this resource."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return request.user.role in AMBULANCE_ROLES


class IsDoctor(BasePermission):
    """Allow access only to doctors."""
    message = "Only doctors can perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'DOCTOR')
