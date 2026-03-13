import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getEmployeeHomeRoute } from '../../auth/constants.js';

export default function PatientRoute() {
  const location = useLocation();
  const { isAuthenticated, sessionType, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/patient/login" replace state={{ from: location }} />;
  }

  if (sessionType !== 'patient' || user?.role !== 'patient') {
    return <Navigate to={getEmployeeHomeRoute(user?.role)} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
