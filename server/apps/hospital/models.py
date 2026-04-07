from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class Hospital(models.Model):
    name = models.CharField(max_length=200)
    address = models.TextField()
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    bed_capacity = models.PositiveIntegerField(default=0, help_text="Total bed capacity of the hospital")
    emergency_contact = models.CharField(max_length=200, default='', help_text="Emergency contact person name")
    admin_email = models.EmailField(default='', help_text="Primary administrator email")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Department(models.Model):
    name = models.CharField(max_length=100)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='departments')
    available_beds = models.PositiveIntegerField(default=0)
    total_beds = models.PositiveIntegerField(default=0)
    doctors_on_duty = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.hospital.name} - {self.name}"


class BloodInventory(models.Model):
    BLOOD_TYPES = [
        ('A+', 'A+'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B-', 'B-'),
        ('O+', 'O+'),
        ('O-', 'O-'),
        ('AB+', 'AB+'),
        ('AB-', 'AB-'),
    ]

    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='blood_inventory')
    blood_type = models.CharField(max_length=3, choices=BLOOD_TYPES)
    units_available = models.PositiveIntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['hospital', 'blood_type']

    def __str__(self):
        return f"{self.hospital.name} - {self.blood_type}: {self.units_available} units"


class Equipment(models.Model):
    EQUIPMENT_TYPES = [
        ('ventilators', 'Ventilators'),
        ('defibrillators', 'Defibrillators'),
        ('ct', 'CT Scanner'),
        ('mri', 'MRI Scanner'),
        ('xray', 'X-Ray Machine'),
        ('dialysis', 'Dialysis Machine'),
    ]

    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='equipment')
    equipment_type = models.CharField(max_length=20, choices=EQUIPMENT_TYPES)
    is_available = models.BooleanField(default=True)
    total_count = models.PositiveIntegerField(default=1)
    available_count = models.PositiveIntegerField(default=1)
    last_maintenance = models.DateField(null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['hospital', 'equipment_type']

    def __str__(self):
        return f"{self.hospital.name} - {self.get_equipment_type_display()}"


class EmergencyAlert(models.Model):
    PRIORITY_CHOICES = [
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('acknowledged', 'Acknowledged'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]

    patient_name = models.CharField(max_length=200)
    patient_age = models.PositiveIntegerField()
    patient_gender = models.CharField(max_length=10)
    case_description = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')

    # Location and timing
    eta = models.CharField(max_length=50, help_text="Estimated time of arrival")
    distance = models.CharField(max_length=50)
    ambulance_id = models.CharField(max_length=50)

    # Hospital assignment
    receiving_hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='emergency_alerts')

    # Metadata
    tags = models.JSONField(default=list, help_text="List of tags like ['Cardiac', 'Emergency']")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    acknowledged_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                        related_name='acknowledged_alerts')

    def __str__(self):
        return f"{self.patient_name} - {self.priority} priority"


class PatientReferral(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]

    # Patient information
    patient_name = models.CharField(max_length=200)
    patient_age = models.PositiveIntegerField()

    # Referral details
    current_diagnosis = models.TextField()
    reason_for_referral = models.TextField()
    required_specialty = models.CharField(max_length=100)
    medical_documents = models.JSONField(default=list, help_text="List of document file paths")

    # Hospitals involved
    referring_hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='outgoing_referrals')
    receiving_hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='incoming_referrals')

    # Status and metadata
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Action tracking
    accepted_at = models.DateTimeField(null=True, blank=True)
    accepted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='accepted_referrals')
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.patient_name} - {self.referring_hospital.name} to {self.receiving_hospital.name}"
