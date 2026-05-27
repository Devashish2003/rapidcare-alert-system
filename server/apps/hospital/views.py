import logging

from django.db.models import Q, Sum
from django.utils import timezone
from rest_framework import viewsets, status, permissions, views
from rest_framework.decorators import action
from rest_framework.response import Response

logger = logging.getLogger(__name__)

from apps.users.permissions import IsHospitalStaff, IsHospitalStaffOrReadOnly
from .models import (
    Hospital, Department, BloodInventory, Equipment,
    EmergencyAlert, PatientReferral
)
from .serializers import (
    HospitalSerializer, HospitalSignupSerializer, DepartmentSerializer, BloodInventorySerializer,
    EquipmentSerializer, EmergencyAlertSerializer, PatientReferralSerializer,
    DashboardStatsSerializer, DepartmentStatusSerializer
)


def _update_emergency_status(alert, new_status):
    """Set the related Emergency's status when a hospital acknowledges."""
    from apps.ambulance.models import Ambulance, Emergency
    try:
        ambulance = Ambulance.objects.get(unit_number=alert.ambulance_id)
        emergency = Emergency.objects.filter(
            ambulance=ambulance,
            assigned_hospital=alert.receiving_hospital,
            status__in=['pending', 'en_route'],
        ).order_by('-created_at').first()
        if emergency:
            emergency.status = new_status
            emergency.save(update_fields=['status', 'updated_at'])
    except Exception:
        pass


def _reset_emergency_on_rejection(alert):
    """On rejection, set the emergency back to pending and clear assigned_hospital
    so the driver knows to select a new hospital."""
    from apps.ambulance.models import Ambulance, Emergency
    try:
        ambulance = Ambulance.objects.get(unit_number=alert.ambulance_id)
        emergency = Emergency.objects.filter(
            ambulance=ambulance,
            assigned_hospital=alert.receiving_hospital,
            status__in=['pending', 'en_route'],
        ).order_by('-created_at').first()
        if emergency:
            emergency.status = 'pending'
            emergency.assigned_hospital = None
            emergency.save(update_fields=['status', 'assigned_hospital', 'updated_at'])
    except Exception:
        pass


def _notify_ambulance(alert, event_type):
    """Push a status notification to the ambulance driver's status channel."""
    from asgiref.sync import async_to_sync
    from channels.layers import get_channel_layer
    from apps.ambulance.models import Ambulance
    try:
        ambulance = Ambulance.objects.get(unit_number=alert.ambulance_id)
        channel_layer = get_channel_layer()
        if channel_layer is None:
            logger.warning("_notify_ambulance: channel layer is None — check CHANNEL_LAYERS settings")
            return
        async_to_sync(channel_layer.group_send)(
            f"ambulance_{ambulance.id}_status",
            {
                "type": event_type,
                "data": {
                    "alert_id": alert.id,
                    "patient_name": alert.patient_name,
                    "hospital": alert.receiving_hospital.name,
                    "status": event_type.replace("alert_", ""),
                },
            }
        )
    except Ambulance.DoesNotExist:
        logger.warning(
            "_notify_ambulance: no Ambulance with unit_number=%r (alert_id=%s)",
            alert.ambulance_id, alert.id,
        )
    except Exception:
        logger.exception("_notify_ambulance: unexpected error for alert_id=%s", alert.id)


class HospitalViewSet(viewsets.ModelViewSet):
    queryset = Hospital.objects.filter(is_active=True)
    serializer_class = HospitalSerializer
    # Civilians and ambulance staff can read; only hospital staff can create/update/delete
    permission_classes = [IsHospitalStaffOrReadOnly]

    @action(detail=True, methods=['post'], permission_classes=[IsHospitalStaff])
    def setup_defaults(self, request, pk=None):
        hospital = self.get_object()

        for bt, _ in BloodInventory.BLOOD_TYPES:
            BloodInventory.objects.get_or_create(
                hospital=hospital,
                blood_type=bt,
                defaults={'units_available': 0}
            )

        for eq_type, _ in Equipment.EQUIPMENT_TYPES:
            Equipment.objects.get_or_create(
                hospital=hospital,
                equipment_type=eq_type,
                defaults={'is_available': True, 'total_count': 1, 'available_count': 1}
            )

        return Response({'message': 'Hospital defaults initialized successfully'})


class DepartmentViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentSerializer
    permission_classes = [IsHospitalStaffOrReadOnly]

    def get_queryset(self):
        hospital_id = self.request.query_params.get('hospital_id')
        if hospital_id:
            return Department.objects.filter(hospital_id=hospital_id)
        return Department.objects.all()

    @action(detail=False, methods=['get'])
    def status_summary(self, request):
        hospital_id = request.query_params.get('hospital_id')
        if not hospital_id:
            return Response({'error': 'hospital_id parameter required'}, status=status.HTTP_400_BAD_REQUEST)

        departments = Department.objects.filter(hospital_id=hospital_id)
        serializer = DepartmentStatusSerializer(departments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def update_availability(self, request, pk=None):
        department = self.get_object()
        available_beds = request.data.get('available_beds')
        doctors_on_duty = request.data.get('doctors_on_duty')
        is_active = request.data.get('is_active')

        if available_beds is not None:
            department.available_beds = available_beds
        if doctors_on_duty is not None:
            department.doctors_on_duty = doctors_on_duty
        if is_active is not None:
            department.is_active = is_active

        department.save()
        return Response(DepartmentSerializer(department).data)


class BloodInventoryViewSet(viewsets.ModelViewSet):
    serializer_class = BloodInventorySerializer
    permission_classes = [IsHospitalStaffOrReadOnly]

    def get_queryset(self):
        hospital_id = self.request.query_params.get('hospital_id')
        if hospital_id:
            return BloodInventory.objects.filter(hospital_id=hospital_id)
        return BloodInventory.objects.all()

    @action(detail=False, methods=['get'])
    def by_hospital(self, request):
        hospital_id = request.query_params.get('hospital_id')
        if not hospital_id:
            return Response({'error': 'hospital_id parameter required'}, status=status.HTTP_400_BAD_REQUEST)

        inventory = BloodInventory.objects.filter(hospital_id=hospital_id)
        serializer = self.get_serializer(inventory, many=True)
        return Response(serializer.data)


class EquipmentViewSet(viewsets.ModelViewSet):
    serializer_class = EquipmentSerializer
    permission_classes = [IsHospitalStaffOrReadOnly]

    def get_queryset(self):
        hospital_id = self.request.query_params.get('hospital_id')
        if hospital_id:
            return Equipment.objects.filter(hospital_id=hospital_id)
        return Equipment.objects.all()

    @action(detail=True, methods=['patch'])
    def toggle_availability(self, request, pk=None):
        equipment = self.get_object()
        is_available = request.data.get('is_available')

        if is_available is not None:
            equipment.is_available = is_available
            if is_available:
                equipment.available_count = equipment.total_count
            else:
                equipment.available_count = 0
            equipment.save()

        return Response(EquipmentSerializer(equipment).data)


class EmergencyAlertViewSet(viewsets.ModelViewSet):
    serializer_class = EmergencyAlertSerializer
    permission_classes = [IsHospitalStaff]

    def get_queryset(self):
        hospital_id = self.request.query_params.get('hospital_id')
        priority = self.request.query_params.get('priority')
        status_param = self.request.query_params.get('status')

        queryset = EmergencyAlert.objects.all()

        if hospital_id:
            queryset = queryset.filter(receiving_hospital_id=hospital_id)
        if priority:
            queryset = queryset.filter(priority=priority)
        if status_param:
            queryset = queryset.filter(status=status_param)

        return queryset.order_by('-created_at')

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        alert = self.get_object()

        if alert.status != 'pending':
            return Response(
                {'error': 'Only pending alerts can be acknowledged'},
                status=status.HTTP_400_BAD_REQUEST
            )

        alert.status = 'acknowledged'
        alert.acknowledged_at = timezone.now()
        alert.acknowledged_by = request.user
        alert.save()
        _update_emergency_status(alert, 'en_route')
        _notify_ambulance(alert, "alert_acknowledged")

        return Response(EmergencyAlertSerializer(alert).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        alert = self.get_object()

        if alert.status != 'pending':
            return Response(
                {'error': 'Only pending alerts can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )

        alert.status = 'rejected'
        alert.save()
        _reset_emergency_on_rejection(alert)
        _notify_ambulance(alert, "alert_rejected")

        return Response(EmergencyAlertSerializer(alert).data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        hospital_id = request.query_params.get('hospital_id')
        if not hospital_id:
            return Response({'error': 'hospital_id parameter required'}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.now().date()

        alerts = EmergencyAlert.objects.filter(receiving_hospital_id=hospital_id)

        stats = {
            'active_alerts': alerts.filter(status='pending').count(),
            'high_priority_alerts': alerts.filter(priority='high', status='pending').count(),
            'medium_priority_alerts': alerts.filter(priority='medium', status='pending').count(),
            'low_priority_alerts': alerts.filter(priority='low', status='pending').count(),
            'todays_emergencies': alerts.filter(created_at__date=today).count(),
        }

        return Response(stats)


class PatientReferralViewSet(viewsets.ModelViewSet):
    serializer_class = PatientReferralSerializer
    permission_classes = [IsHospitalStaff]

    def get_queryset(self):
        hospital_id = self.request.query_params.get('hospital_id')
        referral_type = self.request.query_params.get('type')  # 'incoming' or 'outgoing'
        status_param = self.request.query_params.get('status')

        queryset = PatientReferral.objects.all()

        if hospital_id:
            if referral_type == 'incoming':
                queryset = queryset.filter(receiving_hospital_id=hospital_id)
            elif referral_type == 'outgoing':
                queryset = queryset.filter(referring_hospital_id=hospital_id)
            else:
                queryset = queryset.filter(
                    Q(referring_hospital_id=hospital_id) | Q(receiving_hospital_id=hospital_id)
                )

        if status_param:
            queryset = queryset.filter(status=status_param)

        return queryset.order_by('-created_at')

    def create(self, request, *args, **kwargs):
        # Add the referring hospital as current user's hospital
        # This assumes we have a way to get the current user's hospital
        data = request.data.copy()

        # For now, we'll assume hospital_id is passed in the request
        # In a real implementation, you'd get this from the user profile
        if 'referring_hospital_id' not in data:
            return Response(
                {'error': 'referring_hospital_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        referral = self.get_object()

        if referral.status != 'pending':
            return Response(
                {'error': 'Only pending referrals can be accepted'},
                status=status.HTTP_400_BAD_REQUEST
            )

        referral.status = 'accepted'
        referral.accepted_at = timezone.now()
        referral.accepted_by = request.user
        referral.save()

        return Response(PatientReferralSerializer(referral).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        referral = self.get_object()

        if referral.status != 'pending':
            return Response(
                {'error': 'Only pending referrals can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )

        referral.status = 'rejected'
        referral.notes = request.data.get('notes', '')
        referral.save()

        return Response(PatientReferralSerializer(referral).data)

    @action(detail=False, methods=['get'])
    def counts(self, request):
        hospital_id = request.query_params.get('hospital_id')
        if not hospital_id:
            return Response({'error': 'hospital_id parameter required'}, status=status.HTTP_400_BAD_REQUEST)

        incoming_count = PatientReferral.objects.filter(
            receiving_hospital_id=hospital_id
        ).count()

        outgoing_count = PatientReferral.objects.filter(
            referring_hospital_id=hospital_id
        ).count()

        return Response({
            'incoming_count': incoming_count,
            'outgoing_count': outgoing_count
        })


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = None  # Dummy queryset for router registration

    @action(detail=False, methods=['get'])
    def stats(self, request):
        hospital_id = request.query_params.get('hospital_id')
        if not hospital_id:
            return Response({'error': 'hospital_id parameter required'}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.now().date()

        alerts = EmergencyAlert.objects.filter(receiving_hospital_id=hospital_id)
        active_alerts = alerts.filter(status='pending').count()
        todays_emergencies = alerts.filter(created_at__date=today).count()
        high_priority_alerts = alerts.filter(priority='high', status='pending').count()
        medium_priority_alerts = alerts.filter(priority='medium', status='pending').count()
        low_priority_alerts = alerts.filter(priority='low', status='pending').count()

        departments = Department.objects.filter(hospital_id=hospital_id, is_active=True)
        available_beds = departments.aggregate(total=Sum('available_beds'))['total'] or 0
        doctors_on_duty = departments.aggregate(total=Sum('doctors_on_duty'))['total'] or 0

        stats = {
            'active_alerts': active_alerts,
            'available_beds': available_beds,
            'doctors_on_duty': doctors_on_duty,
            'todays_emergencies': todays_emergencies,
            'high_priority_alerts': high_priority_alerts,
            'medium_priority_alerts': medium_priority_alerts,
            'low_priority_alerts': low_priority_alerts,
        }

        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recent_alerts(self, request):
        hospital_id = request.query_params.get('hospital_id')
        if not hospital_id:
            return Response({'error': 'hospital_id parameter required'}, status=status.HTTP_400_BAD_REQUEST)

        alerts = EmergencyAlert.objects.filter(
            receiving_hospital_id=hospital_id
        ).order_by('-created_at')[:5]

        serializer = EmergencyAlertSerializer(alerts, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def department_status(self, request):
        hospital_id = request.query_params.get('hospital_id')
        if not hospital_id:
            return Response({'error': 'hospital_id parameter required'}, status=status.HTTP_400_BAD_REQUEST)

        departments = Department.objects.filter(hospital_id=hospital_id)
        serializer = DepartmentStatusSerializer(departments, many=True)
        return Response(serializer.data)


class HospitalSignupView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = HospitalSignupSerializer(data=request.data)
        if serializer.is_valid():
            hospital = serializer.save()
            return Response({
                'message': 'Hospital registered successfully',
                'hospital_id': hospital.id
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
