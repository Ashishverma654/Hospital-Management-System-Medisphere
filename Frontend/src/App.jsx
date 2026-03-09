import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './components/Layout/PublicLayout';
import DashboardLayout from './components/Layout/DashboardLayout';
import PlaceholderPage from './components/PlaceholderPage';
import Home from './pages/public/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminDashboard from './pages/admin/Dashboard';
import DoctorDashboard from './pages/doctor/Dashboard';
import PatientDashboard from './pages/patient/Dashboard';
import ReceptionistDashboard from './pages/receptionist/Dashboard';
import PatientProfile from './modules/patient/Profile';
import AppointmentBooking from './modules/appointments/AppointmentBooking';
import LabReports from './modules/patient/LabReports';
import Prescriptions from './modules/patient/Prescriptions';
import PatientAppointments from './modules/patient/Appointments';
import Analytics from './modules/analytics/Analytics';
import Pharmacy from './modules/pharmacy/Pharmacy';
import Billing from './modules/billing/Billing';
import Beds from './modules/beds/Beds';
import DepartmentManagement from './pages/admin/DepartmentManagement';
import UserManagement from './pages/admin/UserManagement';
import DoctorManagement from './pages/admin/DoctorManagement';
import PatientManagement from './pages/admin/PatientManagement';
import AppointmentManagement from './pages/admin/AppointmentManagement';
import BedManagement from './pages/admin/BedManagement';
import DoctorAppointments from './pages/doctor/Appointments';
import DoctorAvailability from './pages/doctor/Availability';
import DoctorPrescriptions from './pages/doctor/Prescriptions';
import DoctorReports from './pages/doctor/Reports';
import DoctorPatients from './pages/doctor/Patients';
import PatientBilling from './pages/patient/Billing';
import ReceptionistPatientRegistration from './pages/receptionist/PatientRegistration';
import ReceptionistAppointments from './pages/receptionist/Appointments';
import { Toaster } from 'sonner';

const Unauthorized = () => <div className="p-8 text-2xl font-bold text-destructive">Unauthorized Access</div>;

function App() {
  return (
    <Router>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<DashboardLayout allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/analytics" element={<Analytics />} />
          <Route path="/admin/pharmacy" element={<Pharmacy />} />
          <Route path="/admin/billing" element={<Billing />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/doctors" element={<DoctorManagement />} />
          <Route path="/admin/departments" element={<DepartmentManagement />} />
          <Route path="/admin/patients" element={<PatientManagement />} />
          <Route path="/admin/appointments" element={<AppointmentManagement />} />
          <Route path="/admin/beds" element={<BedManagement />} />
          <Route path="/admin/inventory" element={<PlaceholderPage title="Inventory" description="Manage hospital inventory and supplies." />} />
          <Route path="/admin/profile" element={<PlaceholderPage title="Profile" description="Manage your admin profile." />} />
          <Route path="/admin/notifications" element={<PlaceholderPage title="Notifications" description="View system alerts and updates." />} />
        </Route>

        {/* Doctor Routes */}
        <Route element={<DashboardLayout allowedRoles={['doctor']} />}>
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/doctor/appointments" element={<DoctorAppointments />} />
          <Route path="/doctor/patients" element={<DoctorPatients />} />
          <Route path="/doctor/prescriptions" element={<DoctorPrescriptions />} />
          <Route path="/doctor/reports" element={<DoctorReports />} />
          <Route path="/doctor/availability" element={<DoctorAvailability />} />
          <Route path="/doctor/profile" element={<PlaceholderPage title="Profile" description="Manage your doctor profile." />} />
          <Route path="/doctor/notifications" element={<PlaceholderPage title="Notifications" description="View system alerts and updates." />} />
        </Route>

        {/* Patient Routes */}
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

        {/* Receptionist Routes */}
        <Route element={<DashboardLayout allowedRoles={['receptionist']} />}>
          <Route path="/receptionist" element={<ReceptionistDashboard />} />
          <Route path="/receptionist/billing" element={<Billing />} />
          <Route path="/receptionist/appointments" element={<ReceptionistAppointments />} />
          <Route path="/receptionist/register" element={<ReceptionistPatientRegistration />} />
          <Route path="/receptionist/reports" element={<PlaceholderPage title="Reports" description="Generate and view front desk reports." />} />
          <Route path="/receptionist/patients" element={<PlaceholderPage title="Patient Database" description="Search and view patient records." />} />
          <Route path="/receptionist/profile" element={<PlaceholderPage title="Profile" description="Manage your profile." />} />
          <Route path="/receptionist/notifications" element={<PlaceholderPage title="Notifications" description="View system alerts and updates." />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
