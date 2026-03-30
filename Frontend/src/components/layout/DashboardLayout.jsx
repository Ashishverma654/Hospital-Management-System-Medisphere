import { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { DoctorVideoCallProvider } from '../../context/DoctorVideoCallContext.jsx';
import VideoCallDock from '../doctor/VideoCallDock.jsx';

export default function DashboardLayout({ allowedRoles }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  useEffect(() => {
    const handleOpenPrescription = (event) => {
      const appointmentId = event?.detail?.appointmentId;
      if (!appointmentId) return;
      navigate(`/doctor/prescriptions?appointmentId=${appointmentId}`);
    };
    window.addEventListener('doctor:open-prescription', handleOpenPrescription);
    return () => window.removeEventListener('doctor:open-prescription', handleOpenPrescription);
  }, [navigate]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <DoctorVideoCallProvider>
      <div className="flex h-screen overflow-hidden doccure-shell">
        <Sidebar isOpen={isSidebarOpen} />
        
        <div className="flex flex-col flex-1 w-full overflow-hidden">
          <Navbar toggleSidebar={toggleSidebar} />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-7xl mx-auto space-y-6"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <VideoCallDock />
    </DoctorVideoCallProvider>
  );
}
