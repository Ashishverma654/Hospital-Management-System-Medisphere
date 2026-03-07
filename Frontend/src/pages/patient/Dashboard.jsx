import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiSearch, FiCalendar, FiFileText, FiActivity } from 'react-icons/fi';
import './PatientPages.css';

const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const quickLinks = [
    { icon: <FiSearch size={28} />, label: 'Find Doctors', desc: 'Browse and book appointments', path: '/patient/doctors', color: '#6C63FF' },
    { icon: <FiCalendar size={28} />, label: 'My Appointments', desc: 'View your scheduled visits', path: '/patient/appointments', color: '#00D4AA' },
    { icon: <FiFileText size={28} />, label: 'Prescriptions', desc: 'Access your prescriptions', path: '/patient/prescriptions', color: '#FFB347' },
    { icon: <FiActivity size={28} />, label: 'Reports', desc: 'View your medical reports', path: '/patient/reports', color: '#54A0FF' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Welcome, {user?.name}</h1>
        <p>Manage your healthcare from one place</p>
      </div>

      <div className="quick-links-grid">
        {quickLinks.map((link) => (
          <div
            key={link.path}
            className="quick-link-card"
            onClick={() => navigate(link.path)}
            style={{ '--accent-color': link.color }}
          >
            <div className="quick-link-icon" style={{ color: link.color, background: `${link.color}15` }}>
              {link.icon}
            </div>
            <h3>{link.label}</h3>
            <p>{link.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientDashboard;
