from django.urls import path
from . import views

urlpatterns = [
    path('', views.MediaUploadView.as_view(), name='uploads-list'),
    path('<int:pk>/', views.MediaUploadDetailView.as_view(), name='uploads-detail'),
]
