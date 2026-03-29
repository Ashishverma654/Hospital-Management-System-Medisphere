# Medisphere Hospital Management System (HMS)

Enterprise‑grade MERN hospital management platform with role‑based workflows across clinical, operational, and governance teams.

## Overview

Medisphere unifies patient care and hospital operations into a single system with:
- Patient onboarding, appointments, queue, and consultation lifecycle
- Doctor dashboard, prescriptions, lab orders, and lab reports
- Nursing tasks, vitals, notes, handovers
- Pharmacy orders and inventory
- Admissions, wards, beds, and billing
- Staff duty, shifts, scheduling, and availability
- Notifications, audit logs, and analytics

Core lifecycle:
`booked → arrived → inConsultation → completed`

Queue is derived from appointments (status = `arrived`) and token/queue flow stays intact.

---

## Tech Stack

**Frontend**
- React 19 + Vite
- Tailwind CSS v4 + Shadcn UI
- Redux Toolkit
- Axios (centralized in `src/services`)

**Backend**
- Node.js + Express v5
- MongoDB + Mongoose
- JWT auth
- Socket.IO
- PDFKit for documents
- Nodemailer/Resend for email (SMTP IPv4 fallback supported)

---

## Directory Structure (Monorepo)

```
hospital-management-system/
├─ Frontend/
│  ├─ src/
│  │  ├─ pages/          # role-based pages (admin, doctor, nurse, etc.)
│  │  ├─ services/       # axios API wrappers
│  │  ├─ components/     # UI + layouts
│  │  └─ routes/guards/  # role-based route guards
│  └─ vite.config.js
├─ Backend/
│  ├─ src/
│  │  ├─ routes/         # express routes
│  │  ├─ controllers/    # business logic
│  │  ├─ models/         # mongoose schemas
│  │  ├─ services/       # email, socket, notifications
│  │  └─ utils/          # PDF generators, helpers
│  └─ server.js
└─ README.md
```

---

## Roles & Modules

**Governance**
- Superadmin / Admin / Subadmin
- User management, hospital settings, wards/beds, shifts & scheduling, staff availability, audit

**Clinical**
- Doctor: appointments, consultations, prescriptions, lab orders, reports
- Nurse: ward board, tasks, vitals, notes, handovers

**Operations**
- Receptionist: patient registration, appointment desk, queue
- Lab Technician: accessioning, processing, report release
- Pharmacist: pharmacy orders, inventory

**Patient**
- Portal with appointments, prescriptions, lab reports, billing

---

## Local Development

### 1) Backend

```bash
cd Backend
npm install
npm run dev
```

Backend defaults: `http://localhost:3500`

### 2) Frontend

```bash
cd Frontend
npm install
npm run dev
```

Frontend defaults: `http://localhost:5173`

---

## Environment Variables

### Backend (`Backend/.env`)

Required:
- `MONGO_URI`
- `JWT_SECRET`
- `FRONTEND_URL` (e.g. `http://localhost:5173`)
- `BACKEND_URL` (e.g. `http://localhost:3500/api`)

Optional / Recommended:
- `PUBLIC_APP_URL`
- `PORT`
- `CLOUDINARY_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_SECRET`
- `EMAIL_USER`
- `EMAIL_PASS`
- `RESEND_API_KEY`
- `RESEND_FROM`
- `EMAIL_PROVIDER` (`smtp` or `resend`)
- `SMTP_ONLY=true|false`
- `SMTP_HOST` (default: `smtp.gmail.com`)
- `SMTP_PORT` (default: `465`)
- `SMTP_FORCE_IPV4=true|false` (recommended `true` on Render)
- `SUPER_ADMIN_EMAIL`
- `SUPER_ADMIN_PASSWORD`
- `SUPER_ADMIN_NAME`
- `NO_SHOW_ENABLED=true|false`
- `NO_SHOW_GRACE_MINUTES`
- `NO_SHOW_INTERVAL_MINUTES`
- `QUEUE_AVG_WAIT_MINUTES`

### Frontend (`Frontend/.env`)

- `VITE_API_URL` (e.g. `http://localhost:3500`)
- `VITE_VIDEO_CALL_GRACE_MINUTES` (optional)
- `VITE_NO_SHOW_GRACE_MINUTES` (optional)

---

## Key Workflows

### Appointments & Queue
1. Patient books appointment
2. Receptionist marks **arrived**
3. Queue derives from `arrived`
4. Doctor starts consultation
5. Consultation completes → appointment completed

### Lab Report Workflow (LIS‑style)
1. Doctor creates lab order
2. Lab tech schedules collection & accessioning
3. Lab tech marks sample collected → processing
4. Results entered per test
5. Report marked ready → PDF auto‑generated
6. Release to portal after payment

### Staff Duty, Shifts & Scheduling
1. Start duty (clock‑in)
2. End duty (clock‑out)
3. Auto‑close after grace/shift cap
4. Shift schedule managed by admin/superadmin/subadmin (role‑based limits)
5. Staff view their scheduled shifts in the shared calendar

---

## PDF Generation

Generated PDFs:
- Invoices (hospital bill format)
- Lab reports (LIS style)
- Lab orders
- Prescriptions

Branding is pulled from **Hospital Settings** (logo URL + contact).  
Fallback logo is `Backend/src/assets/Medisphere-logo.png`.

---

## Socket.IO

Real‑time updates for notifications and operational flow.  
Socket base uses `VITE_API_URL` (frontend) and is initialized in `Backend/src/services/socketService.js`.

---

## Scripts

Backend:
```bash
npm run dev
npm start
```

Frontend:
```bash
npm run dev
npm run lint
```

---

## Deployment Notes

Recommended:
- Backend on Render / VPS
- Frontend on Vercel
- MongoDB Atlas

Make sure:
- `FRONTEND_URL` / `BACKEND_URL` are correct
- CORS whitelist includes frontend
- Socket URL matches backend base
- If using Gmail SMTP on Render, set `SMTP_FORCE_IPV4=true` to avoid IPv6 `ENETUNREACH`

---

## Security

- JWT auth with role‑based guards
- Server checks role access on all routes
- File uploads restricted by role
- Sensitive actions logged in audit

---

## API Summary (Key Routes)

> Note: Full route definitions live in `Backend/src/routes`. This list highlights the most used endpoints.

**Auth**
- `POST /api/auth/patient/login`
- `POST /api/auth/employee/login`
- `POST /api/auth/patient/register`
- `POST /api/auth/account/find`
- `POST /api/auth/password/forgot`
- `POST /api/auth/password/reset`

**Users & Profiles**
- `GET /api/users/me`
- `PUT /api/users/me`
- `PUT /api/users/change-password`
- `PUT /api/users/profile-image`

**Appointments**
- `POST /api/appointments`
- `GET /api/appointments`
- `PUT /api/appointments/:id/cancel`
- `PUT /api/appointments/:id/arrive`
- `POST /api/appointments/:id/start-consultation`
- `PUT /api/appointments/:id/complete`
- `GET /api/appointments/doctor/today`
- `GET /api/appointments/doctor/all`

**Doctors**
- `GET /api/doctors`
- `GET /api/doctors/:id`
- `GET /api/doctors/:id/slots`
- `GET /api/doctors/admin`
- `POST /api/doctors/admin`

**Patients**
- `GET /api/patients`
- `GET /api/patients/admin/list`
- `GET /api/patients/admin/board`
- `GET /api/patients/admin/:id`
- `PUT /api/patients/admin/:id`

**Lab**
- `GET /api/tests`
- `POST /api/tests`
- `GET /api/test-prices`
- `POST /api/test-prices`
- `POST /api/lab-orders`
- `GET /api/lab-orders/doctor`
- `GET /api/lab-orders/my`
- `PUT /api/lab-orders/:id/status`
- `GET /api/lab-reports/my`
- `GET /api/lab-reports/patient/:id`

**Pharmacy**
- `GET /api/medicines`
- `POST /api/medicines`
- `POST /api/pharmacy-orders/from-prescription/:id`
- `GET /api/pharmacy-orders/my`

**Wards / Beds / Admissions**
- `GET /api/wards`
- `POST /api/wards`
- `GET /api/beds`
- `POST /api/beds`
- `PUT /api/beds/assign/:id`
- `PUT /api/beds/discharge/:id`
- `GET /api/admissions`
- `POST /api/admissions`

**Scheduling**
- `GET /api/shifts`
- `POST /api/shifts`
- `GET /api/shift-schedules/all`
- `GET /api/shift-schedules/my`
- `POST /api/shift-schedules/create`

**Billing**
- `GET /api/billing`
- `POST /api/billing`
- `GET /api/billing/:id`
- `GET /api/billing/:id/pdf`
- `PUT /api/billing/pay/:id`

**Notifications**
- `GET /api/notifications/employee/my`
- `PATCH /api/notifications/employee/read-all`
- `PATCH /api/notifications/employee/:id/read`

---

## Role Access Matrix (High Level)

| Role | Dashboard | Appointments | Lab Orders | Lab Reports | Billing | Wards/Beds | Shifts/Schedule | Staff Mgmt | Analytics |
|------|-----------|--------------|------------|-------------|---------|------------|-----------------|------------|-----------|
| Superadmin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Subadmin | ✅ | ✅ (front desk) | ✅ (view) | ✅ (view) | ✅ | ✅ | ✅ | ✅ (limited) | ✅ (view) |
| Doctor | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ (view) | ❌ | ❌ |
| Nurse | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ (view/ops) | ✅ (view) | ❌ | ❌ |
| Receptionist | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ (view) | ❌ | ❌ |
| Lab Technician | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ (view) | ❌ | ❌ |
| Pharmacist | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (view) | ❌ | ❌ |

> Exact access enforced in route guards + backend RBAC.

---

## Deployment Checklist (Render + Vercel + Atlas)

**Backend (Render)**
1. Set env vars (see above).
2. Enable `SMTP_FORCE_IPV4=true` if using Gmail SMTP.
3. Confirm `FRONTEND_URL` matches deployed Vercel app.
4. Check health: `GET /api/health`.

**Frontend (Vercel)**
1. Set `VITE_API_URL` to backend base URL (no `/api`).
2. Ensure socket base matches backend domain.

**MongoDB Atlas**
1. Add Render outbound IPs (or `0.0.0.0/0` for dev).
2. Verify DB user permissions for read/write.

---

## Demo Data & Credentials (Optional)

Seed scripts are available in `Backend/src/scripts`:
- `seed_demo_data.js` (generates realistic staff/patient history)
- `export_credentials.js` (exports credentials to CSV/XML/XLSX in repo root)

Run (example):
```bash
cd Backend
node src/scripts/seed_demo_data.js
node src/scripts/export_credentials.js
```


## License

Private / internal use.

