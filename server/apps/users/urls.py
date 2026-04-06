from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('me/', views.UserDetailView.as_view(), name='user-detail'),
    path('change-password/', views.change_password, name='change-password'),
    path('dashboard/', views.user_dashboard, name='dashboard'),
]
