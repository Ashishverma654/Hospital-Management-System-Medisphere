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
          <Route path="/admin/users" element={<PlaceholderPage title="User Management" description="Manage system users and roles." />} />
          <Route path="/admin/doctors" element={<PlaceholderPage title="Doctors" description="Manage doctors and their profiles." />} />
          <Route path="/admin/departments" element={<PlaceholderPage title="Departments" description="Manage hospital departments." />} />
          <Route path="/admin/patients" element={<PlaceholderPage title="Patients" description="View and manage patient records." />} />
          <Route path="/admin/appointments" element={<PlaceholderPage title="Appointments" description="View and manage all appointments." />} />
          <Route path="/admin/beds" element={<Beds />} />
          <Route path="/admin/inventory" element={<PlaceholderPage title="Inventory" description="Manage hospital inventory and supplies." />} />
          <Route path="/admin/profile" element={<PlaceholderPage title="Profile" description="Manage your admin profile." />} />
        </Route>

        {/* Doctor Routes */}
        <Route element={<DashboardLayout allowedRoles={['doctor']} />}>
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/doctor/appointments" element={<PlaceholderPage title="My Appointments" description="View and manage your appointment schedule." />} />
          <Route path="/doctor/patients" element={<PlaceholderPage title="Patients" description="View your patient list and history." />} />
          <Route path="/doctor/prescriptions" element={<PlaceholderPage title="Prescriptions" description="Create and manage prescriptions." />} />
          <Route path="/doctor/reports" element={<PlaceholderPage title="Lab Reports" description="View and upload patient lab reports." />} />
          <Route path="/doctor/availability" element={<PlaceholderPage title="Availability" description="Set your availability and schedule." />} />
          <Route path="/doctor/profile" element={<PlaceholderPage title="Profile" description="Manage your doctor profile." />} />
        </Route>

        {/* Patient Routes */}
        <Route element={<DashboardLayout allowedRoles={['patient']} />}>
          <Route path="/patient" element={<PatientDashboard />} />
          <Route path="/patient/profile" element={<PatientProfile />} />
          <Route path="/patient/book" element={<AppointmentBooking />} />
          <Route path="/patient/reports" element={<LabReports />} />
          <Route path="/patient/prescriptions" element={<Prescriptions />} />
          <Route path="/patient/appointments" element={<PatientAppointments />} />
          <Route path="/patient/billing" element={<PlaceholderPage title="Billing" description="View and pay your bills." />} />
          <Route path="/patient/telemedicine" element={<PlaceholderPage title="Telemedicine" description="Join video consultations with your doctor." />} />
        </Route>

        {/* Receptionist Routes */}
        <Route element={<DashboardLayout allowedRoles={['receptionist']} />}>
          <Route path="/receptionist" element={<ReceptionistDashboard />} />
          <Route path="/receptionist/billing" element={<Billing />} />
          <Route path="/receptionist/appointments" element={<PlaceholderPage title="Appointments Queue" description="Manage today's appointments and check-in." />} />
          <Route path="/receptionist/register" element={<PlaceholderPage title="Register Patient" description="Register new patients at the front desk." />} />
          <Route path="/receptionist/reports" element={<PlaceholderPage title="Reports" description="Generate and view front desk reports." />} />
          <Route path="/receptionist/patients" element={<PlaceholderPage title="Patient Database" description="Search and view patient records." />} />
          <Route path="/receptionist/profile" element={<PlaceholderPage title="Profile" description="Manage your profile." />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
