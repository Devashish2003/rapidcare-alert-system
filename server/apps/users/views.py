from django.contrib.auth import login, logout
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from django.conf import settings

from .models import User, UserProfile, PushSubscription
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer,
    UserSerializer, UserProfileSerializer, PasswordChangeSerializer
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    serializer = UserLoginSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    
    user = serializer.validated_data['user']
    login(request, user)
    
    # Update user profile last_active
    profile, created = UserProfile.objects.get_or_create(user=user)
    profile.save()
    
    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'user': UserSerializer(user).data,
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        logout(request)
        return Response({'message': 'Successfully logged out'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile


class UserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({'message': 'Password changed successfully'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_dashboard(request):
    user = request.user
    profile = user.profile
    
    dashboard_data = {
        'user': UserSerializer(user).data,
        'profile': UserProfileSerializer(profile).data,
        'role_specific_data': {}
    }
    
    # Add role-specific data
    if user.role == 'AMBULANCE_DRIVER':
        # Add ambulance-specific data
        pass
    elif user.role in ['DOCTOR', 'PARAMEDIC_STAFF', 'FRONT_DESK']:
        # Add hospital-specific data
        pass
    
    return Response(dashboard_data)


# ── Web Push subscriptions ────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def vapid_public_key(request):
    return Response({'publicKey': settings.VAPID_PUBLIC_KEY})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def push_subscribe(request):
    endpoint = request.data.get('endpoint')
    keys = request.data.get('keys', {})
    p256dh = keys.get('p256dh')
    auth = keys.get('auth')
    if not all([endpoint, p256dh, auth]):
        return Response({'error': 'endpoint and keys.p256dh/auth are required'},
                        status=status.HTTP_400_BAD_REQUEST)
    PushSubscription.objects.update_or_create(
        user=request.user,
        endpoint=endpoint,
        defaults={'p256dh_key': p256dh, 'auth_key': auth},
    )
    return Response({'status': 'subscribed'})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def push_unsubscribe(request):
    endpoint = request.data.get('endpoint')
    qs = PushSubscription.objects.filter(user=request.user)
    if endpoint:
        qs = qs.filter(endpoint=endpoint)
    qs.delete()
    return Response({'status': 'unsubscribed'})
