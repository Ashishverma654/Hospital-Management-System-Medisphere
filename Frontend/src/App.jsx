import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './components/Layout/PublicLayout';
import DashboardLayout from './components/Layout/DashboardLayout';
import PlaceholderPage from './components/PlaceholderPage';

// Public / Auth Pages
import Home from './pages/public/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import EmployeeForgotPassword from './pages/auth/EmployeeForgotPassword';

// Role Dashboards
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import DoctorDashboard from './pages/doctor/Dashboard';
import PatientDashboard from './pages/patient/Dashboard';
import ReceptionistDashboard from './pages/receptionist/Dashboard';
import NurseDashboard from './pages/nurse/Dashboard';
import LabTechDashboard from './pages/labtech/Dashboard';
import PharmacistDashboard from './pages/pharmacist/Dashboard';

// Admin pages
import DepartmentManagement from './pages/admin/DepartmentManagement';
import UserManagement from './pages/admin/UserManagement';
import DoctorManagement from './pages/admin/DoctorManagement';
import PatientManagement from './pages/admin/PatientManagement';
import AppointmentManagement from './pages/admin/AppointmentManagement';
import BedManagement from './pages/admin/BedManagement';

// Doctor pages
import DoctorAppointments from './pages/doctor/Appointments';
import DoctorAvailability from './pages/doctor/Availability';
import DoctorPrescriptions from './pages/doctor/Prescriptions';
import DoctorReports from './pages/doctor/Reports';
import DoctorPatients from './pages/doctor/Patients';
import DoctorProfile from './pages/doctor/DoctorProfile';

// Receptionist pages
import ReceptionistPatientRegistration from './pages/receptionist/PatientRegistration';
import ReceptionistAppointments from './pages/receptionist/Appointments';

// Patient pages
import PatientProfile from './modules/patient/Profile';
import AppointmentBooking from './modules/appointments/AppointmentBooking';
import LabReports from './modules/patient/LabReports';
import Prescriptions from './modules/patient/Prescriptions';
import PatientAppointments from './modules/patient/Appointments';
import PatientBilling from './pages/patient/Billing';

// Shared Modules
import Analytics from './modules/analytics/Analytics';
import Pharmacy from './modules/pharmacy/Pharmacy';
import Billing from './modules/billing/Billing';

import { Toaster } from 'sonner';

const Unauthorized = () => (
  <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-4">
    <div className="text-6xl">🚫</div>
    <h1 className="text-2xl font-bold text-destructive">Unauthorized Access</h1>
    <p className="text-muted-foreground">You do not have permission to view this page.</p>
  </div>
);

function App() {
  return (
    <Router>
      <Toaster position="top-right" richColors />
      <Routes>

        {/* ─── Public Routes ─── */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<EmployeeForgotPassword />} />
          <Route path="/doctor-profile/:id" element={<DoctorProfile />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
        </Route>

        {/* ─── SUPERADMIN (sole access) ─── */}
        <Route element={<DashboardLayout allowedRoles={['superadmin']} />}>
          <Route path="/superadmin" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/users" element={<UserManagement />} />
          <Route path="/superadmin/doctors" element={<DoctorManagement />} />
          <Route path="/superadmin/departments" element={<DepartmentManagement />} />
          <Route path="/superadmin/patients" element={<PatientManagement />} />
          <Route path="/superadmin/appointments" element={<AppointmentManagement />} />
          <Route path="/superadmin/beds" element={<BedManagement />} />
          <Route path="/superadmin/analytics" element={<Analytics />} />
          <Route path="/superadmin/billing" element={<Billing />} />
          <Route path="/superadmin/pharmacy" element={<Pharmacy />} />
          <Route path="/superadmin/profile" element={<PlaceholderPage title="Super Admin Profile" description="Manage your super admin profile." />} />
          <Route path="/superadmin/notifications" element={<PlaceholderPage title="Notifications" description="View system alerts and updates." />} />
        </Route>

        {/* ─── ADMIN (sole access) ─── */}
        <Route element={<DashboardLayout allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/doctors" element={<DoctorManagement />} />
          <Route path="/admin/departments" element={<DepartmentManagement />} />
          <Route path="/admin/patients" element={<PatientManagement />} />
          <Route path="/admin/appointments" element={<AppointmentManagement />} />
          <Route path="/admin/beds" element={<BedManagement />} />
          <Route path="/admin/analytics" element={<Analytics />} />
          <Route path="/admin/billing" element={<Billing />} />
          <Route path="/admin/pharmacy" element={<Pharmacy />} />
          <Route path="/admin/inventory" element={<PlaceholderPage title="Inventory" description="Manage hospital inventory and supplies." />} />
          <Route path="/admin/profile" element={<PlaceholderPage title="Admin Profile" description="Manage your admin profile." />} />
          <Route path="/admin/notifications" element={<PlaceholderPage title="Notifications" description="View system alerts and updates." />} />
        </Route>

        {/* ─── DOCTOR (sole access) ─── */}
        <Route element={<DashboardLayout allowedRoles={['doctor']} />}>
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/doctor/appointments" element={<DoctorAppointments />} />
          <Route path="/doctor/patients" element={<DoctorPatients />} />
          <Route path="/doctor/prescriptions" element={<DoctorPrescriptions />} />
          <Route path="/doctor/reports" element={<DoctorReports />} />
          <Route path="/doctor/availability" element={<DoctorAvailability />} />
          <Route path="/doctor/profile" element={<PlaceholderPage title="Doctor Profile" description="Manage your doctor profile." />} />
          <Route path="/doctor/notifications" element={<PlaceholderPage title="Notifications" description="View system alerts and updates." />} />
        </Route>

        {/* ─── PATIENT (sole access) ─── */}
        <Route element={<DashboardLayout allowedRoles={['patient']} />}>
          <Route path="/patient" element={<PatientDashboard />} />
          <Route path="/patient/profile" element={<PatientProfile />} />
          <Route path="/patient/book" element={<AppointmentBooking />} />
          <Route path="/patient/reports" element={<LabReports />} />
          <Route path="/patient/prescriptions" element={<Prescriptions />} />
          <Route path="/patient/appointments" element={<PatientAppointments />} />
          <Route path="/patient/billing" element={<PatientBilling />} />
          <Route path="/patient/telemedicine" element={<PlaceholderPage title="Telemedicine" description="Join video consultations with your doctor." />} />
          <Route path="/patient/notifications" element={<PlaceholderPage title="Notifications" description="View system alerts and updates." />} />
        </Route>

        {/* ─── SUPER RECEPTIONIST (sole access) ─── */}
        <Route element={<DashboardLayout allowedRoles={['superreceptionist']} />}>
          <Route path="/superreceptionist" element={<ReceptionistDashboard />} />
          <Route path="/superreceptionist/register" element={<ReceptionistPatientRegistration />} />
          <Route path="/superreceptionist/appointments" element={<ReceptionistAppointments />} />
          <Route path="/superreceptionist/billing" element={<Billing />} />
          <Route path="/superreceptionist/reports" element={<PlaceholderPage title="Reports" description="Generate and view front desk reports." />} />
          <Route path="/superreceptionist/patients" element={<PlaceholderPage title="Patient Database" description="Search and view patient records." />} />
          <Route path="/superreceptionist/profile" element={<PlaceholderPage title="Super Receptionist Profile" description="Manage your profile." />} />
          <Route path="/superreceptionist/notifications" element={<PlaceholderPage title="Notifications" description="View system alerts and updates." />} />
        </Route>

        {/* ─── RECEPTIONIST (sole access) ─── */}
        <Route element={<DashboardLayout allowedRoles={['receptionist']} />}>
          <Route path="/receptionist" element={<ReceptionistDashboard />} />
          <Route path="/receptionist/register" element={<ReceptionistPatientRegistration />} />
          <Route path="/receptionist/appointments" element={<ReceptionistAppointments />} />
          <Route path="/receptionist/billing" element={<Billing />} />
          <Route path="/receptionist/reports" element={<PlaceholderPage title="Reports" description="Generate and view front desk reports." />} />
          <Route path="/receptionist/patients" element={<PlaceholderPage title="Patient Database" description="Search and view patient records." />} />
          <Route path="/receptionist/profile" element={<PlaceholderPage title="Profile" description="Manage your profile." />} />
          <Route path="/receptionist/notifications" element={<PlaceholderPage title="Notifications" description="View system alerts and updates." />} />
        </Route>

        {/* ─── NURSE (sole access) ─── */}
        <Route element={<DashboardLayout allowedRoles={['nurse']} />}>
          <Route path="/nurse" element={<NurseDashboard />} />
          <Route path="/nurse/profile" element={<PlaceholderPage title="Nurse Profile" description="Manage your nurse profile." />} />
          <Route path="/nurse/notifications" element={<PlaceholderPage title="Notifications" description="View alerts and updates." />} />
        </Route>

        {/* ─── LAB TECHNICIAN (sole access) ─── */}
        <Route element={<DashboardLayout allowedRoles={['labTechnician']} />}>
          <Route path="/labTechnician" element={<LabTechDashboard />} />
          <Route path="/labTechnician/profile" element={<PlaceholderPage title="Lab Tech Profile" description="Manage your lab tech profile." />} />
          <Route path="/labTechnician/notifications" element={<PlaceholderPage title="Notifications" description="View alerts and updates." />} />
        </Route>

        {/* ─── PHARMACIST (sole access) ─── */}
        <Route element={<DashboardLayout allowedRoles={['pharmacist']} />}>
          <Route path="/pharmacist" element={<PharmacistDashboard />} />
          <Route path="/pharmacist/profile" element={<PlaceholderPage title="Pharmacist Profile" description="Manage your pharmacist profile." />} />
          <Route path="/pharmacist/notifications" element={<PlaceholderPage title="Notifications" description="View alerts and updates." />} />
        </Route>

        {/* ─── Fallback ─── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

export default App;
