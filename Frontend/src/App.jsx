import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toaster } from 'sonner';
import PublicPatientLayout from './components/layout/PublicPatientLayout.jsx';
import PatientPortalLayout from './components/layout/PatientPortalLayout.jsx';
import EmployeeAppLayout from './components/layout/EmployeeAppLayout.jsx';
import PatientRoute from './routes/guards/PatientRoute.jsx';
import EmployeeRoute from './routes/guards/EmployeeRoute.jsx';
import Home from './pages/public/Home.jsx';
import PublicAbout from './pages/public/PublicAbout.jsx';
import FindDoctors from './pages/public/FindDoctors.jsx';
import PublicDoctorProfile from './pages/public/PublicDoctorProfile.jsx';
import PatientLogin from './pages/auth/PatientLogin.jsx';
import PatientRegister from './pages/auth/PatientRegister.jsx';
import EmployeeLogin from './pages/auth/EmployeeLogin.jsx';
import EmployeeForgotPassword from './pages/auth/EmployeeForgotPassword.jsx';
import PatientDashboard from './pages/patient/Dashboard.jsx';
import PatientAppointments from './pages/patient/Appointments.jsx';
import PatientPrescriptions from './pages/patient/Prescriptions.jsx';
import PatientMedicineOrders from './pages/patient/MedicineOrders.jsx';
import PatientLabTests from './pages/patient/LabTests.jsx';
import PatientLabReports from './pages/patient/LabReports.jsx';
import PatientBilling from './pages/patient/Billing.jsx';
import PatientBookAppointment from './pages/patient/BookAppointment.jsx';
import PatientBookingPreview from './pages/patient/BookingPreview.jsx';
import ProfilePage from './pages/shared/ProfilePage.jsx';
import ForcePasswordChange from './pages/auth/ForcePasswordChange.jsx';
import PatientNotifications from './pages/patient/Notifications.jsx';
import PatientTimeline from './pages/patient/Timeline.jsx';
import GovernanceDashboard from './pages/employee/GovernanceDashboard.jsx';
import EmployeeRoleDashboard from './pages/employee/EmployeeRoleDashboard.jsx';
import AdminProfilePage from './pages/employee/AdminProfilePage.jsx';
import AuditHistoryPage from './pages/employee/AuditHistoryPage.jsx';
import HospitalSettingsPage from './pages/employee/HospitalSettingsPage.jsx';
import BillingManagement from './pages/employee/BillingManagement.jsx';
import EmployeeNotifications from './pages/employee/Notifications.jsx';
import AnalyticsDashboard from './pages/employee/AnalyticsDashboard.jsx';
import DoctorDetail from './pages/employee/DoctorDetail.jsx';
import PatientDetail from './pages/employee/PatientDetail.jsx';
import LabOrderDetail from './pages/employee/LabOrderDetail.jsx';
import PharmacyOrderDetail from './pages/employee/PharmacyOrderDetail.jsx';
import PatientManagement from './pages/admin/PatientManagement.jsx';
import WardManagement from './pages/admin/WardManagement.jsx';
import BedManagement from './pages/admin/BedManagement.jsx';
import AdmissionManagement from './pages/admin/AdmissionManagement.jsx';
import UserManagement from './pages/admin/UserManagement.jsx';
import DoctorManagement from './pages/admin/DoctorManagement.jsx';
import DoctorAvailabilityManagement from './pages/admin/DoctorAvailabilityManagement.jsx';
import AwardManagement from './pages/admin/AwardManagement.jsx';
import DepartmentManagement from './pages/admin/DepartmentManagement.jsx';
import LocationManagement from './pages/admin/LocationManagement.jsx';
import AddUserPage from './pages/admin/AddUserPage.jsx';
import NurseDutyAllocation from './pages/admin/NurseDutyAllocation.jsx';
import ShiftManagement from './pages/admin/ShiftManagement.jsx';
import ShiftCalendar from './pages/ShiftCalendar.jsx';
import StaffAvailability from './pages/StaffAvailability.jsx';
import ReceptionistDashboard from './pages/receptionist/Dashboard.jsx';
import PatientRegistration from './pages/receptionist/PatientRegistration.jsx';
import AppointmentDesk from './pages/receptionist/AppointmentDesk.jsx';
import PatientSearch from './pages/receptionist/PatientSearch.jsx';
import PatientHistory from './pages/receptionist/PatientHistory.jsx';
import DashboardLayout from './components/layout/DashboardLayout.jsx';
import DoctorDashboard from './pages/doctor/Dashboard.jsx';
import DoctorAppointments from './pages/doctor/Appointments.jsx';
import DoctorPatients from './pages/doctor/Patients.jsx';
import DoctorPrescriptions from './pages/doctor/Prescriptions.jsx';
import DoctorLabOrders from './pages/doctor/LabOrders.jsx';
import DoctorReports from './pages/doctor/Reports.jsx';
import DoctorAvailability from './pages/doctor/Availability.jsx';
import PatientSummary from './pages/doctor/PatientSummary.jsx';
import LabTechDashboard from './pages/labtech/Dashboard.jsx';
import LabTechOrdersInbox from './pages/labtech/OrdersInbox.jsx';
import LabTechProfile from './pages/labtech/Profile.jsx';
import PharmacistDashboard from './pages/pharmacist/Dashboard.jsx';
import PharmacistOrders from './pages/pharmacist/Orders.jsx';
import PharmacistInventory from './pages/pharmacist/Inventory.jsx';
import PharmacistHistory from './pages/pharmacist/History.jsx';
import NurseDashboard from './pages/nurse/Dashboard.jsx';
import NursePatients from './pages/nurse/Patients.jsx';
import NurseWardBoard from './pages/nurse/WardBoard.jsx';
import NurseTasks from './pages/nurse/Tasks.jsx';
import NurseVitals from './pages/nurse/Vitals.jsx';
import NurseNotes from './pages/nurse/Notes.jsx';
import NurseHandover from './pages/nurse/Handover.jsx';
import { EMPLOYEE_ROLE_PATHS, EMPLOYEE_ROLES, STAFF_MANAGEMENT_ROLES, getEmployeeHomeRoute } from './auth/constants.js';

function Unauthorized() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Employee access</p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">Unauthorized</h1>
        <p className="mt-3 text-muted-foreground">
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
          <Route path="/find-doctors/:id" element={<PublicDoctorProfile />} />
          <Route path="/patient/login" element={<PatientLogin />} />
          <Route path="/patient/register" element={<PatientRegister />} />
        </Route>

        <Route element={<PatientRoute />}>
          <Route element={<PatientPortalLayout />}>
            <Route path="/patient" element={<Navigate to="/patient/dashboard" replace />} />
            <Route
              path="/patient/dashboard"
              element={<PatientDashboard />}
            />
            <Route
              path="/patient/appointments"
              element={<PatientAppointments />}
            />
            <Route
              path="/patient/book-appointment"
              element={<PatientBookAppointment />}
            />
            <Route
              path="/patient/booking-preview"
              element={<PatientBookingPreview />}
            />
            <Route
              path="/patient/prescriptions"
              element={<PatientPrescriptions />}
            />
            <Route
              path="/patient/medicine-orders"
              element={<PatientMedicineOrders />}
            />
            <Route
              path="/patient/lab-tests"
              element={<PatientLabTests />}
            />
            <Route
              path="/patient/lab-reports"
              element={<PatientLabReports />}
            />
            <Route
              path="/patient/bills"
              element={<PatientBilling />}
            />
            <Route
              path="/patient/profile"
              element={<ProfilePage />}
            />
            <Route
              path="/patient/notifications"
              element={<PatientNotifications />}
            />
            <Route
              path="/patient/history"
              element={<PatientTimeline />}
            />
          </Route>
        </Route>

        <Route path="/employee/login" element={<EmployeeLogin />} />
        <Route path="/employee/forgot-password" element={<EmployeeForgotPassword />} />
        <Route path="/force-password-change" element={<ForcePasswordChange />} />
        <Route path="/employee/unauthorized" element={<Unauthorized />} />
        <Route element={<EmployeeRoute allowedRoles={EMPLOYEE_ROLES} />}>
          <Route element={<EmployeeAppLayout />}>
            <Route path="/employee" element={<EmployeeHomeRedirect />} />
            <Route path="/employee/dashboard" element={<EmployeeHomeRedirect />} />
            <Route path="/employee/notifications" element={<EmployeeNotifications />} />
            <Route path="/employee/shifts/calendar" element={<ShiftCalendar />} />

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
              <Route path={EMPLOYEE_ROLE_PATHS.doctor} element={<Navigate to="/doctor" replace />} />
            </Route>
            <Route element={<EmployeeRoute allowedRoles={['nurse']} />}>
              <Route path={EMPLOYEE_ROLE_PATHS.nurse} element={<NurseDashboard />} />
              <Route path="/employee/nurse/patients" element={<NursePatients />} />
              <Route path="/employee/nurse/ward-board" element={<NurseWardBoard />} />
              <Route path="/employee/nurse/tasks" element={<NurseTasks />} />
              <Route path="/employee/nurse/vitals" element={<NurseVitals />} />
              <Route path="/employee/nurse/notes" element={<NurseNotes />} />
              <Route path="/employee/nurse/handover" element={<NurseHandover />} />
            </Route>
            <Route element={<EmployeeRoute allowedRoles={['receptionist', 'admin', 'superadmin', 'subadmin']} />}>
              <Route path={EMPLOYEE_ROLE_PATHS.receptionist} element={<ReceptionistDashboard />} />
              <Route path="/employee/receptionist/register-patient" element={<PatientRegistration />} />
              <Route path="/employee/receptionist/appointments" element={<AppointmentDesk />} />
              <Route path="/employee/receptionist/queue" element={<AppointmentDesk />} />
              <Route path="/employee/receptionist/patients" element={<PatientSearch />} />
              <Route path="/employee/receptionist/history" element={<PatientHistory />} />
            </Route>
            <Route element={<EmployeeRoute allowedRoles={['labTechnician']} />}>
              <Route path={EMPLOYEE_ROLE_PATHS.labTechnician} element={<LabTechDashboard />} />
              <Route path="/employee/lab-technician/orders" element={<LabTechOrdersInbox />} />
              <Route path="/employee/lab-technician/processing" element={<LabTechOrdersInbox presetStatus="inProcessing" title="Lab Processing Queue" description="Focus on collected samples, in-process tests, uploads, and release-ready reports." />} />
              <Route path="/employee/lab-technician/completed" element={<LabTechOrdersInbox presetStatus="reportReady" title="Reports Ready For Release" description="Review report-ready orders, confirm payment, and release eligible results to the patient portal." />} />
              <Route path="/employee/lab-technician/profile" element={<LabTechProfile />} />
            </Route>
            <Route element={<EmployeeRoute allowedRoles={['pharmacist']} />}>
              <Route path={EMPLOYEE_ROLE_PATHS.pharmacist} element={<PharmacistDashboard />} />
              <Route path="/employee/pharmacist/orders" element={<PharmacistOrders />} />
              <Route path="/employee/pharmacist/inventory" element={<PharmacistInventory />} />
              <Route path="/employee/pharmacist/history" element={<PharmacistHistory />} />
            </Route>
            <Route path="/employee/profile" element={<ProfilePage />} />
            <Route element={<EmployeeRoute allowedRoles={['superadmin', 'admin', 'receptionist']} />}>
              <Route path="/employee/billing" element={<BillingManagement />} />
            </Route>
            <Route element={<EmployeeRoute allowedRoles={['superadmin', 'admin']} />}>
              <Route path="/employee/doctors" element={<DoctorManagement />} />
              <Route path="/employee/doctor-availability" element={<DoctorAvailabilityManagement />} />
            </Route>
            <Route element={<EmployeeRoute allowedRoles={['superadmin', 'admin']} />}>
              <Route path="/employee/doctors/:id" element={<DoctorDetail />} />
            </Route>
            <Route element={<EmployeeRoute allowedRoles={['superadmin', 'admin', 'subadmin']} />}>
              <Route path="/employee/wards" element={<WardManagement />} />
              <Route path="/employee/beds" element={<BedManagement />} />
              <Route path="/employee/nurse-assignments" element={<NurseDutyAllocation />} />
              <Route path="/employee/shifts" element={<ShiftManagement />} />
              <Route path="/employee/staff-availability" element={<StaffAvailability />} />
            </Route>
            <Route element={<EmployeeRoute allowedRoles={['superadmin', 'admin']} />}>
              <Route path="/employee/patients" element={<PatientManagement />} />
              <Route path="/employee/admissions" element={<AdmissionManagement />} />
              <Route path="/employee/awards" element={<AwardManagement />} />
              <Route path="/employee/departments" element={<DepartmentManagement />} />
              <Route path="/employee/locations" element={<LocationManagement />} />
              <Route path="/employee/analytics" element={<AnalyticsDashboard />} />
              <Route path="/employee/audit" element={<AuditHistoryPage />} />
              <Route path="/employee/settings" element={<HospitalSettingsPage />} />
            </Route>
            <Route element={<EmployeeRoute allowedRoles={['superadmin', 'admin', 'subadmin', 'doctor', 'receptionist']} />}>
              <Route path="/employee/patients/:id" element={<PatientDetail />} />
            </Route>
            <Route element={<EmployeeRoute allowedRoles={['superadmin', 'admin', 'doctor', 'labTechnician']} />}>
              <Route path="/employee/lab-orders/:id" element={<LabOrderDetail />} />
            </Route>
            <Route element={<EmployeeRoute allowedRoles={['superadmin', 'admin', 'pharmacist']} />}>
              <Route path="/employee/pharmacy-orders/:id" element={<PharmacyOrderDetail />} />
            </Route>
            <Route element={<EmployeeRoute allowedRoles={STAFF_MANAGEMENT_ROLES} />}>
              <Route path="/employee/users" element={<Navigate to="/employee/manage-roles" replace />} />
              <Route path="/employee/manage-roles" element={<UserManagement />} />
              <Route path="/employee/manage-roles/add" element={<AddUserPage />} />
            </Route>
          </Route>
        </Route>

        {/* Doctor Routes */}
        <Route element={<EmployeeRoute allowedRoles={['doctor']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/doctor/appointments" element={<DoctorAppointments />} />
            <Route path="/doctor/appointments/:id/summary" element={<PatientSummary />} />
            <Route path="/doctor/patients" element={<DoctorPatients />} />
            <Route path="/doctor/prescriptions" element={<DoctorPrescriptions />} />
            <Route path="/doctor/lab-orders" element={<DoctorLabOrders />} />
            <Route path="/doctor/reports" element={<DoctorReports />} />
            <Route path="/doctor/availability" element={<DoctorAvailability />} />
          </Route>
        </Route>

        <Route path="/login" element={<Navigate to="/patient/login" replace />} />
        <Route path="/register" element={<Navigate to="/patient/register" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/employee/forgot-password" replace />} />
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
