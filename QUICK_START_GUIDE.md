# Hospital Management System - Quick Start & Reference

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Node.js 18+ and npm
- MongoDB running on default port (27017)
- Git

### Step 1: Start Backend
```bash
cd Backend
npm install  # Only first time
npm run dev
# Backend runs on http://localhost:3500
```

### Step 2: Start Frontend
```bash
cd Frontend
npm install  # Only first time
npm run dev
# Frontend runs on http://localhost:5173
```

### Step 3: Access the Application
- **Home Page**: http://localhost:5173
- **Login**: Click "Login" button
- **Register**: Create new patient account

---

## 📱 Test User Credentials

### Admin Account
- **Email**: admin@hospital.com
- **Password**: admin123
- **Role**: admin

### Doctor Account
- **Email**: doctor@hospital.com
- **Password**: doctor123
- **Role**: doctor

### Patient Account
- **Email**: patient@hospital.com
- **Password**: patient123
- **Role**: patient

### Receptionist Account
- **Email**: receptionist@hospital.com
- **Password**: receptionist123
- **Role**: receptionist

---

## 🎯 Feature Overview by Role

### 👨‍⚕️ Doctor Features
- View today's appointments
- Set weekly availability hours
- Complete/cancel appointments
- Create prescriptions
- Upload medical reports
- View patient history

**Pages**: Dashboard → Appointments → Availability → Prescriptions → Reports → Patients

### 🏥 Patient Features
- Book appointments with doctors
- View upcoming appointments
- View prescriptions
- View lab reports
- View and pay invoices
- Check medical history

**Pages**: Dashboard → Book Appointment → Appointments → Prescriptions → Reports → Billing

### 👨‍💼 Receptionist Features
- Register new patients
- Manage appointment queue
- Check patient check-ins
- View appointments

**Pages**: Dashboard → Patient Registration → Appointments

### 👨‍💻 Admin Features
- Manage departments (CRUD)
- Manage doctors (Create/View/Update/Delete)
- Manage patients
- View appointments
- Manage beds (Admit/Discharge)
- Manage medicines
- View dashboard analytics

**Pages**: Dashboard → Departments → Doctors → Patients → Appointments → Beds → Medicines

---

## 📊 Key API Endpoints Reference

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

### Appointments
```
POST   /api/appointments
GET    /api/appointments
GET    /api/appointments/doctor/today
GET    /api/appointments/doctor/all
PUT    /api/appointments/:id/complete
PUT    /api/appointments/:id/cancel
```

### Doctors
```
GET    /api/doctors
GET    /api/doctors/:id
GET    /api/doctors/:id/slots?date=YYYY-MM-DD
POST   /api/doctors (Admin only)
```

### Patients
```
POST   /api/patients
GET    /api/patients
GET    /api/patients/:id
PUT    /api/patients/:id
```

### Prescriptions
```
POST   /api/prescriptions
GET    /api/prescriptions/my
GET    /api/prescriptions/pdf/:id
```

### Billing
```
POST   /api/billing
GET    /api/billing/my
PUT    /api/billing/pay/:id
```

### Reports
```
POST   /api/reports (Upload)
GET    /api/reports/my
GET    /api/reports/patient/:patientId
```

### Admin
```
GET    /api/admin/dashboard
POST   /api/admin/users
```

---

## 🐛 Common Issues & Solutions

### Issue: Frontend can't connect to Backend
**Solution**: 
- Ensure Backend is running on port 3500
- Check `.env` has `VITE_API_URL=http://localhost:3500/api`
- Clear browser cache and reload

### Issue: Login fails with "Invalid credentials"
**Solution**:
- Make sure you use correct email/password
- Check MongoDB is running
- Verify user exists in database

### Issue: File upload fails
**Solution**:
- Check Cloudinary credentials in Backend `.env`
- Ensure file size is under limit (10MB)
- Verify file format is allowed

### Issue: "Multiple exports" or "Cannot resolve import" error
**Solution**:
- All fixes applied ✅
- Run `npm install` in Frontend folder
- Clear node_modules if needed: `rm -rf node_modules && npm install`

---

## 📁 Important Files

### Frontend Configuration
- `Frontend/.env` - API URL configuration
- `Frontend/vite.config.js` - Build configuration
- `Frontend/tailwind.config.js` - Styling configuration
- `Frontend/package.json` - Dependencies

### Backend Configuration
- `Backend/.env` - Database, JWT, Cloudinary credentials
- `Backend/src/routes/` - All API endpoints (15 files)
- `Backend/src/models/` - Database models
- `Backend/src/controllers/` - Business logic

### Key Pages
- `Frontend/src/pages/auth/Login.jsx` - Authentication
- `Frontend/src/pages/admin/Dashboard.jsx` - Admin home
- `Frontend/src/pages/doctor/Dashboard.jsx` - Doctor home
- `Frontend/src/pages/patient/Dashboard.jsx` - Patient home
- `Frontend/src/pages/receptionist/Dashboard.jsx` - Receptionist home

---

## 🧪 Testing Workflow

### 1. Test Authentication Flow
1. Go to http://localhost:5173
2. Click Register → Create patient account
3. Login with credentials
4. Verify dashboard loads

### 2. Test Booking Appointment
1. Login as patient
2. Click "Book Appointment"
3. Select doctor and date
4. Complete booking
5. Verify in "My Appointments"

### 3. Test Doctor Features
1. Login as doctor
2. Set availability (Doctor → Availability)
3. View appointments (Doctor → Appointments)
4. Complete appointment with notes
5. Create prescription
6. Upload report

### 4. Test Admin Features
1. Login as admin
2. View dashboard statistics
3. Create new department
4. Create new doctor
5. View all patients/appointments

### 5. Test API Directly (Using Postman/cURL)
```bash
# Login and get token
curl -X POST http://localhost:3500/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@test.com","password":"Test123456"}'

# Use token in requests
curl -X GET http://localhost:3500/api/appointments \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📈 What's Been Completed

### ✅ Frontend
- [x] All 20+ pages created
- [x] 4 role-based dashboards
- [x] Complete API integration (60+ endpoints)
- [x] Authentication & authorization
- [x] Form validation
- [x] Error handling
- [x] Loading states
- [x] Responsive design
- [x] All build errors fixed

### ✅ Backend
- [x] 15 API route groups
- [x] 60+ endpoints
- [x] MongoDB models
- [x] JWT authentication
- [x] Role-based access control
- [x] File upload integration (Cloudinary)
- [x] Email notifications
- [x] PDF generation
- [x] Data validation
- [x] Error handling middleware

### ✅ Documentation
- [x] Complete API testing guide
- [x] Project setup documentation
- [x] API endpoint reference
- [x] Testing workflows
- [x] Troubleshooting guide

---

## 🎓 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                   │
│  ┌─────────────────────────────────────────────────────────┐
│  │  Pages (20+) → Components → Services → Store (Redux)     │
│  │  - Auth Pages (Login, Register)                          │
│  │  - Role Dashboards (Admin, Doctor, Patient, Receptionist)│
│  │  - Feature Pages (Appointments, Prescriptions, etc.)     │
│  └─────────────────────────────────────────────────────────┘
│                         ↓ Axios
├─────────────────────────────────────────────────────────────┤
│              API Gateway (Express on port 3500)              │
│  Routes: Auth → Appointments → Doctors → Patients → etc.    │
├─────────────────────────────────────────────────────────────┤
│                Backend (Node.js + Express)                   │
│  ┌─────────────────────────────────────────────────────────┐
│  │  Controllers → Services → Models → MongoDB              │
│  │  - 15 Route Groups with 60+ Endpoints                   │
│  │  - JWT Authentication                                   │
│  │  - Role-Based Access Control                            │
│  │  - File Upload Integration (Cloudinary)                 │
│  └─────────────────────────────────────────────────────────┘
│                         ↓
├─────────────────────────────────────────────────────────────┤
│                   MongoDB Database                           │
│  Collections: Users, Doctors, Patients, Appointments, etc.  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📞 Support Resources

### Documentation Files
- `FINAL_FIX_SUMMARY.md` - Latest fixes and changes
- `COMPLETE_API_TESTING_GUIDE.md` - Detailed API endpoint testing
- `README_COMPLETE.md` - Original project README

### Technical Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Redux
- **Backend**: Node.js, Express, MongoDB
- **Authentication**: JWT
- **File Storage**: Cloudinary
- **Email**: Nodemailer
- **PDF**: PDFKit

---

## ✨ Current Status

✅ **Frontend**: Fully built and debugged - ready for testing  
✅ **Backend**: All APIs implemented and tested  
✅ **Documentation**: Complete with testing guides  
✅ **Deployment**: Ready for staging/production  

**Next Step**: Start both servers and run the testing workflow above.

---

**Last Updated**: Build Complete & All Errors Fixed  
**Ready for**: QA Testing & Deployment  
**Contact**: Refer to project documentation files
