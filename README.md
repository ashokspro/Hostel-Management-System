# 🏠 Hostel Management System

A full-stack web application for managing hostel gate passes, student movement tracking, and user administration. Built with **FastAPI** (backend) and **React + Vite** (frontend).

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Default Credentials](#default-credentials)
- [API Reference](#api-reference)
- [Role Permissions](#role-permissions)
- [Gate Pass Lifecycle](#gate-pass-lifecycle)
- [Email (Password Reset)](#email-password-reset)
- [PDF Generation](#pdf-generation)
- [Running Tests](#running-tests)
- [Deployment Notes](#deployment-notes)

---

## Overview

The Hostel Management System digitizes the gate pass process for residential hostels. Students submit gate pass requests, wardens approve or reject them, and security staff track physical entry/exit. Admins manage all user accounts across roles.

---

## Features

### Student
- View and edit personal profile
- Create gate pass requests with date/time validation
- View own gate pass history with status tracking
- Download approved gate passes as PDF
- See warden remarks on approved/rejected passes
- Change password

### Warden
- View all students with search and year/course filters
- Review and approve or reject pending gate pass requests with remarks
- View full gate pass history
- Live + historical dashboard stats (Today / This Week / This Month / Overall)
- Change password

### Security
- View all approved gate passes needing action
- Mark student exit (sets actual exit time)
- Mark student return (sets actual return time)
- View currently-out students with overdue detection
- View completed gate pass history
- Live dashboard with auto-refresh every 60 seconds
- Change password

### Admin
- Create user accounts for all roles (Student, Warden, Security, Admin)
- View, edit, activate, and deactivate any user
- Reset any user's password (generate random or set custom)
- Manage Students, Wardens, Security Staff, and Admins separately
- Live system-wide stats + user growth over time
- Change password

### System
- JWT-based authentication with role-based route protection
- Email-based password reset via Resend
- IST-formatted timestamps throughout
- Automatic PDF generation with QR code for approved gate passes
- Responsive layout with sidebar navigation per role

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.13 | Runtime |
| FastAPI | Latest | Web framework |
| SQLAlchemy | 2.0 (async) | ORM |
| Alembic | Latest | Database migrations |
| PostgreSQL | 14+ | Primary database |
| asyncpg | Latest | Async PostgreSQL driver |
| Pydantic v2 | Latest | Schema validation |
| python-jose | Latest | JWT token handling |
| passlib + bcrypt | bcrypt==4.0.1 | Password hashing |
| fpdf2 | Latest | PDF generation |
| qrcode | Latest | QR code generation |
| Resend | Latest | Transactional email |
| pytz | Latest | IST timezone handling |
| pytest + pytest-asyncio | Latest | Backend testing |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| Vite | 8 | Build tool + dev server |
| React Router DOM | Latest | Client-side routing |
| Axios | Latest | HTTP client with interceptors |
| Tailwind CSS | v3 | Utility-first styling |
| React Toastify | Latest | Toast notifications |
| Vitest | Latest | Unit + integration testing |
| MSW | Latest | API mocking for tests |
| React Testing Library | Latest | Component testing |

---

## Architecture

```
┌─────────────────────────────────────┐
│           React Frontend             │
│   (Vite dev server :5173)           │
│                                     │
│  AuthContext → Axios Interceptors   │
│  Role-based Routes + Layouts        │
│  Per-role Dashboards + Pages        │
└──────────────┬──────────────────────┘
               │ /api/* (proxied)
               ▼
┌─────────────────────────────────────┐
│          FastAPI Backend            │
│        (uvicorn :8000)              │
│                                     │
│  JWT Auth → Role Guards             │
│  Routers → Services → Repositories │
│  Pydantic Schemas + Validation      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│          PostgreSQL Database         │
│                                     │
│  users table (all roles)            │
│  gate_passes table                  │
└─────────────────────────────────────┘
```

The Vite dev server proxies all `/api/*` requests to FastAPI, eliminating CORS issues during development. In production, serve both behind a reverse proxy (e.g., nginx).

---

## Project Structure

```
hostel-management-system/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py          # Settings via pydantic-settings
│   │   │   ├── constants.py       # UserRole, GatePassStatus, ExitStatus enums
│   │   │   ├── database.py        # Async SQLAlchemy engine + session
│   │   │   ├── dependencies.py    # FastAPI deps: DB, CurrentUser, role guards
│   │   │   └── security.py        # JWT, bcrypt, reset token helpers
│   │   ├── models/
│   │   │   ├── user.py            # User ORM model (all roles in one table)
│   │   │   └── gatepass.py        # GatePass ORM model
│   │   ├── schemas/
│   │   │   ├── auth.py            # Login, ForgotPassword, ResetPassword schemas
│   │   │   ├── user.py            # UserCreate, UserUpdate, UserResponse schemas
│   │   │   └── gatepass.py        # GatePassCreate, GatePassResponse + stats schemas
│   │   ├── repositories/
│   │   │   ├── user_repository.py      # DB queries for users
│   │   │   └── gatepass_repository.py  # DB queries for gate passes + stats
│   │   ├── services/
│   │   │   ├── auth_service.py         # Login, password reset, change password
│   │   │   ├── user_service.py         # CRUD + stats for users
│   │   │   ├── gatepass_service.py     # Gate pass lifecycle + stats
│   │   │   ├── email_service.py        # Resend email integration
│   │   │   ├── pdf_service.py          # FPDF2 gate pass PDF generation
│   │   │   └── qr_service.py           # QR code generation
│   │   ├── routers/
│   │   │   ├── auth.py            # /api/auth/*
│   │   │   ├── student.py         # /api/student/*
│   │   │   ├── warden.py          # /api/warden/*
│   │   │   ├── security.py        # /api/security/*
│   │   │   ├── admin.py           # /api/admin/*
│   │   │   └── gatepass.py        # /api/gatepasses/* (PDF download)
│   │   ├── static/
│   │   │   ├── qr_codes/          # Generated QR code PNGs
│   │   │   └── generated_pdfs/    # Generated gate pass PDFs
│   │   └── main.py                # FastAPI app, lifespan, default users
│   ├── migrations/                # Alembic migration files
│   ├── tests/
│   │   ├── conftest.py            # SQLite in-memory test DB + fixtures
│   │   ├── test_auth.py           # Auth endpoint tests
│   │   ├── test_gatepass.py       # Gate pass lifecycle tests
│   │   └── test_users.py          # User management tests
│   ├── alembic.ini
│   ├── pytest.ini
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── axiosInstance.js    # Axios with auth + 401 interceptors
    │   │   ├── authApi.js          # Login, forgot/reset/change password
    │   │   ├── studentApi.js       # Student profile + gate passes
    │   │   ├── wardenApi.js        # Warden students + gate passes
    │   │   ├── securityApi.js      # Security gate pass actions
    │   │   ├── adminApi.js         # Admin user management
    │   │   └── gatepassApi.js      # PDF download (shared)
    │   ├── context/
    │   │   └── AuthContext.jsx     # Global auth state + session restore
    │   ├── hooks/
    │   │   ├── useAuth.js          # Consume AuthContext safely
    │   │   └── usePageTitle.js     # Set document.title per page
    │   ├── layouts/
    │   │   └── DashboardLayout.jsx # Sidebar + Navbar + Outlet shell
    │   ├── components/
    │   │   ├── Sidebar.jsx              # Role-aware nav links
    │   │   ├── Navbar.jsx               # User pill + logout
    │   │   ├── Badge.jsx                # Status badge (Approved/Pending/etc)
    │   │   ├── StatCard.jsx             # Dashboard stat card
    │   │   ├── LoadingSpinner.jsx       # Loading state
    │   │   ├── ConfirmModal.jsx         # Reusable confirm + remarks modal
    │   │   ├── ActivityOverviewTable.jsx # Today/Week/Month/Overall stats
    │   │   ├── UserDetailModal.jsx      # View any user's full details
    │   │   ├── UserEditModal.jsx        # Edit any user (role-aware fields)
    │   │   └── AdminResetPasswordModal.jsx # Admin reset user password
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── ForgotPassword.jsx
    │   │   ├── ResetPassword.jsx
    │   │   ├── ChangePassword.jsx
    │   │   ├── NotFound.jsx
    │   │   ├── Unauthorized.jsx
    │   │   ├── student/
    │   │   │   ├── StudentDashboard.jsx
    │   │   │   ├── Profile.jsx
    │   │   │   └── GatePasses.jsx
    │   │   ├── warden/
    │   │   │   ├── WardenDashboard.jsx
    │   │   │   ├── PendingRequests.jsx
    │   │   │   ├── AllGatePasses.jsx
    │   │   │   └── Students.jsx
    │   │   ├── security/
    │   │   │   ├── SecurityDashboard.jsx
    │   │   │   ├── ApprovedPasses.jsx
    │   │   │   ├── CurrentlyOut.jsx
    │   │   │   └── History.jsx
    │   │   └── admin/
    │   │       ├── AdminDashboard.jsx
    │   │       ├── CreateUser.jsx
    │   │       ├── ManageStudents.jsx
    │   │       ├── ManageWardens.jsx
    │   │       ├── ManageSecurity.jsx
    │   │       └── ManageAdmins.jsx
    │   ├── routes/
    │   │   ├── AppRoutes.jsx       # All route definitions
    │   │   └── ProtectedRoute.jsx  # Auth + role guard
    │   ├── utils/
    │   │   ├── tokenHelper.js      # localStorage token read/write/clear
    │   │   ├── dateFormat.js       # IST date/time formatters
    │   │   └── errorHelper.js      # Pydantic/HTTP error extraction
    │   ├── test/
    │   │   ├── setup.js            # Vitest + MSW setup
    │   │   ├── test-utils.jsx      # renderWithProviders + loginAs helpers
    │   │   └── mocks/
    │   │       ├── server.js       # MSW server
    │   │       └── handlers.js     # Mock API handlers for all endpoints
    │   ├── App.jsx
    │   └── main.jsx
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## Getting Started

### Prerequisites

- Python 3.13+
- Node.js 22+
- PostgreSQL 14+
- A [Resend](https://resend.com) account (free tier, for password reset emails)

---

### 1. Clone and set up

```bash
git clone <your-repo-url>
cd hostel-management-system
```

---

### 2. Backend setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt
```

---

### 3. Environment variables

Create `backend/.env`:

```env
# Database
DATABASE_URL=postgresql+asyncpg://postgres:yourpassword@localhost:5432/hostel_db

# JWT
SECRET_KEY=your-super-secret-key-change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS
ALLOWED_ORIGINS=http://localhost:5173

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=onboarding@resend.dev
FRONTEND_URL=http://localhost:5173
RESET_TOKEN_EXPIRE_MINUTES=60
```

> **Note:** `alembic.ini` uses `postgresql+psycopg2://...` (sync driver for migrations). Make sure psycopg2 is installed: `pip install psycopg2-binary`.

---

### 4. Database setup

```bash
# Create the database in PostgreSQL first
psql -U postgres -c "CREATE DATABASE hostel_db;"

# Run all migrations
alembic upgrade head
```

---

### 5. Start the backend

```bash
uvicorn app.main:app --reload
```

The server starts at `http://localhost:8000`. On first startup, default users are created automatically (see [Default Credentials](#default-credentials)).

---

### 6. Frontend setup

```bash
cd ../frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`. All `/api/*` requests are proxied to `http://localhost:8000`.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL async URL (`postgresql+asyncpg://...`) |
| `SECRET_KEY` | ✅ | JWT signing secret — use a long random string in production |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ✅ | JWT token lifetime (default: 60) |
| `ALLOWED_ORIGINS` | ✅ | CORS allowed origins (comma-separated) |
| `RESEND_API_KEY` | ✅ | Resend API key for password reset emails |
| `EMAIL_FROM` | ✅ | Sender email address (verified in Resend) |
| `FRONTEND_URL` | ✅ | Frontend base URL (used in reset email links) |
| `RESET_TOKEN_EXPIRE_MINUTES` | ✅ | Password reset link lifetime (default: 60) |

---

## Database Setup

The project uses Alembic for schema migrations. All migrations are in `backend/migrations/versions/`.

```bash
# Apply all pending migrations
alembic upgrade head

# Check current migration state
alembic current

# View migration history
alembic history

# Create a new migration after model changes
alembic revision --autogenerate -m "describe your change"

# Rollback one migration
alembic downgrade -1
```

> **PostgreSQL enum values** (like adding a new `UserRole`) require manual migration SQL since Alembic's autogenerate does not detect enum value additions:
> ```sql
> ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'admin';
> ```

---

## Default Credentials

Created automatically on first startup:

| Role | User ID | Password |
|---|---|---|
| Admin | `ADMIN001` | `Admin@123` |
| Warden | `WARDEN001` | `Warden@123` |
| Security | `SECURITY001` | `Security@123` |
| Student | `STU001` | `Student@123` |

**Change all default passwords immediately after first login in any non-development environment.**

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | ❌ | Login with ID + password |
| `GET` | `/api/auth/me` | ✅ | Get current user profile |
| `POST` | `/api/auth/forgot-password` | ❌ | Request password reset email |
| `POST` | `/api/auth/reset-password` | ❌ | Reset password via email token |
| `PUT` | `/api/auth/change-password` | ✅ | Change own password |

### Student

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/student/profile` | Get own profile |
| `PUT` | `/api/student/profile` | Update own profile |
| `GET` | `/api/student/gatepasses` | List own gate passes |
| `POST` | `/api/student/gatepasses` | Create gate pass request |
| `GET` | `/api/student/gatepasses/stats` | Dashboard stats |

### Warden

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/warden/students` | List students (with filters) |
| `GET` | `/api/warden/students/{id}` | Get student by ID |
| `GET` | `/api/warden/gatepasses/pending` | List pending gate passes |
| `GET` | `/api/warden/gatepasses` | List all gate passes |
| `PUT` | `/api/warden/gatepasses/{id}/approve` | Approve gate pass |
| `PUT` | `/api/warden/gatepasses/{id}/reject` | Reject gate pass |
| `GET` | `/api/warden/gatepasses/stats` | Dashboard stats |

### Security

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/security/gatepasses/actionable` | Passes needing exit/return action |
| `GET` | `/api/security/gatepasses/out` | Students currently outside |
| `GET` | `/api/security/gatepasses/history` | Completed gate pass history |
| `PUT` | `/api/security/gatepasses/{id}/exit` | Mark student as exited |
| `PUT` | `/api/security/gatepasses/{id}/return` | Mark student as returned |
| `GET` | `/api/security/gatepasses/stats` | Dashboard stats |

### Admin

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/admin/users` | Create any user |
| `GET` | `/api/admin/users` | List students (with filters) |
| `GET` | `/api/admin/wardens` | List wardens |
| `GET` | `/api/admin/security` | List security staff |
| `GET` | `/api/admin/admins` | List admins |
| `GET` | `/api/admin/users/{id}` | Get any user |
| `PUT` | `/api/admin/users/{id}` | Update any user |
| `PUT` | `/api/admin/users/{id}/activate` | Activate user |
| `PUT` | `/api/admin/users/{id}/deactivate` | Deactivate user |
| `PUT` | `/api/admin/users/{id}/reset-password` | Reset any user's password |
| `GET` | `/api/admin/stats` | Dashboard stats |

### Gate Pass

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/gatepasses/{id}/download` | Download gate pass PDF |

> Full interactive API docs available at `http://localhost:8000/docs` when the backend is running.

---

## Role Permissions

| Action | Student | Warden | Security | Admin |
|---|---|---|---|---|
| View own profile | ✅ | ✅ | ✅ | ✅ |
| Edit own profile | ✅ | — | — | — |
| Change own password | ✅ | ✅ | ✅ | ✅ |
| Create gate pass | ✅ | — | — | — |
| View own gate passes | ✅ | — | — | — |
| Download gate pass PDF | ✅ | — | — | — |
| View all students | — | ✅ | — | ✅ |
| Approve / Reject gate pass | — | ✅ | — | — |
| Mark student exit / return | — | — | ✅ | — |
| Create any user | — | — | — | ✅ |
| Edit any user | — | — | — | ✅ |
| Activate / Deactivate user | — | — | — | ✅ |
| Reset any user's password | — | — | — | ✅ |

---

## Gate Pass Lifecycle

```
Student creates request
        │
        ▼
   Status: PENDING
   Exit Status: In
        │
   Warden reviews
        │
   ┌────┴────┐
   │         │
Approve    Reject
   │         │
   ▼         ▼
Status:   Status:
APPROVED  REJECTED
   │
   │  Security scans student leaving
   ▼
Exit Status: Out
actual_out_time = now()
   │
   │  Security scans student returning
   ▼
Exit Status: In
actual_return_time = now()
   │
   ▼
COMPLETED — appears in Security History
Student can now create a new gate pass
```

**Business rules:**
- A student can only have one active gate pass cycle at a time
- A new request is blocked if there is a `Pending` pass OR an `Approved` pass where the student is currently `Out`
- After `Rejected` or after completing a full cycle (exited and returned), a new request can be submitted
- Return date/time must be after departure date/time (validated both client-side and server-side)
- Departure date cannot be in the past

---

## Email (Password Reset)

The forgot-password flow uses [Resend](https://resend.com):

1. User visits `/forgot-password` and submits their email
2. Backend generates a secure random token, hashes it (SHA-256), stores the hash + expiry in the database
3. A reset link is emailed: `{FRONTEND_URL}/reset-password?token=<raw_token>`
4. User clicks the link, enters a new password
5. Backend verifies the token hash, checks expiry, updates the password, invalidates the token

**Security notes:**
- Only the SHA-256 hash of the token is stored — the raw token never touches the database
- Tokens expire after `RESET_TOKEN_EXPIRE_MINUTES` (default 60 minutes)
- The forgot-password endpoint always returns the same success message regardless of whether the email exists (prevents email enumeration)
- Reset tokens are single-use — invalidated immediately after successful password reset

**For development/testing:** Use Resend's sandbox sender `onboarding@resend.dev`. Check the Resend dashboard for delivery logs if emails don't arrive.

---

## PDF Generation

Approved gate passes can be downloaded as PDF. The PDF is generated on-demand by FastAPI using `fpdf2` and includes:

- Hostel header + document title
- Pass number + coloured status badge
- QR code (top-right corner, encodes pass ID + verification URL)
- Student information (ID, name, room, course, year, phone, guardian phone)
- Gate pass details (reason, destination, planned departure/return)
- Approval information (approved by, approved at, warden remarks)
- Security tracking (exit status, actual exit/return times, security remarks)
- IST-formatted timestamps throughout
- Auto-generated footer with page number and generation timestamp

PDFs are streamed directly to the browser — not stored permanently on disk.

---

## Running Tests

### Backend (pytest)

```bash
cd backend
pytest -v
```

Uses an in-memory SQLite database — no PostgreSQL needed for tests. Tests cover auth, gate pass lifecycle, and user management.

```bash
# Run a specific test file
pytest tests/test_auth.py -v

# Run with output (print statements visible)
pytest -v -s
```

### Frontend (Vitest)

```bash
cd frontend

# Watch mode (interactive, re-runs on file save)
npm run test

# Run once (CI-style)
npm run test:run

# Visual UI for browsing results
npm run test:ui
```

Uses MSW (Mock Service Worker) to intercept all API calls — no backend needed for frontend tests. Tests cover utilities, auth context, routing guards, and key page interactions.

**Current coverage: 32/32 tests passing** across:
- Date/time formatting utilities
- Error message extraction
- Auth context (session restore, login, logout)
- Protected route (auth guard, role guard)
- Login page (form, error display, password toggle)
- Student gate pass creation and validation
- Warden approve/reject flow
- Admin user creation and validation
- Badge component styling

---

## Deployment Notes

### Backend

```bash
# Install production dependencies
pip install gunicorn

# Run with gunicorn + uvicorn workers
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

Update `.env` for production:
- Set a strong, random `SECRET_KEY` (at least 32 characters)
- Set `ALLOWED_ORIGINS` to your actual frontend domain
- Set `FRONTEND_URL` to your actual frontend URL
- Use a production PostgreSQL instance
- Verify a custom domain in Resend for reliable email delivery

### Frontend

```bash
cd frontend
npm run build
```

The `dist/` folder contains the static build. Serve it via:
- **nginx** (recommended) — point root to `dist/`, proxy `/api` to your backend
- **Vercel / Netlify** — set `VITE_API_URL` and update `vite.config.js` accordingly
- **FastAPI static files** — mount `dist/` as a static directory in `main.py`

### Example nginx config

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Serve React frontend
    location / {
        root /var/www/hostel-ms/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API to FastAPI backend
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Password Requirements

All passwords must meet the following criteria:
- Minimum 8 characters
- Maximum 72 characters
- At least one uppercase letter (A–Z)
- At least one lowercase letter (a–z)
- At least one number (0–9)
- At least one special character (`!@#$%^&*()_+-=[]{}|;:,.<>?`)

Enforced by both Pydantic validators (backend) and HTML5 pattern validation (frontend).

---

## Phone Number Requirements

All phone numbers (student phone, guardian phone, emergency contact) must be exactly 10 digits (numeric only). Enforced by Pydantic regex validation on the backend and `pattern="[0-9]{10}"` on the frontend.

---

## License

This project is for educational and institutional use.