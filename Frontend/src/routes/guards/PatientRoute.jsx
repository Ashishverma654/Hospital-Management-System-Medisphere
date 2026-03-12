import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function PatientRoute() {
  const location = useLocation();
  const { isAuthenticated, sessionType, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/patient/login" replace state={{ from: location }} />;
  }

  if (sessionType !== 'patient' || user?.role !== 'patient') {
    return <Navigate to="/employee/dashboard" replace />;
  }

  return <Outlet />;
}
