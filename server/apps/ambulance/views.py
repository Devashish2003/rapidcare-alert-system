import uuid
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.hospital.models import Hospital, Department, BloodInventory, Equipment, EmergencyAlert
from apps.users.permissions import IsAmbulanceStaff
from .models import Ambulance, Emergency, LocationUpdate
from .serializers import (
    AmbulanceSerializer, EmergencySerializer, EmergencyCreateSerializer,
    LocationUpdateSerializer, AmbulanceDashboardSerializer
)
from .utils import haversine_distance, estimate_eta_minutes

User = get_user_model()


class AmbulanceViewSet(viewsets.ModelViewSet):
    serializer_class = AmbulanceSerializer
    permission_classes = [IsAmbulanceStaff]

    def get_queryset(self):
        queryset = Ambulance.objects.filter(is_active=True)
        user = self.request.user
        
        # If user is ambulance driver, show only their ambulance
        if user.role in ['AMBULANCE_DRIVER', 'PARAMEDIC_ASSISTANT']:
            queryset = queryset.filter(driver=user)
        
        return queryset

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get ambulance dashboard data including stats, active emergencies, and nearby hospitals"""
        try:
            ambulance = self.get_queryset().first()

            if not ambulance:
                if request.user.role in ['AMBULANCE_DRIVER', 'PARAMEDIC_ASSISTANT']:
                    ambulance, _ = Ambulance.objects.get_or_create(
                        driver=request.user,
                        defaults={
                            'unit_number': f"AMB-{uuid.uuid4().hex[:6].upper()}",
                            'status': 'available',
                        },
                    )
                else:
                    return Response(
                        {'error': 'No ambulance assigned to this user'},
                        status=status.HTTP_404_NOT_FOUND
                    )

            # Get active emergencies with all related data in one query
            active_emergencies = list(
                Emergency.objects.filter(
                    ambulance=ambulance,
                    status__in=['pending', 'en_route', 'at_hospital']
                ).select_related('assigned_hospital', 'backup_hospital', 'ambulance')
                .order_by('-created_at')
            )

            # Batch-fetch latest EmergencyAlert status per hospital for this ambulance
            from apps.hospital.models import EmergencyAlert
            alert_map = {}  # receiving_hospital_id → latest alert status
            for row in (
                    EmergencyAlert.objects
                            .filter(ambulance_id=ambulance.unit_number)
                            .order_by('-created_at')
                            .values('receiving_hospital_id', 'status')
            ):
                hid = row['receiving_hospital_id']
                if hid not in alert_map:  # keep latest (order is -created_at)
                    alert_map[hid] = row['status']

            # Annotate each emergency with alert_status, live_distance, live_eta
            a_lat = ambulance.current_location_lat
            a_lng = ambulance.current_location_lng
            for emergency in active_emergencies:
                hosp = emergency.assigned_hospital
                emergency._alert_status = (
                    alert_map.get(emergency.assigned_hospital_id)
                    if emergency.assigned_hospital_id else None
                )
                if hosp and a_lat and a_lng and hosp.latitude and hosp.longitude:
                    dist = haversine_distance(
                        float(a_lat), float(a_lng),
                        float(hosp.latitude), float(hosp.longitude),
                    )
                    emergency._live_distance = round(dist, 2)
                    emergency._live_eta = estimate_eta_minutes(dist)
                else:
                    emergency._live_distance = None
                    emergency._live_eta = None

            # Get recent completed emergencies (last 24 hours)
            recent_emergencies = Emergency.objects.filter(
                ambulance=ambulance,
                status='completed',
                completed_at__gte=timezone.now() - timedelta(days=1)
            ).order_by('-completed_at')

            # Get nearby hospitals based on ambulance location
            nearby_hospitals = list(Hospital.objects.filter(is_active=True)) if (a_lat and a_lng) else []

            # Calculate stats
            today_emergencies = Emergency.objects.filter(
                ambulance=ambulance,
                created_at__date=timezone.now().date()
            ).count()

            stats = {
                'status': ambulance.get_status_display(),
                'active_emergencies': len(active_emergencies),
                'today_emergencies': today_emergencies,
                'nearby_hospitals': len(nearby_hospitals),
                'average_response_time': '12m',
            }

            serializer = AmbulanceDashboardSerializer({
                'ambulance': ambulance,
                'active_emergencies': active_emergencies,
                'recent_emergencies': recent_emergencies,
                'nearby_hospitals': nearby_hospitals,
                'stats': stats
            })

            return Response(serializer.data)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def update_location(self, request, pk=None):
        """Update ambulance current location"""
        ambulance = self.get_object()
        
        lat = request.data.get('latitude')
        lng = request.data.get('longitude')
        address = request.data.get('address', '')
        
        if not lat or not lng:
            return Response(
                {'error': 'Latitude and longitude are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ambulance.current_location_lat = lat
        ambulance.current_location_lng = lng
        ambulance.save()

        # Also create a location update record
        LocationUpdate.objects.create(
            ambulance=ambulance,
            latitude=lat,
            longitude=lng,
            address=address,
            speed=request.data.get('speed'),
            heading=request.data.get('heading')
        )

        serializer = self.get_serializer(ambulance)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update ambulance status"""
        ambulance = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(Ambulance.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ambulance.status = new_status
        ambulance.save()

        serializer = self.get_serializer(ambulance)
        return Response(serializer.data)


class EmergencyViewSet(viewsets.ModelViewSet):
    serializer_class = EmergencySerializer
    permission_classes = [IsAmbulanceStaff]

    def get_queryset(self):
        queryset = Emergency.objects.all()
        user = self.request.user
        
        # Filter by ambulance if user is ambulance staff
        if user.role in ['AMBULANCE_DRIVER', 'PARAMEDIC_ASSISTANT']:
            try:
                ambulance = Ambulance.objects.get(driver=user)
                queryset = queryset.filter(ambulance=ambulance)
            except Ambulance.DoesNotExist:
                queryset = queryset.none()
        
        return queryset.order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return EmergencyCreateSerializer
        return EmergencySerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get ambulance ID from request or user's assigned ambulance
        ambulance_id = serializer.validated_data.get('ambulance_id')
        if not ambulance_id:
            user = request.user
            try:
                ambulance = Ambulance.objects.get(driver=user)
                serializer.validated_data['ambulance_id'] = ambulance.id
            except Ambulance.DoesNotExist:
                return Response(
                    {'error': 'No ambulance assigned to this user'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        self.perform_create(serializer)
        
        # Return full emergency data
        emergency = Emergency.objects.get(pk=serializer.instance.id)
        response_serializer = EmergencySerializer(emergency)
        
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def recommend_hospitals(self, request):
        """Recommend hospitals based on ambulance location and patient condition."""
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        severity = request.query_params.get('severity', 'medium')
        blood_type = request.query_params.get('blood_type')

        has_location = lat is not None and lng is not None
        if has_location:
            try:
                lat, lng = float(lat), float(lng)
            except ValueError:
                return Response({'error': 'Invalid latitude or longitude'}, status=status.HTTP_400_BAD_REQUEST)

        hospitals = Hospital.objects.filter(is_active=True)
        recommendations = []

        for hospital in hospitals:
            # --- Distance ---
            if has_location and hospital.latitude and hospital.longitude:
                distance = haversine_distance(lat, lng, hospital.latitude, hospital.longitude)
                eta = estimate_eta_minutes(distance)
                # Penalise by distance: hospitals more than 50 km away get a steep penalty
                distance_score = max(0, 50 - distance) * 2
            else:
                distance = None
                eta = 'N/A'
                distance_score = 0  # unknown location hospitals rank last

            score = distance_score

            # --- Bed availability ---
            from django.db.models import Sum
            bed_stats = Department.objects.filter(hospital=hospital).aggregate(
                total=Sum('total_beds'),
                available=Sum('available_beds'),
            )
            available_beds = bed_stats['available'] or 0
            total_beds = bed_stats['total'] or 0
            if total_beds > 0:
                score += (available_beds / total_beds) * 30

            # --- Blood availability ---
            if blood_type:
                try:
                    inv = BloodInventory.objects.get(hospital=hospital, blood_type=blood_type)
                    if inv.units_available > 0:
                        score += 15
                except BloodInventory.DoesNotExist:
                    score -= 10

            # --- Critical equipment for high/critical severity ---
            if severity in ['high', 'critical']:
                critical_count = Equipment.objects.filter(
                    hospital=hospital,
                    equipment_type__in=['ventilators', 'defibrillators', 'icu_monitor'],
                    available_count__gt=0,
                ).count()
                score += critical_count * 5

            recommendations.append({
                'hospital': {
                    'id': hospital.id,
                    'name': hospital.name,
                    'address': hospital.address,
                    'phone': hospital.phone,
                    'bed_capacity': hospital.bed_capacity,
                    'latitude': str(hospital.latitude) if hospital.latitude else None,
                    'longitude': str(hospital.longitude) if hospital.longitude else None,
                },
                'score': round(score, 1),
                'distance': distance,
                'eta': eta,
                'available_beds': available_beds,
            })

        recommendations.sort(key=lambda x: x['score'], reverse=True)

        return Response({
            'recommendations': recommendations[:5],
            'current_location': {'lat': lat, 'lng': lng} if has_location else None,
        })

    @action(detail=True, methods=['post'])
    def assign_hospital(self, request, pk=None):
        """Assign or change hospital for an emergency"""
        emergency = self.get_object()
        hospital_id = request.data.get('hospital_id')
        is_backup = request.data.get('is_backup', False)
        
        if not hospital_id:
            return Response(
                {'error': 'Hospital ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            hospital = Hospital.objects.get(id=hospital_id, is_active=True)
        except Hospital.DoesNotExist:
            return Response(
                {'error': 'Hospital not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if is_backup:
            emergency.backup_hospital = hospital
        else:
            # Cancel any pending alerts for the previously assigned hospital
            if emergency.assigned_hospital and emergency.assigned_hospital_id != hospital.id:
                EmergencyAlert.objects.filter(
                    ambulance_id=emergency.ambulance.unit_number,
                    receiving_hospital=emergency.assigned_hospital,
                    status='pending',
                ).update(status='completed')

            emergency.assigned_hospital = hospital

        # Persist ETA and distance if the frontend passed them (from recommend_hospitals)
        update_fields = []
        eta_value = request.data.get('eta')
        distance_value = request.data.get('distance')
        if eta_value:
            emergency.eta_to_hospital = str(eta_value)
            update_fields.append('eta_to_hospital')
        if distance_value:
            emergency.distance_to_hospital = str(distance_value)
            update_fields.append('distance_to_hospital')

        if is_backup:
            emergency.save(update_fields=['backup_hospital'] + update_fields + ['updated_at'])
        else:
            emergency.save(update_fields=['assigned_hospital'] + update_fields + ['updated_at'])

        if not is_backup:
            severity_to_priority = {'critical': 'high', 'high': 'high', 'medium': 'medium', 'low': 'low'}
            priority = severity_to_priority.get(emergency.severity, 'medium')

            tags = []
            if emergency.severity in ['high', 'critical']:
                tags.append('Critical')
            if emergency.is_diabetic:
                tags.append('Diabetic')
            if emergency.is_hypertensive:
                tags.append('Hypertensive')
            if emergency.blood_type:
                tags.append(f'Blood: {emergency.blood_type}')

            EmergencyAlert.objects.create(
                patient_name=emergency.patient_name,
                patient_age=emergency.patient_age,
                patient_gender=emergency.patient_gender,
                case_description=emergency.condition_description,
                priority=priority,
                eta=emergency.eta_to_hospital or 'N/A',
                distance=emergency.distance_to_hospital or 'N/A',
                ambulance_id=emergency.ambulance.unit_number,
                receiving_hospital=hospital,
                emergency=emergency,
                tags=tags,
            )

        serializer = self.get_serializer(emergency)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update emergency status"""
        emergency = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(Emergency.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        emergency.status = new_status
        
        if new_status == 'completed':
            emergency.completed_at = timezone.now()
        
        emergency.save()
        
        serializer = self.get_serializer(emergency)
        return Response(serializer.data)


class LocationUpdateViewSet(viewsets.ModelViewSet):
    serializer_class = LocationUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = LocationUpdate.objects.all()
        ambulance_id = self.request.query_params.get('ambulance')
        
        if ambulance_id:
            queryset = queryset.filter(ambulance_id=ambulance_id)
        
        # Filter by user's ambulance if user is ambulance staff
        user = self.request.user
        if user.role in ['AMBULANCE_DRIVER', 'PARAMEDIC_ASSISTANT']:
            try:
                ambulance = Ambulance.objects.get(driver=user)
                queryset = queryset.filter(ambulance=ambulance)
            except Ambulance.DoesNotExist:
                queryset = queryset.none()
        
        return queryset.order_by('-timestamp')
