# RapidCare Alert System - Architecture Design

## System Overview

RapidCare is a real-time emergency coordination platform that optimizes ambulance-hospital interactions during critical situations. The system uses Django (backend) and React (frontend) to provide intelligent hospital recommendations, real-time alerts, and seamless coordination between emergency services.

## User Roles & Permissions

### 1. Ambulance Services
- **Ambulance Driver**: Navigation, hospital selection, patient data input, real-time location sharing
- **Paramedic Assistant**: Patient vital monitoring, medical information management, communication with hospitals

### 2. Hospital Staff
- **Doctors**: Patient admission decisions, medical referrals, report uploads
- **Paramedic Staff**: Emergency preparation coordination, patient handover
- **Front-desk Support/Administrative Staff**: Hospital resource management, alert handling, bed allocation

### 3. Civilian Users
- Browse hospital availability (beds, doctors, medical units)
- View hospital profiles and capabilities
- Emergency information access

## System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │   React Client  │    │   React Client  │
│  (Ambulance)    │    │   (Hospital)    │    │   (Civilian)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      Django Backend       │
                    │   (REST API + WebSocket)  │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │    PostgreSQL Database   │
                    │   + Redis (Caching)      │
                    └───────────────────────────┘
```

### Backend Architecture (Django)

#### Core Apps Structure
```
rapidcare_server/
├── apps/
│   ├── users/           # User authentication and authorization
│   ├── hospitals/       # Hospital management
│   ├── ambulances/      # Ambulance fleet management
│   ├── emergency/       # Emergency coordination
│   ├── notifications/   # Real-time alerts system
│   ├── location/        # GPS and mapping services
│   └── reports/         # Medical reports and analytics
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   ├── production.py
│   │   └── testing.py
│   ├── urls.py
│   └── wsgi.py
└── requirements/
    ├── base.txt
    ├── development.txt
    └── production.txt
```

#### Key Technologies
- **Django REST Framework**: API development
- **Django Channels**: WebSocket support for real-time communication
- **Celery + Redis**: Background tasks and job queuing
- **PostgreSQL**: Primary database
- **Redis**: Caching and session management
- **GeoDjango**: Geospatial data handling
- **JWT**: Authentication tokens

### Frontend Architecture (React)

#### Component Structure
```
src/
├── components/
│   ├── common/          # Shared UI components
│   ├── auth/           # Login, signup, password reset
│   ├── ambulance/      # Ambulance driver interface
│   ├── hospital/       # Hospital staff interface
│   ├── civilian/       # Public user interface
│   └── emergency/      # Emergency coordination components
├── pages/
│   ├── Dashboard/
│   ├── Emergency/
│   ├── Hospitals/
│   ├── Profile/
│   └── Reports/
├── hooks/
│   ├── useAuth.js
│   ├── useLocation.js
│   ├── useWebSocket.js
│   └── useOffline.js
├── services/
│   ├── api.js          # API client
│   ├── websocket.js    # WebSocket client
│   ├── geolocation.js  # GPS services
│   └── storage.js      # Offline storage
├── store/              # Redux/Context state management
└── utils/
    ├── constants.js
    ├── helpers.js
    └── validators.js
```

#### Key Technologies
- **React 18**: UI framework
- **React Router**: Navigation
- **Redux Toolkit**: State management
- **Material-UI** or **Ant Design**: UI components
- **Socket.IO Client**: Real-time communication
- **Leaflet** or **Mapbox**: Mapping and GPS
- **Service Worker**: Offline functionality
- **PWA**: Progressive Web App capabilities

## Database Architecture

### Core Models

#### User Management
```python
# User model with role-based access
class User(AbstractUser):
    USER_ROLES = [
        ('AMBULANCE_DRIVER', 'Ambulance Driver'),
        ('PARAMEDIC_ASSISTANT', 'Paramedic Assistant'),
        ('DOCTOR', 'Doctor'),
        ('PARAMEDIC_STAFF', 'Paramedic Staff'),
        ('FRONT_DESK', 'Front Desk Staff'),
        ('CIVILIAN', 'Civilian User'),
    ]
    
    role = models.CharField(max_length=20, choices=USER_ROLES)
    phone_number = models.CharField(max_length=15, unique=True)
    is_verified = models.BooleanField(default=False)
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)
    
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    license_number = models.CharField(max_length=50, null=True, blank=True)  # For medical staff
    ambulance_id = models.CharField(max_length=20, null=True, blank=True)   # For ambulance staff
    hospital = models.ForeignKey('Hospital', on_delete=models.SET_NULL, null=True, blank=True)
```

#### Hospital Management
```python
class Hospital(models.Model):
    name = models.CharField(max_length=200)
    address = models.TextField()
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    phone_number = models.CharField(max_length=15)
    email = models.EmailField()
    is_active = models.BooleanField(default=True)
    emergency_contact = models.CharField(max_length=15)
    
class HospitalCapability(models.Model):
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='capabilities')
    unit_type = models.CharField(max_length=50)  # cardiology, orthopedics, etc.
    is_available = models.BooleanField(default=True)
    capacity = models.PositiveIntegerField()
    current_load = models.PositiveIntegerField(default=0)
    
class HospitalResource(models.Model):
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='resources')
    resource_type = models.CharField(max_length=50)  # beds, doctors, equipment
    total_count = models.PositiveIntegerField()
    available_count = models.PositiveIntegerField()
    last_updated = models.DateTimeField(auto_now=True)
```

#### Ambulance Management
```python
class Ambulance(models.Model):
    vehicle_number = models.CharField(max_length=20, unique=True)
    driver = models.OneToOneField(User, on_delete=models.SET_NULL, null=True)
    paramedic = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, related_name='paramedic_ambulance')
    current_location_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    current_location_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    status = models.CharField(max_length=20, choices=[
        ('AVAILABLE', 'Available'),
        ('BUSY', 'Busy'),
        ('MAINTENANCE', 'Under Maintenance'),
        ('OFF_DUTY', 'Off Duty'),
    ], default='AVAILABLE')
    last_location_update = models.DateTimeField(auto_now=True)
```

#### Emergency Coordination
```python
class Emergency(models.Model):
    SEVERITY_LEVELS = [
        ('LOW', 'Low Priority'),
        ('MEDIUM', 'Medium Priority'),
        ('HIGH', 'High Priority'),
        ('CRITICAL', 'Critical'),
    ]
    
    patient_name = models.CharField(max_length=100)
    patient_age = models.PositiveIntegerField()
    patient_gender = models.CharField(max_length=10)
    medical_condition = models.TextField()
    severity = models.CharField(max_length=10, choices=SEVERITY_LEVELS)
    diabetic = models.BooleanField(default=False)
    other_conditions = models.TextField(blank=True)
    
    ambulance = models.ForeignKey(Ambulance, on_delete=models.CASCADE)
    selected_hospital = models.ForeignKey(Hospital, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='ACTIVE')
    
class EmergencyAlert(models.Model):
    emergency = models.ForeignKey(Emergency, on_delete=models.CASCADE, related_name='alerts')
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE)
    alert_type = models.CharField(max_length=20)  # PRIMARY, BACKUP
    sent_at = models.DateTimeField(auto_now_add=True)
    acknowledged = models.BooleanField(default=False)
    acknowledged_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
```

## Real-Time Communication Architecture

### WebSocket Implementation
```python
# Django Channels consumers
class EmergencyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = f"emergency_{self.user.role}"
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
    
    async def emergency_alert(self, event):
        await self.send(text_data=json.dumps({
            'type': 'emergency_alert',
            'data': event['data']
        }))
```

### Notification Types
1. **Emergency Alerts**: New patient incoming
2. **Hospital Updates**: Resource availability changes
3. **Ambulance Status**: Location updates, availability changes
4. **System Notifications**: Maintenance, downtime alerts

## Offline Functionality Architecture

### Service Worker Implementation
```javascript
// Cache strategies for offline functionality
const cacheStrategy = {
  emergencyData: 'networkFirst',    // Try network, fallback to cache
  hospitalData: 'cacheFirst',       // Use cache, update in background
  userData: 'networkFirst',         // Always try network first
  staticAssets: 'cacheFirst'        // Cache static assets
};
```

### Local Storage Structure
```javascript
// IndexedDB for offline data storage
const offlineDB = {
  emergencies: [],      // Pending emergency reports
  locations: [],        // Cached GPS locations
  hospitalData: [],     // Cached hospital information
  userPreferences: {}   // User settings and preferences
};
```

## Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication
- **Role-Based Access Control**: Permission-based feature access
- **API Rate Limiting**: Prevent abuse
- **CORS Configuration**: Secure cross-origin requests
- **Input Validation**: Comprehensive data sanitization

### Data Protection
- **Encryption**: Sensitive data encryption at rest
- **HTTPS**: All communications encrypted in transit
- **HIPAA Compliance**: Medical data protection standards
- **Audit Logging**: Complete activity tracking

## API Architecture

### RESTful Endpoints
```
/api/v1/
├── auth/
│   ├── login/
│   ├── logout/
│   ├── register/
│   └── refresh-token/
├── hospitals/
│   ├── list/
│   ├── {id}/
│   ├── {id}/capabilities/
│   └── {id}/resources/
├── ambulances/
│   ├── list/
│   ├── {id}/
│   ├── {id}/location/
│   └── {id}/status/
├── emergencies/
│   ├── create/
│   ├── {id}/
│   ├── {id}/alerts/
│   └── {id}/status/
└── notifications/
    ├── list/
    ├── {id}/mark-read/
    └── settings/
```

### WebSocket Events
```javascript
// Real-time events
const socketEvents = {
  'emergency_created': 'New emergency reported',
  'ambulance_location_updated': 'Ambulance position changed',
  'hospital_resource_updated': 'Hospital availability changed',
  'emergency_alert_sent': 'Alert sent to hospital',
  'emergency_acknowledged': 'Hospital acknowledged alert'
};
```

## Deployment Architecture

### Production Environment
```
┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │      CDN        │
│   (Nginx)       │    │   (Static)      │
└─────────┬───────┘    └─────────────────┘
          │
┌─────────┴───────┐
│   Django App    │
│   (Gunicorn)    │
└─────────┬───────┘
          │
┌─────────┴───────┐    ┌─────────────────┐
│   PostgreSQL    │    │      Redis      │
│   (Primary)     │    │   (Cache/Queue) │
└─────────────────┘    └─────────────────┘
```

### Scalability Considerations
- **Horizontal Scaling**: Multiple app servers behind load balancer
- **Database Replication**: Read replicas for performance
- **CDN Integration**: Static asset delivery optimization
- **Microservices**: Future modular architecture

## Technology Stack Summary

### Backend
- **Framework**: Django 4.2+
- **API**: Django REST Framework
- **Real-time**: Django Channels
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Task Queue**: Celery
- **Geospatial**: GeoDjango + PostGIS

### Frontend
- **Framework**: React 18+
- **State Management**: Redux Toolkit
- **UI Library**: Material-UI/Ant Design
- **Maps**: Leaflet/Mapbox GL JS
- **Real-time**: Socket.IO Client
- **PWA**: Workbox
- **Build Tool**: Vite

### DevOps & Infrastructure
- **Containerization**: Docker
- **Web Server**: Nginx
- **App Server**: Gunicorn
- **Process Management**: Supervisor
- **Monitoring**: Sentry + New Relic
- **CI/CD**: GitHub Actions

## Future Roadmap

### Phase 1: Core Functionality
- User authentication and role management
- Hospital and ambulance registration
- Basic emergency reporting
- Real-time alerts

### Phase 2: Advanced Features
- Intelligent hospital recommendations
- Offline functionality
- Mobile app development
- Advanced analytics

### Phase 3: Ecosystem Integration
- Hospital system integrations (HL7/FHIR)
- Government emergency services integration
- AI-powered triage recommendations
- Telemedicine integration
