# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RapidCare Alert System is a real-time emergency healthcare coordination platform. It connects ambulance drivers,
hospital staff, and the public. Three Django apps (users, hospital, ambulance) serve a React SPA via REST API with JWT
auth.

## Commands

### Backend (run from project root or `server/`)

```bash
source venv/bin/activate           # activate virtualenv (root-level venv)
cd server && python manage.py runserver    # dev server on :8000
python manage.py migrate
python manage.py makemigrations
python manage.py createsuperuser
```

### Frontend (run from `client/`)

```bash
npm run dev      # dev server on :5173
npm run build
npm run lint
npm run preview
```

### Environment

- `client/.env`: `VITE_API_URL=http://localhost:8000`
- Database: `server/db.sqlite3` (SQLite in dev)

## Architecture

### Request Flow

1. React sends JWT-authenticated requests to `http://localhost:8000/api/`
2. `client/src/services/api.js` — Axios instance with request interceptor (adds `Authorization: Bearer`) and response
   interceptor (auto-refreshes token on 401 via `/api/auth/token/refresh/`, redirects to login on refresh failure)
3. `client/src/contexts/AuthContext.jsx` — holds auth state (user, tokens), exposes `useAuth()` hook and
   login/logout/register functions; tokens persisted in localStorage

### Django Backend (`server/`)

```
config/          # settings, root URL routing
apps/
  users/         # AbstractUser extension, UserProfile, JWT auth endpoints
  hospital/      # Hospital, Department, BloodInventory, Equipment, EmergencyAlert, PatientReferral
  ambulance/     # Ambulance, Emergency, LocationUpdate
```

All API routes prefixed `/api/`:

- `/api/auth/` → `apps/users`
- `/api/ambulance/` → `apps/ambulance`
- `/api/hospital/` → `apps/hospital`

### React Frontend (`client/src/`)

```
App.jsx                         # route definitions
contexts/AuthContext.jsx        # global auth state
services/api.js                 # all API calls (single Axios instance)
components/
  auth/                         # Login, Register, ProtectedRoute
  Ambulance/                    # ambulance dashboard, new emergency form, hospital selection
  hospital/                     # hospital dashboard, alerts, availability, referrals, public hospital list
  dashboard/                    # role-agnostic landing dashboard
```

### Key Data Relationships

- `User.role` ∈ {CIVILIAN, AMBULANCE_DRIVER, PARAMEDIC_ASSISTANT, DOCTOR, PARAMEDIC_STAFF, FRONT_DESK} — drives which
  dashboard/routes are shown
- `UserProfile` (1:1 with User) links hospital staff to their `hospital_id` and ambulance drivers to their
  `ambulance_id`
- `Emergency` → `Ambulance` + optional `assigned_hospital` + `backup_hospital`
- `EmergencyAlert` is created per hospital when an emergency is dispatched; hospital staff acknowledge or reject it
- `PatientReferral` links two hospitals for inter-hospital patient transfers

### Route → Component Map

| Path                               | Component               | Role           |
|------------------------------------|-------------------------|----------------|
| `/dashboard`                       | `Dashboard.jsx`         | all            |
| `/ambulance`                       | `ambulance.jsx`         | driver         |
| `/new-emergency`                   | `newemergency.jsx`      | driver         |
| `/hospital-selection/:emergencyId` | `hospitalselection.jsx` | driver         |
| `/hospital-dashboard`              | `hospitaldashboard.jsx` | hospital staff |
| `/alerts`                          | `Alerts.jsx`            | hospital staff |
| `/availability`                    | `availability.jsx`      | hospital staff |
| `/referrals`                       | `referrals.jsx`         | hospital staff |
| `/hospitals`                       | `Hospitals.jsx`         | public         |

### Authentication

- JWT via `djangorestframework-simplejwt`; access + refresh tokens returned on login
- `ProtectedRoute` wraps all authenticated routes and redirects unauthenticated users to `/login`
- CORS enabled in Django settings to allow requests from the Vite dev server
