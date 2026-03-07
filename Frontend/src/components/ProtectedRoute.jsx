import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to their own dashboard
    const rolePaths = {
      admin: '/admin',
      doctor: '/doctor',
      patient: '/patient',
      receptionist: '/receptionist',
    };
    return <Navigate to={rolePaths[user?.role] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;
