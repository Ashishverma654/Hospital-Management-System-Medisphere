import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, UserCog, Stethoscope, Calendar, CreditCard,
  BedDouble, Building2, MapPin, Award, Settings, ShieldCheck,
  LogOut, Menu, X, Bell, User, ChevronRight, Heart,
  ClipboardList, FlaskConical, Pill, NotepadText, Activity,
  FileBarChart, Clock, PanelLeftClose, PanelLeft
} from 'lucide-react';
import { logout } from '../../store/authSlice.js';
import { STAFF_MANAGEMENT_ROLES, getEmployeeHomeRoute, getRoleLabel } from '../../auth/constants.js';
import { pageVariants } from '../../lib/animation-variants.js';
import { ScrollArea } from '../ui/scroll-area.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar.jsx';
import ThemeToggle from '../ThemeToggle.jsx';

const buildNavItems = (role, homeRoute) => {
  const canManageUsers = STAFF_MANAGEMENT_ROLES.includes(role);
  const canAccessGovernance = ['superadmin', 'admin'].includes(role);
  const canManageDoctors = ['superadmin', 'admin'].includes(role);

  const sections = [];

  // Dashboard section
  sections.push({
    label: 'Overview',
    items: [{ to: homeRoute, label: `Dashboard`, icon: LayoutDashboard }],
  });

  // Role-specific sections
  if (role === 'receptionist') {
    sections.push({
      label: 'Front Desk',
      items: [
        { to: '/employee/receptionist/register-patient', label: 'Register Patient', icon: Users },
        { to: '/employee/receptionist/appointments', label: 'Book Appointment', icon: Calendar },
        { to: '/employee/receptionist/queue', label: 'Today Queue', icon: Clock },
        { to: '/employee/receptionist/patients', label: 'Search Patients', icon: Users },
        { to: '/employee/billing', label: 'Billing', icon: CreditCard },
      ],
    });
  }

  if (role === 'labTechnician') {
    sections.push({
      label: 'Diagnostics',
      items: [
        { to: '/employee/lab-technician/orders', label: 'Lab Orders', icon: FlaskConical },
        { to: '/employee/lab-technician/processing', label: 'Processing Queue', icon: Activity },
        { to: '/employee/lab-technician/completed', label: 'Ready Reports', icon: FileBarChart },
      ],
    });
  }

  if (role === 'pharmacist') {
    sections.push({
      label: 'Pharmacy',
      items: [
        { to: '/employee/pharmacist/orders', label: 'Pharmacy Orders', icon: Pill },
        { to: '/employee/pharmacist/inventory', label: 'Inventory', icon: ClipboardList },
        { to: '/employee/pharmacist/history', label: 'Order History', icon: Clock },
      ],
    });
  }

  if (role === 'nurse') {
    sections.push({
      label: 'Nursing Station',
      items: [
        { to: '/employee/nurse/patients', label: 'Assigned Patients', icon: Users },
        { to: '/employee/nurse/ward-board', label: 'Ward Board', icon: BedDouble },
        { to: '/employee/nurse/tasks', label: 'Tasks', icon: ClipboardList },
        { to: '/employee/nurse/vitals', label: 'Vitals', icon: Activity },
        { to: '/employee/nurse/notes', label: 'Notes', icon: NotepadText },
        { to: '/employee/nurse/handover', label: 'Handover', icon: ChevronRight },
      ],
    });
  }

  if (canManageUsers) {
    sections.push({
      label: 'Staff',
      items: [{ to: '/employee/manage-roles', label: 'Manage Roles', icon: UserCog }],
    });
  }

  if (canManageDoctors) {
    sections.push({
      label: 'Clinical',
      items: [
        { to: '/employee/doctors', label: 'Doctors', icon: Stethoscope },
        ...(canAccessGovernance ? [{ to: '/employee/patients', label: 'Patients', icon: Users }] : []),
        ...(canAccessGovernance ? [{ to: '/employee/billing', label: 'Billing', icon: CreditCard }] : []),
      ],
    });
  }

  if (canAccessGovernance) {
    sections.push({
      label: 'Operations',
      items: [
        { to: '/employee/wards', label: 'Wards', icon: BedDouble },
        { to: '/employee/beds', label: 'Beds', icon: BedDouble },
        { to: '/employee/admissions', label: 'Admissions', icon: Users },
        { to: '/employee/departments', label: 'Departments', icon: Building2 },
        { to: '/employee/specializations', label: 'Specializations', icon: Stethoscope },
        { to: '/employee/locations', label: 'Locations', icon: MapPin },
        { to: '/employee/awards', label: 'Awards', icon: Award },
      ],
    });
    sections.push({
      label: 'System',
      items: [
        { to: '/employee/audit', label: 'Audit History', icon: ShieldCheck },
        { to: '/employee/settings', label: 'Settings', icon: Settings },
      ],
    });
  }

  // Common
  sections.push({
    label: 'Account',
    items: [
      { to: '/employee/profile', label: 'Profile', icon: User },
      { to: '/employee/notifications', label: 'Notifications', icon: Bell },
    ],
  });

  return sections;
};

const sidebarLinkClass = ({ isActive }) =>
  `group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all ${
    isActive
      ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm'
      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
  }`;

export default function EmployeeAppLayout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const homeRoute = getEmployeeHomeRoute(user?.role);
  const navSections = buildNavItems(user?.role, homeRoute);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('mediflow_auth');
    navigate('/employee/login');
  };

  const SidebarInner = ({ isMobile = false }) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-sidebar-border">
        <Link to={homeRoute} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Heart className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          {(!collapsed || isMobile) && (
            <div>
              <p className="text-sm font-bold text-sidebar-foreground">MediFlow</p>
              <p className="text-[9px] uppercase tracking-[0.15em] text-sidebar-foreground/50">Staff Portal</p>
            </div>
          )}
        </Link>
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center h-7 w-7 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Profile block */}
      {(!collapsed || isMobile) && (
        <div className="mx-4 mt-4 rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 border border-sidebar-border">
              <AvatarImage src={user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Employee'}`} />
              <AvatarFallback>{user?.name?.charAt(0) || 'E'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-sidebar-foreground">{user?.name || 'Employee'}</p>
              <p className="text-xs text-sidebar-foreground/60">{user?.employeeId ? `ID: ${user.employeeId}` : getRoleLabel(user?.role)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav sections */}
      <ScrollArea className="flex-1 py-4 px-3">
        {navSections.map((section) => (
          <div key={section.label} className="mb-4">
            {(!collapsed || isMobile) && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/40">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={sidebarLinkClass}
                  onClick={isMobile ? () => setMobileOpen(false) : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {(!collapsed || isMobile) && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </ScrollArea>

      {/* User info + logout */}
      <div className="border-t border-sidebar-border px-3 py-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 transition-colors hover:bg-red-500/10 hover:text-red-400"
          title="Sign out"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {(!collapsed || isMobile) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen doccure-shell">
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ${
          collapsed ? 'w-[68px]' : 'w-[260px]'
        }`}
      >
        <SidebarInner />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute left-0 top-0 bottom-0 z-50 w-[260px] flex flex-col bg-sidebar shadow-2xl"
          >
            <SidebarInner isMobile />
          </motion.aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex items-center justify-center h-10 w-10 rounded-xl border border-border bg-card hover:bg-muted transition-colors lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{getRoleLabel(user?.role)} Workspace</p>
                <h2 className="text-base font-semibold text-foreground">{user?.name || 'Employee'}</h2>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <input
                type="search"
                placeholder="Search staff, patients, or modules"
                className="h-10 w-[280px] rounded-full border border-border bg-card px-4 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NavLink
                to="/employee/notifications"
                className="flex items-center justify-center h-10 w-10 rounded-xl border border-border bg-card hover:bg-muted transition-colors"
              >
                <Bell className="h-4 w-4 text-muted-foreground" />
              </NavLink>
              <NavLink
                to="/employee/profile"
                className="flex items-center justify-center h-10 w-10 rounded-xl border border-border bg-card hover:bg-muted transition-colors"
              >
                <User className="h-4 w-4 text-muted-foreground" />
              </NavLink>
            </div>
          </div>
        </header>

        <motion.main
          variants={pageVariants}
          initial="initial"
          animate="animate"
          className="flex-1 px-4 py-6 sm:px-6 lg:px-8"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
