import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice.js';

const portalLinkClass = ({ isActive }) => (
  isActive
    ? 'rounded-full bg-[#ee4c35] px-4 py-2 text-sm font-semibold text-white'
    : 'rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100'
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
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-sm text-slate-500">Patient Portal</p>
            <h1 className="text-xl font-semibold text-slate-900">{user?.name || 'Patient'}</h1>
          </div>

          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-2">
              <NavLink to="/patient" end className={portalLinkClass}>
                Overview
              </NavLink>
            </nav>
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

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
