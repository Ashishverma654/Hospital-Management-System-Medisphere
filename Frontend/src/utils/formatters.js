/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @param {string} format - Format pattern: 'date' | 'time' | 'datetime' | 'short'
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'datetime') => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const options = {
    date: { year: 'numeric', month: 'long', day: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
    datetime: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    short: { year: 'numeric', month: '2-digit', day: '2-digit' },
  };

  return new Intl.DateTimeFormat('en-US', options[format] || options.datetime).format(d);
};

/**
 * Format currency value
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined) return '';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Format phone number
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
};

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials
 */
export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Check if user has required role(s)
 * @param {string} userRole - Current user's role
 * @param {string|Array} requiredRoles - Required role(s)
 * @returns {boolean} Whether user has required role
 */
export const hasRole = (userRole, requiredRoles) => {
  if (!userRole) return false;
  const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return rolesArray.includes(userRole);
};

/**
 * Check role-based access
 * @param {string} userRole - Current user's role
 * @param {string|Array} allowedRoles - Allowed role(s)
 * @returns {boolean} Whether user has access
 */
export const checkAccess = (userRole, allowedRoles) => {
  return hasRole(userRole, allowedRoles);
};

/**
 * Get role label for display
 * @param {string} role - Role string
 * @returns {string} Formatted role label
 */
export const getRoleLabel = (role) => {
  const labels = {
    admin: 'Administrator',
    doctor: 'Doctor',
    patient: 'Patient',
    receptionist: 'Receptionist',
  };
  return labels[role] || role;
};

/**
 * Get status badge colors
 * @param {string} status - Status string
 * @returns {{bg: string, text: string}} Color classes
 */
export const getStatusColor = (status) => {
  const colors = {
    booked: { bg: 'bg-blue-100', text: 'text-blue-800' },
    completed: { bg: 'bg-green-100', text: 'text-green-800' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    paid: { bg: 'bg-green-100', text: 'text-green-800' },
    unpaid: { bg: 'bg-red-100', text: 'text-red-800' },
    available: { bg: 'bg-green-100', text: 'text-green-800' },
    occupied: { bg: 'bg-red-100', text: 'text-red-800' },
    active: { bg: 'bg-green-100', text: 'text-green-800' },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-800' },
  };
  return colors[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number
 * @param {string} phone - Phone to validate
 * @returns {boolean} Whether phone is valid
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^\d{10,}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

export default {
  formatDate,
  formatCurrency,
  formatPhone,
  getInitials,
  hasRole,
  checkAccess,
  getRoleLabel,
  getStatusColor,
  isValidEmail,
  isValidPhone,
};
