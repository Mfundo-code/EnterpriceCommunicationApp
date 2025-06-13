from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('GroomApp.urls')),  # Includes all GroomApp API endpoints
]
