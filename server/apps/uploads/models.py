import os

from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()

VOICE_NOTE = 'voice_note'
MEDICAL_DOCUMENT = 'medical_document'
PATIENT_PHOTO = 'patient_photo'

FILE_TYPES = [
    (VOICE_NOTE, 'Voice Note'),
    (MEDICAL_DOCUMENT, 'Medical Document'),
    (PATIENT_PHOTO, 'Patient Photo'),
]

ALLOWED_MIME_TYPES = {
    VOICE_NOTE: {'audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/mpeg', 'audio/x-m4a'},
    MEDICAL_DOCUMENT: {'application/pdf', 'image/jpeg', 'image/png', 'image/jpg'},
    PATIENT_PHOTO: {'image/jpeg', 'image/png', 'image/jpg'},
}

MAX_SIZES = {  # bytes
    VOICE_NOTE: 10 * 1024 * 1024,  # 10 MB
    MEDICAL_DOCUMENT: 20 * 1024 * 1024,  # 20 MB
    PATIENT_PHOTO: 5 * 1024 * 1024,  # 5 MB
}


def _upload_path(instance, filename):
    return f"uploads/{instance.file_type}/{instance.uploaded_at.strftime('%Y/%m')}/{filename}"


class MediaUpload(models.Model):
    file = models.FileField(upload_to=_upload_path)
    file_type = models.CharField(max_length=20, choices=FILE_TYPES)
    original_name = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(help_text="File size in bytes")
    mime_type = models.CharField(max_length=100)

    uploaded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='uploads'
    )
    emergency = models.ForeignKey(
        'ambulance.Emergency', on_delete=models.CASCADE,
        null=True, blank=True, related_name='attachments'
    )
    referral = models.ForeignKey(
        'hospital.PatientReferral', on_delete=models.CASCADE,
        null=True, blank=True, related_name='attachments'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.get_file_type_display()} — {self.original_name}"

    def delete(self, *args, **kwargs):
        # Remove the file from disk/S3 on record deletion
        path = self.file.path if hasattr(self.file, 'path') else None
        super().delete(*args, **kwargs)
        if path and os.path.exists(path):
            os.remove(path)
