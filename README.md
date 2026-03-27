# MediFlow Hospital Management System (HMS)

Enterprise‑grade MERN hospital management platform with role‑based workflows across clinical, operational, and governance teams.

## Overview

MediFlow unifies patient care and hospital operations into a single system with:
- Patient onboarding, appointments, queue, and consultation lifecycle
- Doctor dashboard, prescriptions, lab orders, and lab reports
- Nursing tasks, vitals, notes, handovers
- Pharmacy orders and inventory
- Admissions, wards, beds, and billing
- Staff duty, shifts, and availability
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
- Nodemailer/Resend for email

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
- User management, hospital settings, wards/beds, shifts, staff availability, audit

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

### Staff Duty & Shifts
1. Start duty (clock‑in)
2. End duty (clock‑out)
3. Auto‑close after grace/shift cap
4. Shift schedule managed by admin/superadmin

---

## PDF Generation

Generated PDFs:
- Invoices (hospital bill format)
- Lab reports (LIS style)
- Lab orders
- Prescriptions

Branding is pulled from **Hospital Settings** (logo URL + contact).  
Fallback logo is `Backend/src/assets/mediflow-logo.png`.

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

---

## Security

- JWT auth with role‑based guards
- Server checks role access on all routes
- File uploads restricted by role
- Sensitive actions logged in audit

---

## License

Private / internal use.

