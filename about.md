# RapidCare Alert System

## Overview

RapidCare is a real-time, event-driven healthcare coordination platform designed to bridge the gap between ambulances, hospitals, and patients.

It enables:

* Ambulances to send real-time emergency alerts
* Hospitals to prepare resources before patient arrival
* Hospitals to refer patients to other hospitals intelligently
* Public users to check availability of beds and doctors



## Problem Statement

The current emergency healthcare system (especially in India) suffers from:

* No standardized communication between ambulance and hospital
* Manual, phone-based coordination (slow and unreliable)
* No real-time visibility of hospital resources (ICU beds, doctors)
* Inefficient patient referrals between hospitals
* Lack of pre-arrival preparation → delays in treatment

### Impact:

* Increased patient mortality in critical cases
* Resource mismanagement
* Time loss in emergency scenarios


## Solution

RapidCare introduces a centralized, real-time platform that:

### Ambulance Layer

* Sends emergency alerts (type, severity, location)
* Supports voice-based input for fast interaction
* Shares ETA and patient condition in real time

### Hospital Layer

* Tracks:
  * ICU beds
  * General beds
  * Doctors
  * Equipment (ventilators, etc.)
* Receives alerts and prepares in advance
* Accepts/rejects incoming patients

###  Referral System (Hospital → Hospital)

* Hospitals can refer patients to other hospitals
* Smart matching based on:

  * Availability
  * Distance
  * Specialization
* Includes:
  * Request lifecycle
  * Bed reservation system
  * Transfer tracking

###  Public Access Layer

* View nearby hospitals
* Check availability (beds, doctors)
* Emergency routing


## System Architecture

### Architecture Style

> Event-Driven + Microservices (scalable)
> MVP starts as Modular Monolith (Django)

### High-Level Components

1. Frontend (React)

* Ambulance App
* Hospital Dashboard
* Public Web App

2. API Gateway

* Entry point for all clients
* Handles authentication and routing
* Implemented via NGINX / Kubernetes Ingress

3. Backend Services (Python + Django)

**Auth Service**
  * Role-based access (Ambulance, Hospital, Public)

**Emergency Service**
  * Handles ambulance alerts
  * Publishes events

**Hospital Resource Service**
  * Manages beds, doctors, equipment

**Referral Service**
  * Handles inter-hospital transfers
  * Maintains lifecycle states

**Notification Service**
  * Sends real-time alerts (WebSockets, SMS fallback)


4. Event Streaming Layer

* Kafka / Redis Streams
* Enables real-time communication between services


5. Real-Time Layer

* WebSockets (Django Channels)
* Used for:

  * Live alerts
  * Tracking
  * Dashboard updates


6. Database Layer

* PostgreSQL (primary database)
* Redis (caching + real-time support)


7. Infrastructure

* Docker (containerization)
* Kubernetes (orchestration)
* Helm (deployment management)


Data Flow (Example)

1. Ambulance sends emergency event
2. Backend processes and publishes event
3. Hospitals receive alert in real time
4. Hospital accepts/rejects case
5. If unavailable → referral triggered
6. Another hospital accepts → transfer initiated


### Database Design

### Users Table

```sql
id (PK)
name
role (ambulance / hospital / public)
hospital_id (nullable)
```


### Hospitals Table

```sql
id (PK)
name
location
contact_info
```

### Hospital Resources Table

```sql
id (PK)
hospital_id (FK)
icu_beds_available
general_beds_available
ventilators_available
doctors_available
last_updated
```


### Emergency Events Table

```sql
id (PK)
type (cardiac / trauma / general)
severity
location
ambulance_id
timestamp
status
```


### Referrals Table

```sql
id (PK)
from_hospital_id (FK)
to_hospital_id (FK)
patient_type
status (CREATED / ACCEPTED / REJECTED / IN_TRANSIT / COMPLETED)
created_at
updated_at
```


### Referral Responses Table

```sql
id (PK)
referral_id (FK)
hospital_id (FK)
response (ACCEPT / REJECT)
timestamp
```


### Audit Logs Table

```sql
id (PK)
action
performed_by
timestamp
metadata
```


##  Security

* JWT-based authentication
* Role-Based Access Control (RBAC)
* HTTPS enforced
* Audit logging for all critical actions


## Tech Stack

### Backend

* Python
* Django (core APIs)
* Django Channels (WebSockets)

### Frontend

* React

### Database

* PostgreSQL
* Redis

### Messaging / Streaming

* Kafka (or Redis Streams for MVP)

### Infrastructure

* Docker
* Kubernetes
* NGINX (Ingress)


##  MVP Scope

### Phase 1

* Ambulance → Hospital alert system
* Basic hospital dashboard
* Manual resource updates

### Phase 2

* Referral system
* Public availability view
* Real-time updates

### Phase 3

* AI-based hospital recommendation
* Predictive triage


## ️ Challenges

* Data accuracy (hospital updates)
* Adoption by hospitals
* Real-time latency constraints
* Distributed system consistency


##  Future Enhancements

* AI-based triage scoring
* Predictive resource allocation
* Integration with government health systems
* IoT integration (live vitals from ambulance)


##  Conclusion

RapidCare transforms emergency healthcare from:

> ❌ Reactive, manual, fragmented

to:

> ✅ Real-time, intelligent, and coordinated

##  Author
Devashish Dobriyal
