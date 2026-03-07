import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/images/logo.png';
import {
  FiHome, FiUsers, FiCalendar, FiFileText, FiLogOut,
  FiGrid, FiPlusCircle, FiClock, FiClipboard, FiUpload,
  FiSearch, FiActivity, FiMenu, FiX
} from 'react-icons/fi';
import { useState } from 'react';
import './Sidebar.css';

const menuConfig = {
  admin: [
    { path: '/admin', icon: <FiHome />, label: 'Dashboard', end: true },
    { path: '/admin/departments', icon: <FiGrid />, label: 'Departments' },
    { path: '/admin/doctors', icon: <FiUsers />, label: 'Doctors' },
    { path: '/admin/availability', icon: <FiClock />, label: 'Availability' },
    { path: '/admin/appointments', icon: <FiCalendar />, label: 'Appointments' },
  ],
  doctor: [
    { path: '/doctor', icon: <FiHome />, label: 'Dashboard', end: true },
    { path: '/doctor/appointments', icon: <FiCalendar />, label: 'All Appointments' },
    { path: '/doctor/prescriptions', icon: <FiClipboard />, label: 'Prescriptions' },
    { path: '/doctor/reports', icon: <FiUpload />, label: 'Upload Report' },
  ],
  patient: [
    { path: '/patient', icon: <FiHome />, label: 'Dashboard', end: true },
    { path: '/patient/doctors', icon: <FiSearch />, label: 'Find Doctors' },
    { path: '/patient/appointments', icon: <FiCalendar />, label: 'My Appointments' },
    { path: '/patient/prescriptions', icon: <FiFileText />, label: 'Prescriptions' },
    { path: '/patient/reports', icon: <FiActivity />, label: 'Reports' },
  ],
  receptionist: [
    { path: '/receptionist', icon: <FiHome />, label: 'Dashboard', end: true },
    { path: '/receptionist/book', icon: <FiPlusCircle />, label: 'Book Appointment' },
  ],
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = menuConfig[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabels = {
    admin: 'Administrator',
    doctor: 'Doctor',
    patient: 'Patient',
    receptionist: 'Receptionist',
  };

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <FiX /> : <FiMenu />}
      </button>

      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <div className="sidebar__logo">
            <img src={logoImg} alt="MediFlow Logo" style={{ height: '32px', width: 'auto' }} />
          </div>
          <div className="sidebar__brand-text">
            <h2>MediFlow</h2>
            <span>HMS Portal</span>
          </div>
        </div>

        <div className="sidebar__user">
          <div className="sidebar__avatar">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="sidebar__user-info">
            <p className="sidebar__user-name">{user?.name}</p>
            <span className="sidebar__user-role">{roleLabels[user?.role]}</span>
          </div>
        </div>

        <nav className="sidebar__nav">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="sidebar__link-icon">{item.icon}</span>
              <span className="sidebar__link-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="sidebar__logout" onClick={handleLogout}>
          <FiLogOut />
          <span>Logout</span>
        </button>
      </aside>

      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
    </>
  );
};

export default Sidebar;
