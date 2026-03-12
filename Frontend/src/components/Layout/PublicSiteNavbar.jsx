import { Link, NavLink } from 'react-router-dom';
import logoImg from '../../assets/logo.png';

const navLinkClass = ({ isActive }) => (
  isActive
    ? 'text-[#ee4c35] font-semibold'
    : 'text-slate-600 hover:text-[#ee4c35] transition-colors'
);

export default function PublicSiteNavbar() {
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
          <NavLink to="/" className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/patient/login" className={navLinkClass}>
            Patient Login
          </NavLink>
          <NavLink to="/patient/register" className={navLinkClass}>
            Register
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
