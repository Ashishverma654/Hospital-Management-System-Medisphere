import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice.js';
import { STAFF_MANAGEMENT_ROLES, getEmployeeHomeRoute, getRoleLabel } from '../../auth/constants.js';

const navClass = ({ isActive }) => (
  isActive
    ? 'rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white'
    : 'rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100'
);

export default function EmployeeAppLayout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const homeRoute = getEmployeeHomeRoute(user?.role);
  const canManageUsers = STAFF_MANAGEMENT_ROLES.includes(user?.role);
  const canAccessGovernance = ['superadmin', 'admin'].includes(user?.role);
  const canManageDoctors = ['superadmin', 'admin'].includes(user?.role);
  const isReceptionist = user?.role === 'receptionist';
  const isLabTechnician = user?.role === 'labTechnician';
  const isPharmacist = user?.role === 'pharmacist';
  const isNurse = user?.role === 'nurse';
  const navigationItems = [
    { to: homeRoute, label: `${getRoleLabel(user?.role || 'employee')} Dashboard` },
    ...(isReceptionist
      ? [
          { to: '/employee/receptionist/register-patient', label: 'Register Patient' },
          { to: '/employee/receptionist/appointments', label: 'Book Appointment' },
          { to: '/employee/receptionist/queue', label: 'Today Queue' },
          { to: '/employee/receptionist/patients', label: 'Search Patients' },
          { to: '/employee/billing', label: 'Billing' },
        ]
      : []),
    ...(isLabTechnician
      ? [
          { to: '/employee/lab-technician/orders', label: 'Lab Orders' },
          { to: '/employee/lab-technician/processing', label: 'Processing Queue' },
          { to: '/employee/lab-technician/completed', label: 'Ready Reports' },
        ]
      : []),
    ...(isPharmacist
      ? [
          { to: '/employee/pharmacist/orders', label: 'Pharmacy Orders' },
          { to: '/employee/pharmacist/inventory', label: 'Inventory' },
          { to: '/employee/pharmacist/history', label: 'Order History' },
        ]
      : []),
    ...(isNurse
      ? [
          { to: '/employee/nurse/patients', label: 'Assigned Patients' },
          { to: '/employee/nurse/ward-board', label: 'Ward Board' },
          { to: '/employee/nurse/tasks', label: 'Tasks' },
          { to: '/employee/nurse/vitals', label: 'Vitals' },
          { to: '/employee/nurse/notes', label: 'Notes' },
          { to: '/employee/nurse/handover', label: 'Handover' },
        ]
      : []),
    ...(canManageUsers
      ? [
          { to: '/employee/manage-roles', label: 'Manage Roles' },
        ]
      : []),
    ...(canManageDoctors
      ? [
          { to: '/employee/doctors', label: 'Doctors' },
        ]
      : []),
    ...(canAccessGovernance
      ? [
          { to: '/employee/patients', label: 'Patients' },
          { to: '/employee/billing', label: 'Billing' },
          { to: '/employee/wards', label: 'Wards' },
          { to: '/employee/beds', label: 'Beds' },
          { to: '/employee/admissions', label: 'Admissions' },
          { to: '/employee/awards', label: 'Awards' },
          { to: '/employee/departments', label: 'Departments' },
          { to: '/employee/specializations', label: 'Specializations' },
          { to: '/employee/locations', label: 'Locations' },
          { to: '/employee/audit', label: 'Audit History' },
          { to: '/employee/settings', label: 'Hospital Settings' },
        ]
      : []),
    { to: '/employee/profile', label: 'Profile' },
  ];

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('mediflow_auth');
    navigate('/employee/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-72 border-r border-slate-200 bg-slate-950 px-6 py-8 text-white lg:block">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Hospital System</p>
        <h1 className="mt-3 text-2xl font-semibold">Staff Workspace</h1>
        <p className="mt-3 text-sm text-slate-300">
          Internal hospital navigation stays isolated from the patient-facing app and adapts to each employee role.
        </p>

        <nav className="mt-8 flex flex-col gap-2">
          {navigationItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-sm text-slate-500">Employee Session</p>
              <h2 className="text-xl font-semibold text-slate-900">{user?.name || 'Hospital Employee'}</h2>
              <p className="mt-1 text-sm text-slate-500">
                Signed in to the internal hospital system as {getRoleLabel(user?.role || 'employee')}.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <NavLink
                to="/employee/profile"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Profile
              </NavLink>
              {canAccessGovernance && (
                <NavLink
                  to="/employee/settings"
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Settings
                </NavLink>
              )}
              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium capitalize text-slate-700">
                {getRoleLabel(user?.role || 'employee')}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
