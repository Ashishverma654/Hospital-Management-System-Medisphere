import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toaster } from 'sonner';
import PublicPatientLayout from './components/layout/PublicPatientLayout.jsx';
import PatientPortalLayout from './components/layout/PatientPortalLayout.jsx';
import EmployeeAppLayout from './components/layout/EmployeeAppLayout.jsx';
import PatientRoute from './routes/guards/PatientRoute.jsx';
import EmployeeRoute from './routes/guards/EmployeeRoute.jsx';
import Home from './pages/public/Home.jsx';
import PatientLogin from './pages/auth/PatientLogin.jsx';
import PatientRegister from './pages/auth/PatientRegister.jsx';
import EmployeeLogin from './pages/auth/EmployeeLogin.jsx';
import PortalShell from './pages/patient/PortalShell.jsx';
import DashboardShell from './pages/employee/DashboardShell.jsx';
import SubadminDashboard from './pages/employee/SubadminDashboard.jsx';
import PatientManagement from './pages/admin/PatientManagement.jsx';
import UserManagement from './pages/admin/UserManagement.jsx';
import { EMPLOYEE_ROLES, STAFF_MANAGEMENT_ROLES, SUBADMIN_ONLY_ROLES, getEmployeeHomeRoute } from './auth/constants.js';

function Unauthorized() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Employee access</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Unauthorized</h1>
        <p className="mt-3 text-slate-600">
          Your account is signed in, but the selected route is not available for your employee role.
        </p>
      </div>
    </section>
  );
}

function EmployeeHomeRedirect() {
  const role = useSelector((state) => state.auth.user?.role);
  return <Navigate to={getEmployeeHomeRoute(role)} replace />;
}

function App() {
  return (
    <Router>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route element={<PublicPatientLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/patient/login" element={<PatientLogin />} />
          <Route path="/patient/register" element={<PatientRegister />} />
        </Route>

        <Route element={<PatientRoute />}>
          <Route element={<PatientPortalLayout />}>
            <Route path="/patient" element={<PortalShell />} />
          </Route>
        </Route>

        <Route path="/employee/login" element={<EmployeeLogin />} />
        <Route path="/employee/unauthorized" element={<Unauthorized />} />

        <Route element={<EmployeeRoute allowedRoles={EMPLOYEE_ROLES} />}>
          <Route element={<EmployeeAppLayout />}>
            <Route path="/employee" element={<EmployeeHomeRedirect />} />
            <Route path="/employee/dashboard" element={<DashboardShell />} />
            <Route element={<EmployeeRoute allowedRoles={SUBADMIN_ONLY_ROLES} />}>
              <Route path="/employee/subadmin" element={<SubadminDashboard />} />
            </Route>
            <Route element={<EmployeeRoute allowedRoles={STAFF_MANAGEMENT_ROLES} />}>
              <Route path="/employee/users" element={<Navigate to="/employee/manage-roles" replace />} />
              <Route path="/employee/manage-roles" element={<UserManagement />} />
              <Route path="/employee/patients" element={<PatientManagement />} />
            </Route>
          </Route>
        </Route>

        <Route path="/login" element={<Navigate to="/patient/login" replace />} />
        <Route path="/register" element={<Navigate to="/patient/register" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/employee/login" replace />} />
        <Route path="/superadmin/*" element={<Navigate to="/employee/dashboard" replace />} />
        <Route path="/admin/*" element={<Navigate to="/employee/dashboard" replace />} />
        <Route path="/doctor/*" element={<Navigate to="/employee/dashboard" replace />} />
        <Route path="/receptionist/*" element={<Navigate to="/employee/dashboard" replace />} />
        <Route path="/superreceptionist/*" element={<Navigate to="/employee/subadmin" replace />} />
        <Route path="/nurse/*" element={<Navigate to="/employee/dashboard" replace />} />
        <Route path="/pharmacist/*" element={<Navigate to="/employee/dashboard" replace />} />
        <Route path="/labTechnician/*" element={<Navigate to="/employee/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
