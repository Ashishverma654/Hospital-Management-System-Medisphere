import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Calendar, FileText, Pill, FlaskConical, ClipboardList,
  CreditCard, Clock, User, Bell, LogOut, Heart, ChevronRight, Menu, X,
} from 'lucide-react';
import { useState } from 'react';
import { logout } from '../../store/authSlice.js';
import { pageVariants } from '../../lib/animation-variants.js';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar.jsx';
import logoImg from '../../assets/logo.png';
import ThemeToggle from '../ThemeToggle.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const NAV_ITEMS = [
  { to: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Overview and care status' },
  { to: '/patient/appointments', label: 'Appointments', icon: Calendar, desc: 'Visits and scheduling' },
  { to: '/patient/prescriptions', label: 'Prescriptions', icon: FileText, desc: 'Active medicines' },
  { to: '/patient/medicine-orders', label: 'Medicine Orders', icon: Pill, desc: 'Pharmacy orders' },
  { to: '/patient/lab-tests', label: 'Lab Tests', icon: FlaskConical, desc: 'Ordered tests' },
  { to: '/patient/lab-reports', label: 'Lab Reports', icon: ClipboardList, desc: 'Released reports' },
  { to: '/patient/bills', label: 'Bills & Payments', icon: CreditCard, desc: 'Invoices and payments' },
  { to: '/patient/history', label: 'Medical History', icon: Clock, desc: 'Timeline of care' },
  { to: '/patient/profile', label: 'Profile', icon: User, desc: 'Personal details' },
  { to: '/patient/notifications', label: 'Notifications', icon: Bell, desc: 'Care alerts' },
];

const navLinkClass = ({ isActive }) =>
  `group flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm transition-all ${
    isActive
      ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  }`;

export default function PatientPortalLayout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('mediflow_auth');
    navigate('/patient/login');
  };

  const SidebarContent = () => (
    <div className="flex h-full min-h-0 flex-col">
      {/* Brand (removed as requested) */}

      {/* Nav links */}
      <nav className="flex-1 min-h-0 space-y-1 overflow-y-auto pr-1 pb-3 overflow-x-hidden">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={navLinkClass}
            onClick={() => setMobileSidebarOpen(false)}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="min-w-0 truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="mt-4 pt-4 border-t border-border">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen doccure-shell">
      {/* Top header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="flex items-center justify-center h-10 w-10 rounded-xl border border-border bg-card hover:bg-muted transition-colors lg:hidden"
            >
              {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2.5">
              <img src={logoImg} alt="Hospital logo" className="h-9 w-auto" />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">MediFlow Hospital</p>
                <h2 className="text-base font-semibold text-foreground">Patient Portal</h2>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="relative">
              <input
                type="search"
                placeholder="Search appointments, bills, or doctors"
                className="h-10 w-[260px] rounded-full border border-border bg-card px-4 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NavLink
              to="/patient/notifications"
              className="relative flex items-center justify-center h-10 w-10 rounded-xl border border-border bg-card hover:bg-muted transition-colors"
            >
              <Bell className="h-4 w-4 text-muted-foreground" />
            </NavLink>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1.5 shadow-sm max-w-[220px] outline-none">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Patient'}`} />
                  <AvatarFallback>{user?.name?.charAt(0) || 'P'}</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-semibold text-foreground sm:inline truncate">{user?.name || 'Patient'}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="cursor-pointer p-0">
                  <NavLink to="/patient/profile" className="w-full px-2 py-1.5">Profile</NavLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={handleLogout}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-[280px] rounded-3xl border border-border bg-card p-5 shadow-sm sticky top-[88px] h-[calc(100vh-120px)] overflow-hidden">
          <div className="doccure-card-soft p-4 mb-5">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border border-border">
                <AvatarImage src={user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Patient'}`} />
                <AvatarFallback>{user?.name?.charAt(0) || 'P'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-foreground truncate">{user?.name || 'Patient'}</p>
                <p className="text-xs text-muted-foreground">{user?.patientId ? `ID: ${user.patientId}` : 'Patient ID pending'}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="doccure-chip">Care plan</span>
              <span className="doccure-chip">Lab updates</span>
            </div>
          </div>
          <SidebarContent />
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileSidebarOpen(false)} />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute left-0 top-0 bottom-0 z-50 w-[280px] flex flex-col bg-card p-4 shadow-xl border-r border-border overflow-hidden"
            >
              <SidebarContent />
            </motion.aside>
          </div>
        )}

        {/* Main content */}
        <motion.main variants={pageVariants} initial="initial" animate="animate" className="flex-1 min-w-0">
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
