from django.contrib.auth.models import AbstractUser
from django.db import models
#from hospitals.models import Hospital


class User(AbstractUser):
    USER_ROLES = [
        ('CIVILIAN', 'Civilian User'),
        ('AMBULANCE_DRIVER', 'Ambulance Driver'),
        ('PARAMEDIC_ASSISTANT', 'Paramedic Assistant'),
        ('DOCTOR', 'Doctor'),
        ('PARAMEDIC_STAFF', 'Paramedic Staff'),
        ('FRONT_DESK', 'Front Desk Staff'),
    ]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=USER_ROLES, default='CIVILIAN')
    phone_number = models.CharField(max_length=15, unique=True)
    is_verified = models.BooleanField(default=False)
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'phone_number', 'role']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    license_number = models.CharField(max_length=50, null=True, blank=True)
    ambulance_id = models.CharField(max_length=20, null=True, blank=True)
    hospital_id = models.IntegerField(null=True, blank=True, help_text="ID of the hospital this staff belongs to")
    department = models.CharField(max_length=100, null=True, blank=True)
    experience_years = models.PositiveIntegerField(null=True, blank=True)
    specialization = models.CharField(max_length=100, null=True, blank=True)
    is_on_duty = models.BooleanField(default=False)
    last_active = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_profiles'
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.user.get_role_display()}"


class UserDevice(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='devices')
    device_token = models.CharField(max_length=255, unique=True)
    device_type = models.CharField(max_length=20, choices=[
        ('WEB', 'Web Browser'),
        ('ANDROID', 'Android'),
        ('IOS', 'iOS'),
    ])
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_devices'
        verbose_name = 'User Device'
        verbose_name_plural = 'User Devices'


class UserSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_key = models.CharField(max_length=40, unique=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        db_table = 'user_sessions'
        verbose_name = 'User Session'
        verbose_name_plural = 'User Sessions'
