from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User, UserProfile, UserDevice, UserSession


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'username', 'first_name', 'last_name', 'role', 'is_verified', 'is_active']
    list_filter = ['role', 'is_verified', 'is_active', 'is_staff', 'is_superuser']
    search_fields = ['email', 'username', 'first_name', 'last_name', 'phone_number']
    ordering = ['email']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('phone_number', 'role', 'is_verified', 'profile_picture')}),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('email', 'phone_number', 'role')}),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'license_number', 'ambulance_id', 'department', 'is_on_duty']
    list_filter = ['is_on_duty', 'department']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'license_number', 'ambulance_id']


@admin.register(UserDevice)
class UserDeviceAdmin(admin.ModelAdmin):
    list_display = ['user', 'device_type', 'is_active', 'created_at', 'last_used']
    list_filter = ['device_type', 'is_active']
    search_fields = ['user__email', 'device_token']


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'ip_address', 'is_active', 'created_at', 'expires_at']
    list_filter = ['is_active']
    search_fields = ['user__email', 'ip_address', 'session_key']
