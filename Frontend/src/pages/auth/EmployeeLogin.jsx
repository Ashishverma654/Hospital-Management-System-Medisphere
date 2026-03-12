import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { EMPLOYEE_ROLE_OPTIONS, getEmployeeHomeRoute } from '../../auth/constants.js';
import { loginEmployee } from '../../services/authService.js';
import { loginSuccess } from '../../store/authSlice.js';

export default function EmployeeLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    role: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.role) {
      toast.error('Select your role before signing in.');
      return;
    }

    setIsLoading(true);
    try {
      const auth = await loginEmployee(formData.identifier, formData.password, formData.role);
      dispatch(loginSuccess(auth));
      localStorage.setItem('mediflow_auth', JSON.stringify(auth));
      toast.success(`Signed in as ${auth.user.role}.`);
      const fallback = location.state?.from?.pathname?.startsWith('/employee')
        ? location.state.from.pathname
        : getEmployeeHomeRoute(auth.user.role);
      navigate(fallback, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Invalid credentials or role selection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 text-white shadow-2xl">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Hospital System</p>
          <h1 className="mt-3 text-3xl font-semibold">Employee Login</h1>
          <p className="mt-2 text-sm text-slate-400">
            Use your work email or employee ID, password, and selected role to enter the employee app.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField htmlFor="employee-identifier" label="Email or Employee ID">
            <input
              id="employee-identifier"
              type="text"
              value={formData.identifier}
              onChange={(event) => updateField('identifier', event.target.value)}
              placeholder="name@hospital.com or EMP-1001"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-sky-400"
              required
            />
          </FormField>

          <FormField htmlFor="employee-password" label="Password">
            <input
              id="employee-password"
              type="password"
              value={formData.password}
              onChange={(event) => updateField('password', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-sky-400"
              required
            />
          </FormField>

          <FormField htmlFor="employee-role" label="Role">
            <select
              id="employee-role"
              value={formData.role}
              onChange={(event) => updateField('role', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-sky-400"
              required
            >
              <option value="">Select your role</option>
              {EMPLOYEE_ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </FormField>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl bg-sky-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </section>
    </main>
  );
}

function FormField({ children, htmlFor, label }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-slate-200">
        {label}
      </label>
      {children}
    </div>
  );
}
