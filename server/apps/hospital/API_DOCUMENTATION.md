# Hospital Module API Documentation

## Base URL
```
/api/hospital/
```

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. Hospitals
- **GET** `/hospitals/` - List all hospitals
- **POST** `/hospitals/` - Create a new hospital
- **GET** `/hospitals/{id}/` - Get hospital details
- **PUT** `/hospitals/{id}/` - Update hospital
- **DELETE** `/hospitals/{id}/` - Delete hospital

### 2. Departments
- **GET** `/departments/` - List all departments
- **GET** `/departments/?hospital_id={id}` - List departments for a specific hospital
- **POST** `/departments/` - Create a new department
- **GET** `/departments/{id}/` - Get department details
- **PATCH** `/departments/{id}/update_availability/` - Update department availability
- **GET** `/departments/status_summary/?hospital_id={id}` - Get department status summary

### 3. Blood Inventory
- **GET** `/blood-inventory/` - List all blood inventory
- **GET** `/blood-inventory/?hospital_id={id}` - List blood inventory for a specific hospital
- **POST** `/blood-inventory/` - Add blood inventory record
- **GET** `/blood-inventory/by_hospital/?hospital_id={id}` - Get blood inventory by hospital
- **PUT** `/blood-inventory/{id}/` - Update blood inventory
- **DELETE** `/blood-inventory/{id}/` - Delete blood inventory record

### 4. Equipment
- **GET** `/equipment/` - List all equipment
- **GET** `/equipment/?hospital_id={id}` - List equipment for a specific hospital
- **POST** `/equipment/` - Add equipment record
- **PATCH** `/equipment/{id}/toggle_availability/` - Toggle equipment availability
- **PUT** `/equipment/{id}/` - Update equipment
- **DELETE** `/equipment/{id}/` - Delete equipment record

### 5. Emergency Alerts
- **GET** `/emergency-alerts/` - List all emergency alerts
- **GET** `/emergency-alerts/?hospital_id={id}` - List alerts for a specific hospital
- **GET** `/emergency-alerts/?priority={high|medium|low}` - Filter by priority
- **GET** `/emergency-alerts/?status={pending|acknowledged|rejected|completed}` - Filter by status
- **POST** `/emergency-alerts/` - Create new emergency alert
- **GET** `/emergency-alerts/{id}/` - Get alert details
- **POST** `/emergency-alerts/{id}/acknowledge/` - Acknowledge an alert
- **POST** `/emergency-alerts/{id}/reject/` - Reject an alert
- **GET** `/emergency-alerts/stats/?hospital_id={id}` - Get alert statistics

### 6. Patient Referrals
- **GET** `/patient-referrals/` - List all patient referrals
- **GET** `/patient-referrals/?hospital_id={id}&type={incoming|outgoing}` - Filter referrals
- **GET** `/patient-referrals/?status={pending|accepted|rejected|completed}` - Filter by status
- **POST** `/patient-referrals/` - Create new patient referral
- **GET** `/patient-referrals/{id}/` - Get referral details
- **POST** `/patient-referrals/{id}/accept/` - Accept a referral
- **POST** `/patient-referrals/{id}/reject/` - Reject a referral
- **GET** `/patient-referrals/counts/?hospital_id={id}` - Get referral counts

### 7. Dashboard
- **GET** `/dashboard/stats/?hospital_id={id}` - Get dashboard statistics
- **GET** `/dashboard/recent_alerts/?hospital_id={id}` - Get recent alerts for dashboard
- **GET** `/dashboard/department_status/?hospital_id={id}` - Get department status for dashboard

## Sample Request/Response

### Get Dashboard Statistics
```http
GET /api/hospital/dashboard/stats/?hospital_id=1
Authorization: Bearer <token>
```

Response:
```json
{
    "active_alerts": 3,
    "available_beds": 24,
    "doctors_on_duty": 18,
    "todays_emergencies": 12
}
```

### Create Emergency Alert
```http
POST /api/hospital/emergency-alerts/
Authorization: Bearer <token>
Content-Type: application/json

{
    "patient_name": "John Doe",
    "patient_age": 45,
    "patient_gender": "Male",
    "case_description": "Chest pain - suspected heart attack",
    "priority": "high",
    "eta": "5 mins",
    "distance": "2.3 km",
    "ambulance_id": "AMB-001",
    "receiving_hospital": 1,
    "tags": ["Cardiac", "Emergency", "Adult"]
}
```

### Acknowledge Emergency Alert
```http
POST /api/hospital/emergency-alerts/1/acknowledge/
Authorization: Bearer <token>
```

### Update Department Availability
```http
PATCH /api/hospital/departments/1/update_availability/
Authorization: Bearer <token>
Content-Type: application/json

{
    "available_beds": 10,
    "doctors_on_duty": 6
}
```

## Data Models

### EmergencyAlert
- `patient_name`: String
- `patient_age`: Integer
- `patient_gender`: String
- `case_description`: Text
- `priority`: Enum (high, medium, low)
- `status`: Enum (pending, acknowledged, rejected, completed)
- `eta`: String (Estimated time of arrival)
- `distance`: String
- `ambulance_id`: String
- `receiving_hospital`: Foreign Key (Hospital)
- `tags`: JSON Array

### PatientReferral
- `patient_name`: String
- `patient_age`: Integer
- `current_diagnosis`: Text
- `reason_for_referral`: Text
- `required_specialty`: String
- `medical_documents`: JSON Array (file paths)
- `referring_hospital`: Foreign Key (Hospital)
- `receiving_hospital`: Foreign Key (Hospital)
- `status`: Enum (pending, accepted, rejected, completed)
- `notes`: Text (optional)

### Department
- `name`: String
- `hospital`: Foreign Key (Hospital)
- `available_beds`: Integer
- `total_beds`: Integer
- `doctors_on_duty`: Integer
- `is_active`: Boolean

### BloodInventory
- `hospital`: Foreign Key (Hospital)
- `blood_type`: Enum (A+, A-, B+, B-, O+, O-, AB+, AB-)
- `units_available`: Integer

### Equipment
- `hospital`: Foreign Key (Hospital)
- `equipment_type`: Enum (ventilators, defibrillators, ct, mri, xray, dialysis)
- `is_available`: Boolean
- `total_count`: Integer
- `available_count`: Integer
- `last_maintenance`: Date (optional)

## Error Responses

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

Error response format:
```json
{
    "error": "Error message description"
}
```
