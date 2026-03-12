import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isEmployeeRole } from '../../auth/constants.js';

export default function EmployeeRoute({ allowedRoles }) {
  const location = useLocation();
  const { isAuthenticated, sessionType, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/employee/login" replace state={{ from: location }} />;
  }

  if (sessionType !== 'employee' || !isEmployeeRole(user?.role)) {
    return <Navigate to="/patient" replace />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/employee/unauthorized" replace />;
  }

  return <Outlet />;
}
