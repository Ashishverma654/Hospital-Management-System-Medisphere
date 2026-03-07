import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/Layout/DashboardLayout';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import Departments from './pages/admin/Departments';
import AdminDoctors from './pages/admin/Doctors';
import DoctorAvailability from './pages/admin/DoctorAvailability';
import AdminAppointments from './pages/admin/Appointments';

// Doctor Pages
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorAllAppointments from './pages/doctor/AllAppointments';
import CreatePrescription from './pages/doctor/CreatePrescription';
import UploadReport from './pages/doctor/UploadReport';

// Patient Pages
import PatientDashboard from './pages/patient/Dashboard';
import BrowseDoctors from './pages/patient/Doctors';
import DoctorDetail from './pages/patient/DoctorDetail';
import PatientAppointments from './pages/patient/Appointments';
import Prescriptions from './pages/patient/Prescriptions';
import Reports from './pages/patient/Reports';

// Receptionist Pages
import ReceptionistDashboard from './pages/receptionist/Dashboard';
import BookAppointment from './pages/receptionist/BookAppointment';

// Smart redirect based on role
const HomeRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const paths = {
    admin: '/admin',
    doctor: '/doctor',
    patient: '/patient',
    receptionist: '/receptionist',
  };
  return <Navigate to={paths[user?.role] || '/login'} replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1E2A4A',
              color: '#E8E8F0',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              fontSize: '0.88rem',
            },
            success: { iconTheme: { primary: '#00D4AA', secondary: '#1E2A4A' } },
            error: { iconTheme: { primary: '#FF6B6B', secondary: '#1E2A4A' } },
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<HomeRedirect />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="departments" element={<Departments />} />
            <Route path="doctors" element={<AdminDoctors />} />
            <Route path="availability" element={<DoctorAvailability />} />
            <Route path="appointments" element={<AdminAppointments />} />
          </Route>

          {/* Doctor Routes */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DoctorDashboard />} />
            <Route path="appointments" element={<DoctorAllAppointments />} />
            <Route path="prescriptions" element={<CreatePrescription />} />
            <Route path="reports" element={<UploadReport />} />
          </Route>

          {/* Patient Routes */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<PatientDashboard />} />
            <Route path="doctors" element={<BrowseDoctors />} />
            <Route path="doctors/:id" element={<DoctorDetail />} />
            <Route path="appointments" element={<PatientAppointments />} />
            <Route path="prescriptions" element={<Prescriptions />} />
            <Route path="reports" element={<Reports />} />
          </Route>

          {/* Receptionist Routes */}
          <Route
            path="/receptionist"
            element={
              <ProtectedRoute allowedRoles={['receptionist']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ReceptionistDashboard />} />
            <Route path="book" element={<BookAppointment />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
