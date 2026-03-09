# Hospital Management System - Complete API Testing Guide

## 📋 Overview

This guide provides step-by-step instructions to test all 60+ API endpoints across 15 route groups for the Hospital Management System backend.

**Backend Base URL**: `http://localhost:3500/api`

---

## 🔐 Authentication First

### 1. Register a New Patient
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Patient",
  "email": "patient@test.com",
  "password": "Test123456",
  "phone": "1234567890",
  "role": "patient"
}
```

### 2. Register a Doctor (Admin only)
```
POST /api/admin/users
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Dr. Sarah Smith",
  "email": "doctor@test.com",
  "password": "Test123456",
  "phone": "9876543210",
  "role": "doctor",
  "departmentId": "{department_id}"
}
```

### 3. Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "patient@test.com",
  "password": "Test123456"
}

Response:
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "patient_id",
    "email": "patient@test.com",
    "role": "patient"
  }
}
```

**Store the token** - Use it in the `Authorization: Bearer {token}` header for all subsequent requests.

---

## 📌 Route-by-Route Testing

### 1️⃣ AUTHENTICATION ROUTES (authRoutes.js)

#### Register Patient
```
POST /api/auth/register
Status: 201
Expected: User created with JWT token
```

#### Login
```
POST /api/auth/login
Status: 200
Expected: JWT token returned
```

#### Get Current User (Protected)
```
GET /api/auth/me
Authorization: Bearer {token}
Status: 200
Expected: Current user data
```

---

### 2️⃣ PATIENT ROUTES (patientRoutes.js)

#### Create Patient Profile
```
POST /api/patients
Authorization: Bearer {token}
Body:
{
  "name": "John Doe",
  "email": "john@test.com",
  "phone": "1234567890",
  "dateOfBirth": "1990-01-01",
  "gender": "Male",
  "bloodType": "O+",
  "address": "123 Main St"
}
Status: 201
Expected: Patient profile created
```

#### Get All Patients
```
GET /api/patients
Authorization: Bearer {admin_token}
Status: 200
Expected: Array of all patients
```

#### Get Patient by ID
```
GET /api/patients/{patientId}
Authorization: Bearer {token}
Status: 200
Expected: Single patient data
```

#### Update Patient Profile
```
PUT /api/patients/{patientId}
Authorization: Bearer {token}
Body:
{
  "phone": "9876543210",
  "address": "456 New St"
}
Status: 200
Expected: Updated patient data
```

#### Get Patient by User ID
```
GET /api/patients/user/{userId}
Authorization: Bearer {token}
Status: 200
Expected: Patient data linked to user
```

---

### 3️⃣ DOCTOR ROUTES (doctorRoutes.js)

#### Get All Doctors
```
GET /api/doctors
Status: 200
Expected: Array of all doctors with specializations
```

#### Get Doctor by ID
```
GET /api/doctors/{doctorId}
Status: 200
Expected: Single doctor details
```

#### Create Doctor (Admin)
```
POST /api/doctors
Authorization: Bearer {admin_token}
Body:
{
  "name": "Dr. Ahmed Khan",
  "email": "ahmed@test.com",
  "phone": "9876543210",
  "specialization": "Cardiology",
  "departmentId": "{department_id}",
  "qualification": "MD"
}
Status: 201
Expected: Doctor created
```

#### Update Doctor (Admin)
```
PUT /api/doctors/{doctorId}
Authorization: Bearer {admin_token}
Body:
{
  "specialization": "Neurology"
}
Status: 200
Expected: Updated doctor data
```

#### Delete Doctor (Admin)
```
DELETE /api/doctors/{doctorId}
Authorization: Bearer {admin_token}
Status: 200
Expected: Doctor deleted
```

#### Get Doctor Available Slots
```
GET /api/doctors/{doctorId}/slots?date=2024-12-25
Status: 200
Expected: Array of available time slots for date
```

---

### 4️⃣ APPOINTMENT ROUTES (appointmentRoutes.js)

#### Create Appointment
```
POST /api/appointments
Authorization: Bearer {patient_token}
Body:
{
  "doctorId": "{doctor_id}",
  "patientId": "{patient_id}",
  "appointmentDate": "2024-12-25",
  "appointmentTime": "10:00",
  "reason": "Regular checkup"
}
Status: 201
Expected: Appointment created
```

#### Get All Appointments (With Filters)
```
GET /api/appointments?status=scheduled&doctorId={doctorId}
Authorization: Bearer {token}
Status: 200
Expected: Filtered appointments list
```

#### Get Appointment by ID
```
GET /api/appointments/{appointmentId}
Authorization: Bearer {token}
Status: 200
Expected: Single appointment details
```

#### Complete Appointment (Doctor)
```
PUT /api/appointments/{appointmentId}/complete
Authorization: Bearer {doctor_token}
Body:
{
  "notes": "Patient is healthy"
}
Status: 200
Expected: Appointment marked complete
```

#### Cancel Appointment
```
PUT /api/appointments/{appointmentId}/cancel
Authorization: Bearer {token}
Body:
{
  "reason": "Scheduling conflict"
}
Status: 200
Expected: Appointment cancelled
```

#### Get Today's Appointments (Doctor)
```
GET /api/appointments/doctor/today
Authorization: Bearer {doctor_token}
Status: 200
Expected: Today's appointments for doctor
```

#### Get All Doctor Appointments
```
GET /api/appointments/doctor/all
Authorization: Bearer {doctor_token}
Status: 200
Expected: All appointments for doctor
```

#### Get Patient Appointment History
```
GET /api/appointments/patient-history/{patientId}
Authorization: Bearer {token}
Status: 200
Expected: All appointments for patient
```

---

### 5️⃣ PRESCRIPTION ROUTES (prescriptionRoutes.js)

#### Create Prescription (Doctor)
```
POST /api/prescriptions
Authorization: Bearer {doctor_token}
Body:
{
  "appointmentId": "{appointment_id}",
  "patientId": "{patient_id}",
  "medicines": [
    {
      "medicineName": "Aspirin",
      "dosage": "500mg",
      "frequency": "2 times daily",
      "duration": "7 days"
    }
  ],
  "notes": "Take with food"
}
Status: 201
Expected: Prescription created
```

#### Get My Prescriptions (Patient)
```
GET /api/prescriptions/my
Authorization: Bearer {patient_token}
Status: 200
Expected: All prescriptions for patient
```

#### Get Prescription by Appointment
```
GET /api/prescriptions/appointment/{appointmentId}
Authorization: Bearer {token}
Status: 200
Expected: Prescription for that appointment
```

#### Get Prescription PDF
```
GET /api/prescriptions/pdf/{prescriptionId}
Authorization: Bearer {token}
Status: 200
Expected: PDF file download
```

#### Get Prescription by ID
```
GET /api/prescriptions/{prescriptionId}
Authorization: Bearer {token}
Status: 200
Expected: Prescription details
```

---

### 6️⃣ REPORT ROUTES (reportRoutes.js)

#### Upload Doctor Report
```
POST /api/reports
Authorization: Bearer {doctor_token}
Content-Type: multipart/form-data

{
  "patientId": "{patient_id}",
  "appointmentId": "{appointment_id}",
  "reportType": "Diagnosis",
  "file": <binary_file>,
  "description": "Patient diagnosis report"
}
Status: 201
Expected: Report uploaded
```

#### Get My Reports (Doctor)
```
GET /api/reports/my
Authorization: Bearer {doctor_token}
Status: 200
Expected: All reports created by doctor
```

#### Get Reports by Patient
```
GET /api/reports/patient/{patientId}
Authorization: Bearer {token}
Status: 200
Expected: All reports for patient
```

#### Get Report by ID
```
GET /api/reports/{reportId}
Authorization: Bearer {token}
Status: 200
Expected: Single report details
```

#### Download Report
```
GET /api/reports/{reportId}/download
Authorization: Bearer {token}
Status: 200
Expected: Report file download
```

---

### 7️⃣ LAB REPORT ROUTES (labReportRoutes.js)

#### Upload Lab Report
```
POST /api/lab-reports/upload
Authorization: Bearer {doctor_token}
Content-Type: multipart/form-data

{
  "patientId": "{patient_id}",
  "testName": "Blood Test",
  "file": <binary_file>,
  "testDate": "2024-12-20"
}
Status: 201
Expected: Lab report uploaded
```

#### Get My Lab Reports (Patient)
```
GET /api/lab-reports/my
Authorization: Bearer {patient_token}
Status: 200
Expected: All lab reports for patient
```

#### Get Lab Reports by Patient
```
GET /api/lab-reports/patient/{patientId}
Authorization: Bearer {token}
Status: 200
Expected: All lab reports for patient
```

#### Get Lab Report by ID
```
GET /api/lab-reports/{reportId}
Authorization: Bearer {token}
Status: 200
Expected: Single lab report details
```

#### Download Lab Report
```
GET /api/lab-reports/{reportId}/download
Authorization: Bearer {token}
Status: 200
Expected: Lab report file download
```

---

### 8️⃣ BILLING ROUTES (billingRoutes.js)

#### Create Invoice (Admin/Receptionist)
```
POST /api/billing
Authorization: Bearer {admin_token}
Body:
{
  "patientId": "{patient_id}",
  "appointmentId": "{appointment_id}",
  "services": [
    {
      "description": "Consultation",
      "amount": 50
    }
  ],
  "totalAmount": 50,
  "dueDate": "2024-12-31"
}
Status: 201
Expected: Invoice created
```

#### Get My Invoices (Patient)
```
GET /api/billing/my
Authorization: Bearer {patient_token}
Status: 200
Expected: All invoices for patient
```

#### Get Invoices by Patient
```
GET /api/billing/patient/{patientId}
Authorization: Bearer {admin_token}
Status: 200
Expected: All invoices for patient
```

#### Get Invoice by ID
```
GET /api/billing/{invoiceId}
Authorization: Bearer {token}
Status: 200
Expected: Single invoice details
```

#### Make Payment
```
PUT /api/billing/pay/{invoiceId}
Authorization: Bearer {patient_token}
Body:
{
  "paymentMethod": "credit_card",
  "amount": 50,
  "paymentDate": "2024-12-20"
}
Status: 200
Expected: Payment processed, invoice marked paid
```

---

### 9️⃣ ADMIN ROUTES (adminRoutes.js)

#### Get Admin Dashboard Data
```
GET /api/admin/dashboard
Authorization: Bearer {admin_token}
Status: 200
Expected: Dashboard statistics (appointments, patients, revenue, etc.)
```

#### Create User (Admin)
```
POST /api/admin/users
Authorization: Bearer {admin_token}
Body:
{
  "name": "Dr. New Doctor",
  "email": "newdoctor@test.com",
  "password": "Secure123456",
  "phone": "5555555555",
  "role": "doctor",
  "departmentId": "{department_id}"
}
Status: 201
Expected: New user created
```

#### Get All Users (Admin)
```
GET /api/admin/users
Authorization: Bearer {admin_token}
Status: 200
Expected: All users in system
```

---

### 🔟 DEPARTMENT ROUTES (departmentRoutes.js)

#### Get All Departments
```
GET /api/department
Status: 200
Expected: All departments
```

#### Create Department (Admin)
```
POST /api/department/create
Authorization: Bearer {admin_token}
Body:
{
  "name": "Pediatrics",
  "description": "Children medical care",
  "head": "Dr. Jane Smith"
}
Status: 201
Expected: Department created
```

#### Update Department (Admin)
```
PATCH /api/department/update/{departmentId}
Authorization: Bearer {admin_token}
Body:
{
  "name": "Pediatrics and Child Health"
}
Status: 200
Expected: Department updated
```

#### Delete Department (Admin)
```
DELETE /api/department/delete/{departmentId}
Authorization: Bearer {admin_token}
Status: 200
Expected: Department deleted
```

---

### 1️⃣1️⃣ DOCTOR AVAILABILITY ROUTES (availabilityRoutes.js)

#### Set Doctor Availability (Doctor)
```
POST /api/availability
Authorization: Bearer {doctor_token}
Body:
{
  "doctorId": "{doctor_id}",
  "dayOfWeek": "Monday",
  "startTime": "09:00",
  "endTime": "17:00",
  "slotDuration": 30
}
Status: 201
Expected: Availability schedule created
```

#### Get Doctor Availability
```
GET /api/availability/{doctorId}
Status: 200
Expected: Doctor's availability schedule
```

#### Update Availability (Doctor)
```
PUT /api/availability/{availabilityId}
Authorization: Bearer {doctor_token}
Body:
{
  "startTime": "10:00"
}
Status: 200
Expected: Availability updated
```

---

### 1️⃣2️⃣ BED ROUTES (bedRoutes.js)

#### Get All Beds
```
GET /api/beds
Status: 200
Expected: All hospital beds with status
```

#### Create Bed (Admin)
```
POST /api/beds
Authorization: Bearer {admin_token}
Body:
{
  "bedNumber": "101",
  "wardType": "General",
  "status": "available"
}
Status: 201
Expected: Bed created
```

#### Assign Bed to Patient (Admin)
```
PUT /api/beds/assign/{bedId}
Authorization: Bearer {admin_token}
Body:
{
  "patientId": "{patient_id}",
  "admissionDate": "2024-12-20"
}
Status: 200
Expected: Bed assigned
```

#### Discharge Patient (Admin)
```
PUT /api/beds/discharge/{bedId}
Authorization: Bearer {admin_token}
Body:
{
  "dischargeDate": "2024-12-25"
}
Status: 200
Expected: Patient discharged, bed freed
```

---

### 1️⃣3️⃣ PHARMACY ROUTES (pharmacyRoutes.js)

#### Get All Medicines
```
GET /api/medicines
Status: 200
Expected: All medicines in pharmacy
```

#### Add Medicine (Admin)
```
POST /api/medicines
Authorization: Bearer {admin_token}
Body:
{
  "medicineName": "Paracetamol",
  "dosage": "500mg",
  "stock": 100,
  "price": 5.50,
  "expiryDate": "2025-12-31"
}
Status: 201
Expected: Medicine added
```

#### Update Medicine (Admin)
```
PUT /api/medicines/{medicineId}
Authorization: Bearer {admin_token}
Body:
{
  "stock": 95,
  "price": 5.75
}
Status: 200
Expected: Medicine updated
```

#### Delete Medicine (Admin)
```
DELETE /api/medicines/{medicineId}
Authorization: Bearer {admin_token}
Status: 200
Expected: Medicine deleted
```

---

### 1️⃣4️⃣ SLOT ROUTES (slotRoutes.js)

#### Get Available Slots
```
GET /api/slots/available?doctorId={doctorId}&date=2024-12-25
Status: 200
Expected: Available appointment slots
```

#### Book Slot
```
POST /api/slots/book
Authorization: Bearer {patient_token}
Body:
{
  "doctorId": "{doctor_id}",
  "slotTime": "10:00",
  "appointmentDate": "2024-12-25"
}
Status: 201
Expected: Slot booked
```

---

### 1️⃣5️⃣ TEST ROUTES (testRoutes.js)

#### Health Check
```
GET /api/test/health
Status: 200
Expected: { "status": "Server is running" }
```

#### Get Server Status
```
GET /api/test/status
Status: 200
Expected: Detailed server status info
```

---

## 🧪 Testing Scenarios

### ✅ Test Case 1: Complete Patient Journey
1. Register patient
2. Login
3. Book appointment with doctor
4. Get appointment confirmation
5. View prescriptions after appointment
6. View invoices
7. Make payment

### ✅ Test Case 2: Complete Doctor Journey
1. Admin creates doctor account
2. Doctor login
3. Set availability
4. View today's appointments
5. Complete appointment
6. Create prescription
7. Upload report

### ✅ Test Case 3: Complete Admin Journey
1. Admin login
2. Create new department
3. Create new doctor
4. View dashboard statistics
5. Create invoice
6. Manage beds
7. Add medicines

### ✅ Test Case 4: Error Handling
1. Try accessing protected routes without token (401)
2. Try accessing endpoints without permission (403)
3. Submit invalid data (400)
4. Try accessing non-existent resource (404)

---

## 📊 Testing Checklist

- [ ] All 15 route groups working
- [ ] All 60+ endpoints responding correctly
- [ ] Authentication tokens working
- [ ] Role-based access control enforced
- [ ] Error responses proper (4xx, 5xx)
- [ ] File uploads working (reports, lab reports)
- [ ] PDF generation working (prescriptions)
- [ ] Database operations working (CRUD)
- [ ] Validation working (required fields, data types)
- [ ] Email notifications sending
- [ ] Payment integration working
- [ ] File downloads working

---

## 🛠️ Troubleshooting

### Token Issues
- Ensure token is included in Authorization header
- Format: `Authorization: Bearer {token}`
- Token expires after set time - login again if needed

### CORS Issues
- Check Backend CORS configuration
- Ensure Frontend is making requests to correct API URL

### File Upload Issues
- Ensure Content-Type is multipart/form-data
- Check file size limits
- Verify Cloudinary credentials

### Database Issues
- Ensure MongoDB is running
- Check connection string in .env
- Verify required fields in request body

---

**Backend URL**: http://localhost:3500/api  
**Frontend URL**: http://localhost:5173  
**Status**: Ready for testing ✅
