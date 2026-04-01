# Medisphere Hospital Management System (HMS)

Enterprise‑grade MERN hospital management platform with role‑based workflows across clinical, operational, and governance teams. Designed around a single appointment lifecycle and a LIS‑style lab workflow, with real‑time updates and strong auditability.

---

## Highlights

- **Unified care + ops**: appointments, queue, clinical notes, lab, pharmacy, billing, admissions, wards & beds.
- **Role‑based workspaces** for superadmin, admin, subadmin, doctor, nurse, receptionist, lab technician, pharmacist, and patients.
- **LIS‑style lab workflow** with result entry, automated PDF reports, and patient portal release.
- **Shift scheduling + staff duty** with attendance, auto‑close, and availability dashboards.
- **Real‑time notifications** and operational alerts (Socket.IO).

Core lifecycle:

`booked → arrived → inConsultation → completed`

Queue is derived from appointments with status `arrived` (single source of truth).

---

## Tech Stack

**Frontend**
- React (Vite)
- Tailwind CSS + shadcn UI
- Redux Toolkit
- Axios
- Socket.IO client

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT auth
- Socket.IO
- PDFKit (bills, lab reports, prescriptions)
- Resend / SMTP mailer

---

## Monorepo Structure

```
hospital-management-system/
├─ Frontend/
│  ├─ src/
│  │  ├─ pages/          # Role-based pages
│  │  ├─ components/     # UI + layout components
│  │  ├─ services/       # API clients
│  │  └─ routes/guards/  # Role guards
│  └─ vite.config.js
├─ Backend/
│  ├─ src/
│  │  ├─ routes/         # Express routes
│  │  ├─ controllers/    # Business logic
│  │  ├─ models/         # Mongoose schemas
│  │  ├─ services/       # Mail, socket, notifications
│  │  └─ utils/          # PDF generators, helpers
│  └─ server.js
└─ README.md
```

---

## Modules & Roles

### Governance (Superadmin / Admin / Subadmin)
- User management & role access
- Departments, wards, beds, locations
- Shift schedules + staffing
- Audit history & analytics

### Clinical
- **Doctor**: appointments, consultation flow, prescriptions, lab orders & reports
- **Nurse**: ward board, tasks, vitals, notes, handover

### Operations
- **Receptionist**: patient onboarding, appointment desk, queue, billing handoff
- **Lab Technician**: accessioning, processing, result entry, report release
- **Pharmacist**: pharmacy orders + inventory

### Patient Portal
- Appointments, prescriptions, lab reports, bills

---

## Key Workflows

### Appointments & Queue
1. Patient books appointment
2. Receptionist marks **arrived**
3. Queue auto‑derives from `arrived`
4. Doctor starts consultation
5. Consultation completes → appointment completed

### Lab Workflow (LIS‑style)
1. **Doctor recommends tests** (patient sees recommendations)
2. **Order placed** by doctor or patient
3. **Sample collection** scheduled or marked collected onsite
4. **Accessioning & specimen QC**
5. **Processing**
6. **Result entry** per test item
7. **Report ready** → PDF generated
8. **Report release** (portal + pickup)

### Shift + Duty
1. Start duty (clock‑in)
2. End duty (clock‑out)
3. Auto‑close after grace/shift cap
4. Shift scheduling by admin/superadmin/subadmin
5. Staff view assigned shifts in shared calendar

---

## Video Consultation

- WebRTC based consultations for video appointments
- Patient + doctor see simultaneous streams
- Supports TURN configuration for production

**TURN Env (frontend)**:
```
VITE_TURN_URL=
VITE_TURN_USERNAME=
VITE_TURN_CREDENTIAL=
```

---

## PDF Generation

Generated PDFs:
- Hospital invoices
- Lab reports (LIS format)
- Lab orders
- Prescriptions

Branding + logo pulled from **Hospital Settings** (logo URL + contact).  
Fallback logo: `Backend/src/assets/Medisphere-logo.png`

---

## Local Development

### Backend
```bash
cd Backend
npm install
npm run dev
```

Backend default: `http://localhost:3500`

### Frontend
```bash
cd Frontend
npm install
npm run dev
```

Frontend default: `http://localhost:5173`

---

## Environment Variables

### Backend (`Backend/.env`)

Required:
- `MONGO_URI`
- `JWT_SECRET`
- `FRONTEND_URL`
- `BACKEND_URL`

Optional / Recommended:
- `PUBLIC_APP_URL`
- `PORT`
- `EMAIL_PROVIDER` (`smtp` or `resend`)
- `SMTP_HOST` (default `smtp.gmail.com`)
- `SMTP_PORT` (default `465`)
- `SMTP_FORCE_IPV4=true` (recommended on Render)
- `RESEND_API_KEY`
- `RESEND_FROM`
- `CLOUDINARY_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_SECRET`
- `SUPER_ADMIN_EMAIL`
- `SUPER_ADMIN_PASSWORD`
- `SUPER_ADMIN_NAME`

### Frontend (`Frontend/.env`)

```
VITE_API_URL=
VITE_TURN_URL=
VITE_TURN_USERNAME=
VITE_TURN_CREDENTIAL=
```

---

## Deployment Checklist

**Backend (Render / VPS)**
1. Set env vars
2. CORS allowlist includes frontend domain
3. Enable `SMTP_FORCE_IPV4=true` if Gmail SMTP
4. Confirm `/api/health` works

**Frontend (Vercel)**
1. `VITE_API_URL` points to backend base (no `/api`)
2. Domain configured in Vercel + DNS records resolved
3. Turn on Turn config if needed for video

**MongoDB Atlas**
1. Allowlist Render/Vercel IPs (or `0.0.0.0/0` for dev)
2. Create read/write DB user

---

## API Summary (Common)

**Auth**
- `POST /api/auth/patient/login`
- `POST /api/auth/employee/login`
- `POST /api/auth/patient/register`

**Appointments**
- `POST /api/appointments`
- `GET /api/appointments/doctor/today`
- `PUT /api/appointments/:id/arrive`
- `POST /api/appointments/:id/start-consultation`
- `PUT /api/appointments/:id/complete`

**Lab**
- `POST /api/lab-orders`
- `GET /api/lab-orders/doctor`
- `GET /api/lab-orders/my`
- `PUT /api/lab-orders/:id/status`
- `GET /api/lab-reports/my`

**Pharmacy**
- `POST /api/pharmacy-orders/from-prescription/:id`
- `GET /api/pharmacy-orders/my`

**Shifts & Duty**
- `POST /api/staff-duty/start`
- `POST /api/staff-duty/end`
- `GET /api/shifts/all`
- `POST /api/shifts/create`

---

## Seed Data (Optional)

Scripts exist in `Backend/src/scripts`:
- `seed_demo_data.js`
- `export_credentials.js` (CSV/XLSX)

Run:
```bash
cd Backend
node src/scripts/seed_demo_data.js
node src/scripts/export_credentials.js
```

---

## Security

- JWT auth
- Role‑based guards
- Route‑level RBAC
- Audit logging for critical actions

---

## License

Private / internal use only.
