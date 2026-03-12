import { useSelector } from 'react-redux';
import { useCallback } from 'react';

/**
 * Custom hook to get current user and auth status
 * @returns {{user: Object|null, isAuthenticated: boolean, token: string|null, hasRole: Function, checkPermission: Function}}
 */
export const useAuth = () => {
  const { user, token, sessionType, isAuthenticated } = useSelector((state) => state.auth);

  const hasRole = useCallback((requiredRoles) => {
    if (!isAuthenticated || !user) return false;
    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return rolesArray.includes(user.role);
  }, [isAuthenticated, user]);

  const checkPermission = useCallback((requiredRoles) => {
    return hasRole(requiredRoles);
  }, [hasRole]);

  return {
    user,
    isAuthenticated,
    token,
    sessionType,
    hasRole,
    checkPermission,
  };
};

export default useAuth;
