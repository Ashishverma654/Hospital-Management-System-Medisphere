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
import EmployeeRoleDashboard from './pages/employee/EmployeeRoleDashboard.jsx';
import EmployeeProfileShell from './pages/employee/EmployeeProfileShell.jsx';
import EmployeeSettingsShell from './pages/employee/EmployeeSettingsShell.jsx';
import PatientManagement from './pages/admin/PatientManagement.jsx';
import UserManagement from './pages/admin/UserManagement.jsx';
import { EMPLOYEE_ROLE_PATHS, EMPLOYEE_ROLES, STAFF_MANAGEMENT_ROLES, getEmployeeHomeRoute } from './auth/constants.js';

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

function LegacyRoleRedirect({ role }) {
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
            <Route path="/employee/dashboard" element={<EmployeeHomeRedirect />} />
            <Route element={<EmployeeRoute allowedRoles={['superadmin']} />}>
              <Route path={EMPLOYEE_ROLE_PATHS.superadmin} element={<EmployeeRoleDashboard role="superadmin" />} />
            </Route>
            <Route element={<EmployeeRoute allowedRoles={['admin']} />}>
              <Route path={EMPLOYEE_ROLE_PATHS.admin} element={<EmployeeRoleDashboard role="admin" />} />
            </Route>
            <Route element={<EmployeeRoute allowedRoles={['subadmin']} />}>
              <Route path={EMPLOYEE_ROLE_PATHS.subadmin} element={<EmployeeRoleDashboard role="subadmin" />} />
            </Route>
            <Route element={<EmployeeRoute allowedRoles={['doctor']} />}>
              <Route path={EMPLOYEE_ROLE_PATHS.doctor} element={<EmployeeRoleDashboard role="doctor" />} />
            </Route>
            <Route element={<EmployeeRoute allowedRoles={['nurse']} />}>
              <Route path={EMPLOYEE_ROLE_PATHS.nurse} element={<EmployeeRoleDashboard role="nurse" />} />
            </Route>
            <Route element={<EmployeeRoute allowedRoles={['receptionist']} />}>
              <Route path={EMPLOYEE_ROLE_PATHS.receptionist} element={<EmployeeRoleDashboard role="receptionist" />} />
            </Route>
            <Route element={<EmployeeRoute allowedRoles={['labTechnician']} />}>
              <Route path={EMPLOYEE_ROLE_PATHS.labTechnician} element={<EmployeeRoleDashboard role="labTechnician" />} />
            </Route>
            <Route element={<EmployeeRoute allowedRoles={['pharmacist']} />}>
              <Route path={EMPLOYEE_ROLE_PATHS.pharmacist} element={<EmployeeRoleDashboard role="pharmacist" />} />
            </Route>
            <Route path="/employee/profile" element={<EmployeeProfileShell />} />
            <Route path="/employee/settings" element={<EmployeeSettingsShell />} />
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
        <Route path="/superadmin/*" element={<LegacyRoleRedirect role="superadmin" />} />
        <Route path="/admin/*" element={<LegacyRoleRedirect role="admin" />} />
        <Route path="/doctor/*" element={<LegacyRoleRedirect role="doctor" />} />
        <Route path="/receptionist/*" element={<LegacyRoleRedirect role="receptionist" />} />
        <Route path="/superreceptionist/*" element={<LegacyRoleRedirect role="subadmin" />} />
        <Route path="/nurse/*" element={<LegacyRoleRedirect role="nurse" />} />
        <Route path="/pharmacist/*" element={<LegacyRoleRedirect role="pharmacist" />} />
        <Route path="/labTechnician/*" element={<LegacyRoleRedirect role="labTechnician" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
