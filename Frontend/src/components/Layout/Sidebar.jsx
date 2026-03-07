import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { 
  FiGrid, 
  FiUsers, 
  FiCalendar, 
  FiFileText, 
  FiCreditCard,
  FiSettings,
  FiBriefcase,
  FiActivity,
  FiVideo,
  FiServer
} from 'react-icons/fi';
import { FaPills, FaBed } from 'react-icons/fa';

export default function Sidebar({ isOpen }) {
  const { user } = useSelector(state => state.auth);
  const role = user?.role || 'patient';

  // Role based navigation links
  const navLinks = {
    admin: [
      { name: 'Dashboard', path: '/admin', icon: FiGrid },
      { name: 'Doctors', path: '/admin/doctors', icon: FiBriefcase },
      { name: 'Departments', path: '/admin/departments', icon: FiServer },
      { name: 'Patients', path: '/admin/patients', icon: FiUsers },
      { name: 'Appointments', path: '/admin/appointments', icon: FiCalendar },
      { name: 'Billing', path: '/admin/billing', icon: FiCreditCard },
      { name: 'Pharmacy', path: '/admin/pharmacy', icon: FaPills },
      { name: 'Beds', path: '/admin/beds', icon: FaBed },
      { name: 'Inventory', path: '/admin/inventory', icon: FiActivity },
      { name: 'Analytics', path: '/admin/analytics', icon: FiActivity },
    ],
    doctor: [
      { name: 'Dashboard', path: '/doctor', icon: FiGrid },
      { name: 'Appointments', path: '/doctor/appointments', icon: FiCalendar },
      { name: 'Patients', path: '/doctor/patients', icon: FiUsers },
      { name: 'Prescriptions', path: '/doctor/prescriptions', icon: FiFileText },
      { name: 'Lab Reports', path: '/doctor/reports', icon: FiFileText },
      { name: 'Availability', path: '/doctor/availability', icon: FiSettings },
    ],
    patient: [
      { name: 'Dashboard', path: '/patient', icon: FiGrid },
      { name: 'Book Appointment', path: '/patient/book', icon: FiCalendar },
      { name: 'My Appointments', path: '/patient/appointments', icon: FiCalendar },
      { name: 'Prescriptions', path: '/patient/prescriptions', icon: FiFileText },
      { name: 'Reports', path: '/patient/reports', icon: FiFileText },
      { name: 'Billing', path: '/patient/billing', icon: FiCreditCard },
      { name: 'Telemedicine', path: '/patient/telemedicine', icon: FiVideo },
    ],
    receptionist: [
      { name: 'Dashboard', path: '/receptionist', icon: FiGrid },
      { name: 'Register Patient', path: '/receptionist/register', icon: FiUsers },
      { name: 'Appointments', path: '/receptionist/appointments', icon: FiCalendar },
      { name: 'Billing', path: '/receptionist/billing', icon: FiCreditCard },
      { name: 'Reports', path: '/receptionist/reports', icon: FiFileText },
      { name: 'Patient DB', path: '/receptionist/patients', icon: FiUsers },
    ]
  };

  const links = navLinks[role] || [];

  return (
    <motion.aside
      initial={{ width: isOpen ? 250 : 80 }}
      animate={{ width: isOpen ? 250 : 80 }}
      className="bg-card border-r border-border min-h-screen hidden md:flex flex-col  z-20 transition-all duration-300 relative"
    >
      <div className="flex items-center justify-center h-16 border-b border-border p-4">
        {isOpen ? (
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            MediFlow
          </h1>
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
            M
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {links.map((link) => (
             <li key={link.name}>
             <NavLink
               end={link.path.split('/').length === 2} // Exact match for root layout endpoints
               to={link.path}
               className={({ isActive }) =>
                 `flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                   isActive 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'text-muted-foreground hover:bg-accent/10 hover:text-accent'
                 }`
               }
             >
               <link.icon className={`h-5 w-5 flex-shrink-0`} />
               {isOpen && <span>{link.name}</span>}
             </NavLink>
           </li>
          ))}
        </ul>
      </nav>
      
      {isOpen && (
        <div className="p-4 border-t border-border text-xs text-center text-muted-foreground">
          MediFlow v2.0
        </div>
      )}
    </motion.aside>
  );
}
