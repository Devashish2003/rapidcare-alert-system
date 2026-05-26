from django.contrib import admin

from .models import Ambulance, Emergency, LocationUpdate


@admin.register(Ambulance)
class AmbulanceAdmin(admin.ModelAdmin):
    list_display = ('unit_number', 'driver', 'status', 'is_active', 'last_location_update', 'created_at')
    list_filter = ('status', 'is_active')
    search_fields = ('unit_number', 'driver__email', 'driver__phone_number')
    readonly_fields = ('last_location_update', 'created_at', 'updated_at')
    raw_id_fields = ('driver',)


@admin.register(Emergency)
class EmergencyAdmin(admin.ModelAdmin):
    list_display = ('patient_name', 'severity', 'status', 'ambulance', 'assigned_hospital', 'created_at')
    list_filter = ('severity', 'status', 'patient_gender')
    search_fields = ('patient_name', 'ambulance__unit_number', 'assigned_hospital__name', 'pickup_address')
    readonly_fields = ('created_at', 'updated_at', 'completed_at')
    raw_id_fields = ('ambulance', 'assigned_hospital', 'backup_hospital')
    fieldsets = (
        ('Patient Info', {
            'fields': ('patient_name', 'patient_age', 'patient_gender', 'blood_type',
                       'condition_description', 'severity')
        }),
        ('Medical History', {
            'fields': ('is_diabetic', 'is_hypertensive', 'other_medical_history')
        }),
        ('Emergency Details', {
            'fields': ('ambulance', 'assigned_hospital', 'backup_hospital', 'status',
                       'pickup_location_lat', 'pickup_location_lng', 'pickup_address',
                       'eta_to_hospital', 'distance_to_hospital')
        }),
        ('Additional', {
            'fields': ('voice_note_url', 'notes', 'created_at', 'updated_at', 'completed_at')
        }),
    )


@admin.register(LocationUpdate)
class LocationUpdateAdmin(admin.ModelAdmin):
    list_display = ('ambulance', 'latitude', 'longitude', 'speed', 'heading', 'timestamp')
    list_filter = ('ambulance__status',)
    search_fields = ('ambulance__unit_number', 'address')
    readonly_fields = ('timestamp',)
    raw_id_fields = ('ambulance',)
