import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { loginSuccess } from '../../store/authSlice.js';
import { registerPatient } from '../../services/authService.js';
import { getEmployeeHomeRoute } from '../../auth/constants.js';

const initialForm = {
  name: '',
  dob: '',
  email: '',
  phone: '',
  password: '',
  pin: '',
};

export default function PatientRegister() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, sessionType, user } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  if (isAuthenticated) {
    if (sessionType === 'patient' && user?.role === 'patient') {
      return <Navigate to="/patient/dashboard" replace />;
    }

    return <Navigate to={getEmployeeHomeRoute(user?.role)} replace />;
  }

  const handleRegister = async (event) => {
    event.preventDefault();

    if (!formData.password && !formData.pin) {
      toast.error('Choose a password, a 4-digit PIN, or both.');
      return;
    }

    setIsLoading(true);
    try {
      const auth = await registerPatient(formData);
      dispatch(loginSuccess(auth));
      localStorage.setItem('mediflow_auth', JSON.stringify(auth));
      toast.success('Account created successfully.');
      navigate('/patient', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8">
          <p className="text-sm text-slate-500">Patient registration</p>
          <h1 className="text-3xl font-semibold text-slate-900">Create your patient account</h1>
          <p className="mt-2 text-sm text-slate-600">
            Staff access is managed separately through the employee system.
          </p>
          <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Create a patient account to access appointments, bills, prescriptions, lab reports, and future portal tools.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Full Name" htmlFor="register-name">
              <input
                id="register-name"
                type="text"
                value={formData.name}
                onChange={(event) => updateField('name', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#ee4c35]"
                required
              />
            </FormField>

            <FormField label="Date of Birth" htmlFor="register-dob">
              <input
                id="register-dob"
                type="date"
                value={formData.dob}
                onChange={(event) => updateField('dob', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#ee4c35]"
                required
              />
            </FormField>
          </div>

          <FormField label="Email" htmlFor="register-email">
            <input
              id="register-email"
              type="email"
              value={formData.email}
              onChange={(event) => updateField('email', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#ee4c35]"
              required
            />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Phone Number" htmlFor="register-phone">
              <input
                id="register-phone"
                type="tel"
                value={formData.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#ee4c35]"
                maxLength={10}
                pattern="[0-9]{10}"
                required
              />
            </FormField>

            <FormField label="4-digit PIN" htmlFor="register-pin">
              <input
                id="register-pin"
                type="password"
                value={formData.pin}
                onChange={(event) => updateField('pin', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#ee4c35]"
                maxLength={4}
                pattern="[0-9]{4}"
              />
            </FormField>
          </div>

          <FormField label="Password" htmlFor="register-password">
            <input
              id="register-password"
              type="password"
              value={formData.password}
              onChange={(event) => updateField('password', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#ee4c35]"
            />
          </FormField>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl bg-[#ee4c35] px-4 py-3 font-semibold text-white transition hover:bg-[#d6442e] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-200 pt-6 text-sm text-slate-600">
          Already have a patient account?{' '}
          <Link to="/patient/login" className="font-semibold text-[#ee4c35] hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}

function FormField({ children, htmlFor, label }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}
