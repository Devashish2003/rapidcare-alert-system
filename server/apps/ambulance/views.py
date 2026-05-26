import uuid
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.hospital.models import Hospital, Department, BloodInventory, Equipment
from .models import Ambulance, Emergency, LocationUpdate
from .serializers import (
    AmbulanceSerializer, EmergencySerializer, EmergencyCreateSerializer,
    LocationUpdateSerializer, AmbulanceDashboardSerializer
)

User = get_user_model()


class AmbulanceViewSet(viewsets.ModelViewSet):
    serializer_class = AmbulanceSerializer
    permission_classes = [IsAuthenticated]

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

            # Get active emergencies
            active_emergencies = Emergency.objects.filter(
                ambulance=ambulance,
                status__in=['pending', 'en_route', 'at_hospital']
            ).order_by('-created_at')

            # Get recent completed emergencies (last 24 hours)
            recent_emergencies = Emergency.objects.filter(
                ambulance=ambulance,
                status='completed',
                completed_at__gte=timezone.now() - timedelta(days=1)
            ).order_by('-completed_at')

            # Get nearby hospitals based on ambulance location
            nearby_hospitals = []
            if ambulance.current_location_lat and ambulance.current_location_lng:
                ambulance_location = (ambulance.current_location_lat, ambulance.current_location_lng)
                
                hospitals = Hospital.objects.filter(is_active=True)
                for hospital in hospitals:
                    # Use hospital address as approximate location (in production, use actual coordinates)
                    # For now, we'll return all active hospitals
                    nearby_hospitals.append(hospital)

            # Calculate stats
            today_emergencies = Emergency.objects.filter(
                ambulance=ambulance,
                created_at__date=timezone.now().date()
            ).count()

            stats = {
                'status': ambulance.get_status_display(),
                'active_emergencies': active_emergencies.count(),
                'today_emergencies': today_emergencies,
                'nearby_hospitals': len(nearby_hospitals),
                'average_response_time': '12m'  # Calculate from actual data in production
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
    permission_classes = [IsAuthenticated]

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
        """Recommend hospitals based on ambulance location and patient condition"""
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        severity = request.query_params.get('severity', 'medium')
        blood_type = request.query_params.get('blood_type')
        
        if not lat or not lng:
            return Response(
                {'error': 'Latitude and longitude are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ambulance_location = (float(lat), float(lng))
        hospitals = Hospital.objects.filter(is_active=True)
        
        recommendations = []
        for hospital in hospitals:
            # Calculate score based on various factors
            score = 100
            
            # Check bed availability
            total_beds = Department.objects.filter(hospital=hospital).aggregate(
                total=Count('total_beds'),
                available=Count('available_beds')
            )
            
            if total_beds['available'] and total_beds['total']:
                bed_ratio = total_beds['available'] / total_beds['total']
                score += bed_ratio * 20
            
            # Check blood availability if blood type specified
            if blood_type:
                try:
                    blood_inventory = BloodInventory.objects.get(
                        hospital=hospital,
                        blood_type=blood_type
                    )
                    if blood_inventory.units_available > 0:
                        score += 15
                except BloodInventory.DoesNotExist:
                    score -= 10
            
            # Check equipment based on severity
            if severity in ['high', 'critical']:
                critical_equipment = Equipment.objects.filter(
                    hospital=hospital,
                    equipment_type__in=['ventilators', 'defibrillators'],
                    available_count__gt=0
                ).count()
                score += critical_equipment * 5
            
            # For now, use a random distance (in production, use actual geolocation)
            distance = 5.0  # placeholder
            
            recommendations.append({
                'hospital': {
                    'id': hospital.id,
                    'name': hospital.name,
                    'address': hospital.address,
                    'phone': hospital.phone,
                    'bed_capacity': hospital.bed_capacity
                },
                'score': score,
                'distance': distance,
                'eta': f"{int(distance * 3)} mins",  # Rough estimate
                'available_beds': total_beds.get('available', 0)
            })
        
        # Sort by score
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        
        return Response({
            'recommendations': recommendations[:5],  # Top 5 recommendations
            'current_location': {'lat': lat, 'lng': lng}
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
            emergency.assigned_hospital = hospital
        
        emergency.save()
        
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
