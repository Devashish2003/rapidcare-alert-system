from django.contrib import admin
from .models import MediaUpload


@admin.register(MediaUpload)
class MediaUploadAdmin(admin.ModelAdmin):
    list_display = ('original_name', 'file_type', 'uploaded_by', 'file_size_display', 'emergency', 'referral',
                    'uploaded_at')
    list_filter = ('file_type',)
    search_fields = ('original_name', 'uploaded_by__email', 'mime_type')
    readonly_fields = ('file_size', 'mime_type', 'original_name', 'uploaded_at')
    raw_id_fields = ('uploaded_by', 'emergency', 'referral')

    @admin.display(description='Size')
    def file_size_display(self, obj):
        if obj.file_size < 1024:
            return f"{obj.file_size} B"
        elif obj.file_size < 1024 * 1024:
            return f"{obj.file_size // 1024} KB"
        return f"{round(obj.file_size / 1024 / 1024, 1)} MB"
