from django.contrib.auth import get_user_model
from django.db import models
from apps.hospital.models import Hospital

User = get_user_model()


class Ambulance(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('on_duty', 'On Duty'),
        ('maintenance', 'Under Maintenance'),
        ('offline', 'Offline'),
    ]

    unit_number = models.CharField(max_length=20, unique=True)
    driver = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='ambulances')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    current_location_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    current_location_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    last_location_update = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Unit {self.unit_number} - {self.get_status_display()}"


class Emergency(models.Model):
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('en_route', 'En Route'),
        ('at_hospital', 'At Hospital'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    # Patient information
    patient_name = models.CharField(max_length=200)
    patient_age = models.PositiveIntegerField()
    patient_gender = models.CharField(max_length=10)
    blood_type = models.CharField(max_length=5, null=True, blank=True)
    condition_description = models.TextField()
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
    
    # Medical history
    is_diabetic = models.BooleanField(default=False)
    is_hypertensive = models.BooleanField(default=False)
    other_medical_history = models.TextField(blank=True)
    
    # Emergency details
    ambulance = models.ForeignKey(Ambulance, on_delete=models.CASCADE, related_name='emergencies')
    assigned_hospital = models.ForeignKey(Hospital, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_emergencies')
    backup_hospital = models.ForeignKey(Hospital, on_delete=models.SET_NULL, null=True, blank=True, related_name='backup_emergencies')
    
    # Location and timing
    pickup_location_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    pickup_location_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    pickup_address = models.TextField(blank=True)
    eta_to_hospital = models.CharField(max_length=50, null=True, blank=True)
    distance_to_hospital = models.CharField(max_length=50, null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Additional info
    voice_note_url = models.URLField(blank=True)
    notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.patient_name} - {self.get_severity_display()} severity"


class LocationUpdate(models.Model):
    ambulance = models.ForeignKey(Ambulance, on_delete=models.CASCADE, related_name='location_updates')
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    address = models.TextField(blank=True)
    speed = models.FloatField(null=True, blank=True, help_text="Speed in km/h")
    heading = models.FloatField(null=True, blank=True, help_text="Heading in degrees")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Location Update'
        verbose_name_plural = 'Location Updates'

    def __str__(self):
        return f"{self.ambulance.unit_number} at {self.timestamp}"
