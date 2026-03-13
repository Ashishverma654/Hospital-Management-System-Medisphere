import { Link, NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import logoImg from '../../assets/logo.png';
import { PUBLIC_NAV_ITEMS } from '../../patient/constants.js';

const navLinkClass = ({ isActive }) => (
  isActive
    ? 'text-[#ee4c35] font-semibold'
    : 'text-slate-600 hover:text-[#ee4c35] transition-colors'
);

export default function PublicSiteNavbar() {
  const { isAuthenticated, sessionType, user } = useSelector((state) => state.auth);
  const portalRoute = sessionType === 'patient' && user?.role === 'patient' ? '/patient/dashboard' : '/patient/login';

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoImg} alt="MediFlow" className="h-10 w-auto" />
          <div>
            <div className="text-lg font-bold text-slate-900">MediFlow</div>
            <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Patient Access</div>
          </div>
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          {PUBLIC_NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
          <NavLink to={portalRoute} className={navLinkClass}>
            {isAuthenticated && sessionType === 'patient' ? 'Patient Portal' : 'Patient Login'}
          </NavLink>
          <NavLink
            to="/patient/register"
            className="rounded-full bg-[#ee4c35] px-4 py-2 font-semibold text-white transition hover:bg-[#d6442e]"
          >
            Register
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
