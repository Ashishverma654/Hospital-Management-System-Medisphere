import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toaster } from 'sonner';
import PublicPatientLayout from './components/Layout/PublicPatientLayout.jsx';
import PatientPortalLayout from './components/Layout/PatientPortalLayout.jsx';
import EmployeeAppLayout from './components/Layout/EmployeeAppLayout.jsx';
import PatientRoute from './routes/guards/PatientRoute.jsx';
import EmployeeRoute from './routes/guards/EmployeeRoute.jsx';
import Home from './pages/public/Home.jsx';
import PublicAbout from './pages/public/PublicAbout.jsx';
import FindDoctors from './pages/public/FindDoctors.jsx';
import PatientLogin from './pages/auth/PatientLogin.jsx';
import PatientRegister from './pages/auth/PatientRegister.jsx';
import EmployeeLogin from './pages/auth/EmployeeLogin.jsx';
import PatientSectionPage from './pages/patient/PatientSectionPage.jsx';
import GovernanceDashboard from './pages/employee/GovernanceDashboard.jsx';
import EmployeeRoleDashboard from './pages/employee/EmployeeRoleDashboard.jsx';
import AdminProfilePage from './pages/employee/AdminProfilePage.jsx';
import AuditHistoryPage from './pages/employee/AuditHistoryPage.jsx';
import HospitalSettingsPage from './pages/employee/HospitalSettingsPage.jsx';
import PatientManagement from './pages/admin/PatientManagement.jsx';
import UserManagement from './pages/admin/UserManagement.jsx';
import DoctorManagement from './pages/admin/DoctorManagement.jsx';
import DepartmentManagement from './pages/admin/DepartmentManagement.jsx';
import SpecializationManagement from './pages/admin/SpecializationManagement.jsx';
import LocationManagement from './pages/admin/LocationManagement.jsx';
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
          <Route path="/about" element={<PublicAbout />} />
          <Route path="/find-doctors" element={<FindDoctors />} />
          <Route path="/patient/login" element={<PatientLogin />} />
          <Route path="/patient/register" element={<PatientRegister />} />
        </Route>

        <Route element={<PatientRoute />}>
          <Route element={<PatientPortalLayout />}>
            <Route path="/patient" element={<Navigate to="/patient/dashboard" replace />} />
            <Route
              path="/patient/dashboard"
              element={
                <PatientSectionPage
                  eyebrow="Patient overview"
                  title="Patient dashboard"
                  description="Your personal care summary, upcoming visits, records, and account activity will be organized from this dashboard."
                />
              }
            />
            <Route
              path="/patient/appointments"
              element={
                <PatientSectionPage
                  eyebrow="Appointments"
                  title="Appointments"
                  description="Booking history, upcoming visits, cancellations, and future scheduling tools will appear in this section."
                />
              }
            />
            <Route
              path="/patient/prescriptions"
              element={
                <PatientSectionPage
                  eyebrow="Prescriptions"
                  title="Prescriptions"
                  description="Prescription summaries, dosage guidance, and refill-ready information will be connected here in a later module."
                />
              }
            />
            <Route
              path="/patient/medicine-orders"
              element={
                <PatientSectionPage
                  eyebrow="Pharmacy"
                  title="Medicine Orders"
                  description="Pharmacy orders, refill requests, and order status updates will be available here for patients later."
                />
              }
            />
            <Route
              path="/patient/lab-tests"
              element={
                <PatientSectionPage
                  eyebrow="Diagnostics"
                  title="Lab Tests"
                  description="Pending tests, collection windows, and diagnostic order visibility will be surfaced in this patient section later."
                />
              }
            />
            <Route
              path="/patient/lab-reports"
              element={
                <PatientSectionPage
                  eyebrow="Diagnostics"
                  title="Lab Reports"
                  description="Released reports, downloadable records, and result history will live inside this portal section."
                />
              }
            />
            <Route
              path="/patient/bills"
              element={
                <PatientSectionPage
                  eyebrow="Billing"
                  title="Bills & Payments"
                  description="Invoices, receipts, balances, and payment progress will be organized here without mixing with employee billing tools."
                />
              }
            />
            <Route
              path="/patient/profile"
              element={
                <PatientSectionPage
                  eyebrow="Profile"
                  title="Profile"
                  description="Personal details, contact information, and future patient preferences will be managed from this profile area."
                />
              }
            />
            <Route
              path="/patient/notifications"
              element={
                <PatientSectionPage
                  eyebrow="Updates"
                  title="Notifications"
                  description="Appointment alerts, report releases, reminders, and portal notices will be collected in this section."
                />
              }
            />
          </Route>
        </Route>

        <Route path="/employee/login" element={<EmployeeLogin />} />
        <Route path="/employee/unauthorized" element={<Unauthorized />} />

        <Route element={<EmployeeRoute allowedRoles={EMPLOYEE_ROLES} />}>
          <Route element={<EmployeeAppLayout />}>
            <Route path="/employee" element={<EmployeeHomeRedirect />} />
            <Route path="/employee/dashboard" element={<EmployeeHomeRedirect />} />
            <Route element={<EmployeeRoute allowedRoles={['superadmin']} />}>
              <Route path={EMPLOYEE_ROLE_PATHS.superadmin} element={<GovernanceDashboard />} />
            </Route>
            <Route element={<EmployeeRoute allowedRoles={['admin']} />}>
              <Route path={EMPLOYEE_ROLE_PATHS.admin} element={<GovernanceDashboard />} />
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
            <Route path="/employee/profile" element={<AdminProfilePage />} />
            <Route element={<EmployeeRoute allowedRoles={['superadmin', 'admin']} />}>
              <Route path="/employee/doctors" element={<DoctorManagement />} />
              <Route path="/employee/departments" element={<DepartmentManagement />} />
              <Route path="/employee/specializations" element={<SpecializationManagement />} />
              <Route path="/employee/locations" element={<LocationManagement />} />
              <Route path="/employee/audit" element={<AuditHistoryPage />} />
              <Route path="/employee/settings" element={<HospitalSettingsPage />} />
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
