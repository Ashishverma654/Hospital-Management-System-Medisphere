import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isEmployeeRole, normalizeRole } from '../../auth/constants.js';

export default function EmployeeRoute({ allowedRoles }) {
  const location = useLocation();
  const { isAuthenticated, sessionType, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/employee/login" replace state={{ from: location }} />;
  }

  const normalizedRole = normalizeRole(user?.role);

  if (sessionType !== 'employee' || !isEmployeeRole(normalizedRole)) {
    return <Navigate to="/patient" replace />;
  }

  if (allowedRoles?.length) {
    const normalizedAllowed = allowedRoles.map((role) => normalizeRole(role));
    if (!normalizedAllowed.includes(normalizedRole)) {
      return <Navigate to="/employee/unauthorized" replace />;
    }
  }

  return <Outlet />;
}
