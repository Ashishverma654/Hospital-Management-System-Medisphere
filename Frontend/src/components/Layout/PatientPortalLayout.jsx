import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice.js';
import { PATIENT_PORTAL_NAV_ITEMS } from '../../patient/constants.js';

const portalLinkClass = ({ isActive }) => (
  isActive
    ? 'rounded-2xl bg-[#ee4c35] px-4 py-3 text-sm font-semibold text-white'
    : 'rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100'
);

export default function PatientPortalLayout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('mediflow_auth');
    navigate('/patient/login');
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-sm text-slate-500">Patient Portal</p>
            <h1 className="text-xl font-semibold text-slate-900">{user?.name || 'Patient'}</h1>
            <p className="mt-1 text-sm text-slate-500">A personal health workspace that stays separate from staff systems.</p>
          </div>

          <div className="flex items-center gap-3">
            <NavLink
              to="/patient/profile"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Profile
            </NavLink>
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

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[280px,minmax(0,1fr)] sm:px-6">
        <aside className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">My Portal</p>
          <nav className="mt-5 flex flex-col gap-2">
            {PATIENT_PORTAL_NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={portalLinkClass}>
                <div>
                  <p>{item.label}</p>
                  <p className="mt-1 text-xs font-normal opacity-80">{item.description}</p>
                </div>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
