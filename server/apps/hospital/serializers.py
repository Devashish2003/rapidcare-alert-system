from rest_framework import serializers

from .models import (
    Hospital, Department, BloodInventory, Equipment,
    EmergencyAlert, PatientReferral
)


class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = '__all__'


class HospitalSignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = Hospital
        fields = [
            'name', 'address', 'phone', 'bed_capacity',
            'emergency_contact', 'admin_email',
            'password', 'password_confirm',
            'latitude', 'longitude'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')

        hospital = Hospital.objects.create(**validated_data)

        from django.contrib.auth import get_user_model
        import uuid
        User = get_user_model()

        admin_user = User.objects.create_user(
            username=validated_data['admin_email'],
            email=validated_data['admin_email'],
            password=password,
            phone_number=f"HOSP-{uuid.uuid4().hex[:10]}",
            first_name='Hospital',
            last_name='Administrator',
            role='FRONT_DESK',
        )
        admin_user.profile.hospital = hospital
        admin_user.profile.save()

        return hospital


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'


class BloodInventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BloodInventory
        fields = '__all__'


class EquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = '__all__'


class EmergencyAlertSerializer(serializers.ModelSerializer):
    receiving_hospital_name = serializers.CharField(source='receiving_hospital.name', read_only=True)
    time = serializers.SerializerMethodField()

    class Meta:
        model = EmergencyAlert
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'acknowledged_at', 'acknowledged_by']

    def get_time(self, obj):
        from django.utils import timezone
        import datetime

        if obj.created_at:
            now = timezone.now()
            diff = now - obj.created_at

            if diff < datetime.timedelta(minutes=1):
                return "Just now"
            elif diff < datetime.timedelta(hours=1):
                return f"{diff.seconds // 60} mins ago"
            elif diff < datetime.timedelta(days=1):
                return f"{diff.seconds // 3600} hours ago"
            else:
                return f"{diff.days} days ago"
        return "Unknown"


class PatientReferralSerializer(serializers.ModelSerializer):
    referring_hospital_name = serializers.CharField(source='referring_hospital.name', read_only=True)
    receiving_hospital_name = serializers.CharField(source='receiving_hospital.name', read_only=True)
    documents_count = serializers.SerializerMethodField()
    attachments = serializers.SerializerMethodField()

    class Meta:
        model = PatientReferral
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'accepted_at', 'accepted_by']

    def get_documents_count(self, obj):
        return obj.attachments.count()

    def get_attachments(self, obj):
        from apps.uploads.serializers import MediaUploadSerializer
        return MediaUploadSerializer(
            obj.attachments.all(), many=True,
            context=self.context,
        ).data


class DashboardStatsSerializer(serializers.Serializer):
    active_alerts = serializers.IntegerField()
    available_beds = serializers.IntegerField()
    doctors_on_duty = serializers.IntegerField()
    todays_emergencies = serializers.IntegerField()
    high_priority_alerts = serializers.IntegerField()
    medium_priority_alerts = serializers.IntegerField()
    low_priority_alerts = serializers.IntegerField()


class DepartmentStatusSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['name', 'available_beds', 'doctors_on_duty', 'status']

    def get_status(self, obj):
        if not obj.is_active:
            return "Inactive"
        elif obj.available_beds <= 2:
            return "Limited"
        else:
            return "Active"
