from rest_framework import serializers
from .models import MediaUpload, ALLOWED_MIME_TYPES, MAX_SIZES, FILE_TYPES

FILE_TYPE_CHOICES = [ft[0] for ft in FILE_TYPES]


class MediaUploadSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    file_size_kb = serializers.SerializerMethodField()

    class Meta:
        model = MediaUpload
        fields = [
            'id', 'file_url', 'file_type', 'original_name',
            'file_size', 'file_size_kb', 'mime_type',
            'emergency', 'referral', 'uploaded_at',
        ]
        read_only_fields = ['id', 'file_url', 'file_size_kb', 'uploaded_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file:
            return request.build_absolute_uri(obj.file.url) if request else obj.file.url
        return None

    def get_file_size_kb(self, obj):
        return round(obj.file_size / 1024, 1) if obj.file_size else 0


class MediaUploadCreateSerializer(serializers.Serializer):
    file = serializers.FileField()
    file_type = serializers.ChoiceField(choices=FILE_TYPE_CHOICES)
    emergency_id = serializers.IntegerField(required=False, allow_null=True)
    referral_id = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, attrs):
        file = attrs['file']
        file_type = attrs['file_type']

        mime = getattr(file, 'content_type', '') or ''
        allowed = ALLOWED_MIME_TYPES.get(file_type, set())
        if mime and mime not in allowed:
            raise serializers.ValidationError(
                f"'{mime}' not allowed for {file_type}. Allowed: {', '.join(sorted(allowed))}"
            )

        max_size = MAX_SIZES.get(file_type, 20 * 1024 * 1024)
        if file.size > max_size:
            raise serializers.ValidationError(
                f"File too large ({round(file.size / 1024 / 1024, 1)} MB). "
                f"Max: {max_size // 1024 // 1024} MB."
            )

        return attrs
