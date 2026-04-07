from django.contrib import admin

from .models import (
    Hospital, Department, BloodInventory, Equipment,
    EmergencyAlert, PatientReferral
)


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'phone', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'email', 'phone']


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'hospital', 'available_beds', 'total_beds', 'doctors_on_duty', 'is_active']
    list_filter = ['hospital', 'is_active', 'created_at']
    search_fields = ['name', 'hospital__name']


@admin.register(BloodInventory)
class BloodInventoryAdmin(admin.ModelAdmin):
    list_display = ['hospital', 'blood_type', 'units_available', 'last_updated']
    list_filter = ['blood_type', 'hospital', 'last_updated']
    search_fields = ['hospital__name']


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ['hospital', 'equipment_type', 'is_available', 'available_count', 'total_count', 'last_updated']
    list_filter = ['equipment_type', 'is_available', 'hospital', 'last_updated']
    search_fields = ['hospital__name']


@admin.register(EmergencyAlert)
class EmergencyAlertAdmin(admin.ModelAdmin):
    list_display = ['patient_name', 'priority', 'status', 'receiving_hospital', 'created_at']
    list_filter = ['priority', 'status', 'receiving_hospital', 'created_at']
    search_fields = ['patient_name', 'case_description', 'ambulance_id']
    readonly_fields = ['created_at', 'updated_at', 'acknowledged_at', 'acknowledged_by']


@admin.register(PatientReferral)
class PatientReferralAdmin(admin.ModelAdmin):
    list_display = ['patient_name', 'referring_hospital', 'receiving_hospital', 'required_specialty', 'status',
                    'created_at']
    list_filter = ['status', 'required_specialty', 'referring_hospital', 'receiving_hospital', 'created_at']
    search_fields = ['patient_name', 'current_diagnosis', 'reason_for_referral']
    readonly_fields = ['created_at', 'updated_at', 'accepted_at', 'accepted_by']
