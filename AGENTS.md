# Hospital Management System - AI Agent Context File

> **Note to AI Models and Agents**: Use this file as your single source of truth for the project topology, tech stack, and architectural guidelines. When asked to implement features, fix bugs, or maintain the codebase, refer to these rules to save tokens and maintain code consistency.

## 1. Tech Stack Overview

### Frontend
- **Framework**: React 19 + Vite
- **Routing**: `react-router-dom` (v6+)
- **State Management**: Redux Toolkit (`react-redux`, `@reduxjs/toolkit`) + local component state
- **Styling**: Tailwind CSS v4 + Vanilla CSS (`index.css`)
- **UI Components**: shadcn UI (Radix UI wrappers located in `src/components/ui`), Framer Motion, `lucide-react` for icons, `sonner` for toast notifications.
- **API Fetching**: Axios (configured in `src/services/apiServices.js` and `api.js`)

### Backend
- **Framework**: Node.js + Express v5 
- **Database**: MongoDB + Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with sliding session expiry via HTTP-only cookies/headers.
- **File Storage**: Cloudinary (via `multer-storage-cloudinary`)
- **Email/Notifications**: Nodemailer

---

## 2. Directory Architecture

The repository is structured as a monorepo separated into `Frontend` and `Backend`.

```text
/hospital-management-system
├── Frontend/
│   ├── src/
│   │   ├── auth/          # Constants and configs for roles and permissions
│   │   ├── components/    # Reusable UI (Alerts, Dialogs, Cards, Tables, Navbars)
│   │   │   ├── layout/    # High-level layouts (EmployeeAppLayout, DashboardLayout)
│   │   │   └── ui/        # Low-level Shadcn UI definitions
│   │   ├── hooks/         # Custom React hooks (`useAuth`, etc.)
│   │   ├── lib/           # Utility files, animation variants (`framer-motion`), API wrappers
│   │   ├── pages/         # Page-level components organized by Role
│   │   │   ├── admin/     # Settings, Ward, User, Bed Management
│   │   │   ├── auth/      # Logins and Registrations
│   │   │   ├── doctor/    # Doctor-specific views (Availability, Prescriptions)
│   │   │   ├── labtech/   # Lab technician dashboards
│   │   │   ├── nurse/     # Nurse ward boards and patient tracking
│   │   │   ├── patient/   # Public patient-facing portal and booking flow
│   │   │   ├── pharmacist/# Inventory and pharmacy history
│   │   │   ├── public/    # Open routes (Home, Find Doctors, About)
│   │   │   └── receptionist/ # Patient Registration and Appointment Desk
│   │   ├── routes/        # React Router guards (`EmployeeRoute.jsx`, `PatientRoute.jsx`)
│   │   ├── services/      # Axios API definition abstraction files
│   │   ├── store/         # Redux Toolkit Slices (`authSlice`, `billingSlice`, etc.)
│   │   └── utils/         # Helper functions / formatters
│   ├── index.html         # Vite HTML entry
│   ├── vite.config.js     # Vite Config
│   └── tailwind.css / postcss.config.js
├── Backend/
│   ├── src/
│   │   ├── config/        # Environment and DB config
│   │   ├── controllers/   # Express route handlers
│   │   ├── middlewares/   # JWT Auth Verification, Error Handling
│   │   ├── models/        # Mongoose Schemas (User, Patient, Appointment, Order, etc.)
│   │   ├── routes/        # Express router configs matching frontend APIs
│   │   ├── services/      # Abstraction logic (email generation, notifications)
│   │   └── utils/         # Helpers (error formatting, workflows)
│   └── server.js          # Entry execution file
└── AGENTS.md              # <— YOU ARE HERE
```

---

## 3. Core Concepts & Conventions 

### 3.1 Routing and Access Control
- React Router provides **Protected Routes** using Guider components (`<EmployeeRoute />`, `<PatientRoute />`).
- **User Roles**: The system divides users via role-based access control (RBAC):
  * **Patients**: `"patient"`
  * **Governance**: `"superadmin"`, `"admin"`, `"subadmin"` (Super Receptionist)
  * **Clinical**: `"doctor"`, `"nurse"`
  * **Operations**: `"receptionist"`, `"pharmacist"`, `"labTechnician"`
- If you modify routing properties, always update the route mappings in `Frontend/src/auth/constants.js`.

### 3.2 UI and Design Patterns
- **Colors**: Never use hardcoded colors (e.g. `text-slate-900` or `bg-white`). ALWAYS use the enterprise design system tokens bound to CSS variables. Examples: `bg-background`, `text-foreground`, `bg-card`, `bg-primary`, `text-primary-foreground`, `border-border`.
- **Animations**: For page transitions and complex list reveals, use `framer-motion` pulling constants from `Frontend/src/lib/animation-variants.js` rather than writing inline variants.
- **Responsiveness**: Ensure all views use Tailwind's `md:`, `lg:`, and `xl:` modifiers.

### 3.3 Coding Standards and Linting
- **Hooks Rules**: Follow React strict rules of hooks. Treat dependency arrays comprehensively (`react-hooks/exhaustive-deps`).
- **Purity**: Always test build compatibility via `npx vite build` in the frontend if massive dependency upgrades or layout component structures are redefined.
- **Linting**: Run `npx eslint .` within `/Frontend` when evaluating the hygiene of the React App. The application must maintain 0 errors and 0 warnings.
- **No Dead Code**: Do not define variables, functions, or imports that are unused.

### 3.4 API Integrations
- Frontend components do NOT call `fetch` or `axios` directly inside `useEffect` logic definitions.
- All requests proxy through `availabilityApi`, `appointmentApi`, `authService`, etc., mapped in `Frontend/src/services/`.
- If creating a new endpoint in Node/Express (`/Backend`), mirror its usage correctly in `/Frontend/src/services/apiServices.js`.

---

## 4. How to Contribute
If acting as an AI Agent processing a prompt to build a new feature:
1. Identify which layer (Frontend, Backend, or both) needs adjustment.
2. Rely first on **existing UI components** inside `src/components/ui` rather than generating new elements from scratch or inserting new generic tailwind divs.
3. Validate routing by examining `App.jsx`.
4. Ensure Redux state slices map to the API data schema smoothly.
5. Do not modify or destroy this context document unless instructed to update documentation reflecting deep architectural changes.
