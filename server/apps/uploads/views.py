from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import MediaUpload
from .serializers import MediaUploadSerializer, MediaUploadCreateSerializer


class MediaUploadView(APIView):
    """
    POST /api/uploads/        — upload a file, link to emergency or referral
    GET  /api/uploads/        — list uploads (filter by ?emergency=id or ?referral=id)
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        qs = MediaUpload.objects.filter(uploaded_by=request.user)

        emergency_id = request.query_params.get('emergency')
        referral_id = request.query_params.get('referral')

        if emergency_id:
            qs = MediaUpload.objects.filter(emergency_id=emergency_id)
        elif referral_id:
            qs = MediaUpload.objects.filter(referral_id=referral_id)

        serializer = MediaUploadSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        ser = MediaUploadCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        file = ser.validated_data['file']
        file_type = ser.validated_data['file_type']

        upload = MediaUpload(
            file=file,
            file_type=file_type,
            original_name=file.name,
            file_size=file.size,
            mime_type=getattr(file, 'content_type', ''),
            uploaded_by=request.user,
            emergency_id=ser.validated_data.get('emergency_id'),
            referral_id=ser.validated_data.get('referral_id'),
        )
        # uploaded_at is auto_now_add so we save after object exists
        upload.save()

        out = MediaUploadSerializer(upload, context={'request': request})
        return Response(out.data, status=status.HTTP_201_CREATED)


class MediaUploadDetailView(APIView):
    """
    GET    /api/uploads/<id>/  — retrieve metadata
    DELETE /api/uploads/<id>/  — delete file + record
    """
    permission_classes = [IsAuthenticated]

    def _get_upload(self, pk, user):
        try:
            return MediaUpload.objects.get(pk=pk, uploaded_by=user)
        except MediaUpload.DoesNotExist:
            return None

    def get(self, request, pk):
        upload = self._get_upload(pk, request.user)
        if not upload:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(MediaUploadSerializer(upload, context={'request': request}).data)

    def delete(self, request, pk):
        upload = self._get_upload(pk, request.user)
        if not upload:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        upload.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
