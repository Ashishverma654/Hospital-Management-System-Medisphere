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

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('mediflow_auth');
    navigate('/employee/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-72 border-r border-slate-200 bg-slate-950 px-6 py-8 text-white lg:block">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Hospital System</p>
        <h1 className="mt-3 text-2xl font-semibold">Employee App</h1>
        <p className="mt-3 text-sm text-slate-300">
          Sidebar shell ready for future modules. Navigation stays isolated from the patient-facing app.
        </p>

        <nav className="mt-8 flex flex-col gap-2">
          <NavLink to={homeRoute} className={navClass}>
            {user?.role === 'subadmin' ? 'Subadmin Dashboard' : 'Dashboard'}
          </NavLink>
          {canManageUsers && (
            <>
              <NavLink to="/employee/manage-roles" className={navClass}>
                Manage Roles
              </NavLink>
              <NavLink to="/employee/patients" className={navClass}>
                Patients
              </NavLink>
            </>
          )}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-sm text-slate-500">Employee Session</p>
              <h2 className="text-xl font-semibold text-slate-900">{user?.name || 'Hospital Employee'}</h2>
            </div>

            <div className="flex items-center gap-3">
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
