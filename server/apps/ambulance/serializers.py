from rest_framework import serializers

from apps.hospital.serializers import HospitalSerializer
from apps.users.serializers import UserSerializer
from .models import Ambulance, Emergency, LocationUpdate


class AmbulanceSerializer(serializers.ModelSerializer):
    driver = UserSerializer(read_only=True)
    driver_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Ambulance
        fields = [
            'id', 'unit_number', 'driver', 'driver_id', 'status',
            'current_location_lat', 'current_location_lng',
            'last_location_update', 'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'last_location_update', 'created_at', 'updated_at']


class EmergencySerializer(serializers.ModelSerializer):
    ambulance = AmbulanceSerializer(read_only=True)
    ambulance_id = serializers.IntegerField(write_only=True)
    assigned_hospital = HospitalSerializer(read_only=True)
    assigned_hospital_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    backup_hospital = HospitalSerializer(read_only=True)
    backup_hospital_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    voice_note_url = serializers.SerializerMethodField()
    patient_photo_url = serializers.SerializerMethodField()
    alert_status = serializers.SerializerMethodField()
    live_distance = serializers.SerializerMethodField()
    live_eta = serializers.SerializerMethodField()

    class Meta:
        model = Emergency
        fields = [
            'id', 'patient_name', 'patient_age', 'patient_gender', 'blood_type',
            'condition_description', 'severity', 'is_diabetic', 'is_hypertensive',
            'other_medical_history', 'ambulance', 'ambulance_id',
            'assigned_hospital', 'assigned_hospital_id',
            'backup_hospital', 'backup_hospital_id',
            'pickup_location_lat', 'pickup_location_lng', 'pickup_address',
            'eta_to_hospital', 'distance_to_hospital', 'status',
            'alert_status', 'live_distance', 'live_eta',
            'voice_note_url', 'patient_photo_url', 'notes',
            'created_at', 'updated_at', 'completed_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'completed_at']

    def get_voice_note_url(self, obj):
        request = self.context.get('request')
        if obj.voice_note:
            return request.build_absolute_uri(obj.voice_note.url) if request else obj.voice_note.url
        return None

    def get_patient_photo_url(self, obj):
        request = self.context.get('request')
        if obj.patient_photo:
            return request.build_absolute_uri(obj.patient_photo.url) if request else obj.patient_photo.url
        return None

    def get_alert_status(self, obj):
        # Pre-computed by the dashboard view to avoid N+1 queries
        return getattr(obj, '_alert_status', None)

    def get_live_distance(self, obj):
        return getattr(obj, '_live_distance', None)

    def get_live_eta(self, obj):
        return getattr(obj, '_live_eta', None)


class EmergencyCreateSerializer(serializers.ModelSerializer):
    # voice_note and patient_photo are uploaded separately via /api/uploads/
    class Meta:
        model = Emergency
        fields = [
            'patient_name', 'patient_age', 'patient_gender', 'blood_type',
            'condition_description', 'severity', 'is_diabetic', 'is_hypertensive',
            'other_medical_history', 'ambulance_id', 'assigned_hospital_id',
            'backup_hospital_id', 'pickup_location_lat', 'pickup_location_lng',
            'pickup_address', 'notes',
        ]


class LocationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocationUpdate
        fields = ['id', 'ambulance', 'latitude', 'longitude', 'address', 'speed', 'heading', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class AmbulanceDashboardSerializer(serializers.Serializer):
    ambulance = AmbulanceSerializer()
    active_emergencies = EmergencySerializer(many=True)
    recent_emergencies = EmergencySerializer(many=True)
    nearby_hospitals = HospitalSerializer(many=True)
    stats = serializers.DictField()
