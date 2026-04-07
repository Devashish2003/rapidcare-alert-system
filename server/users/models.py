from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ('CIVILIAN', 'Civilian User'),
        ('AMBULANCE_DRIVER', 'Ambulance Driver'),
        ('PARAMEDIC_ASSISTANT', 'Paramedic Assistant'),
        ('DOCTOR', 'Doctor'),
        ('PARAMEDIC_STAFF', 'Paramedic Staff'),
        ('FRONT_DESK', 'Front Desk Staff'),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='CIVILIAN',
        help_text="User role in the emergency response system"
    )

    phone_number = models.CharField(
        max_length=15,
        blank=True,
        null=True,
        help_text="Contact phone number"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
