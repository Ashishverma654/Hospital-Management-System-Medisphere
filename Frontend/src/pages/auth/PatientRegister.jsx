import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { UserPlus, Loader2 } from 'lucide-react';
import { loginSuccess } from '../../store/authSlice.js';
import { registerPatient } from '../../services/authService.js';
import { getEmployeeHomeRoute } from '../../auth/constants.js';

const initialForm = { name: '', dob: '', email: '', phone: '', password: '', pin: '' };

export default function PatientRegister() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, sessionType, user } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const updateField = (field, value) => setFormData((c) => ({ ...c, [field]: value }));

  if (isAuthenticated) {
    if (sessionType === 'patient' && user?.role === 'patient') return <Navigate to="/patient/dashboard" replace />;
    return <Navigate to={getEmployeeHomeRoute(user?.role)} replace />;
  }

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.password && !formData.pin) { toast.error('Choose a password, a PIN, or both.'); return; }
    setIsLoading(true);
    try {
      const auth = await registerPatient(formData);
      dispatch(loginSuccess(auth));
      localStorage.setItem('mediflow_auth', JSON.stringify(auth));
      toast.success('Account created successfully.');
      navigate('/patient', { replace: true });
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed.'); }
    finally { setIsLoading(false); }
  };

  return (
    <section className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-12 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-xl">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-xl shadow-primary/5">
          {/* Header */}
          <div className="mb-7 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Patient Registration</p>
              <h1 className="mt-1 text-2xl font-bold text-foreground">Create your account</h1>
              <p className="mt-1 text-sm text-muted-foreground">Access appointments, bills, prescriptions, lab reports, and more.</p>
            </div>
          </div>

          <div className="mb-6 rounded-xl bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
            Staff access is managed through the <Link to="/employee/login" className="font-medium text-primary hover:underline">employee portal</Link>.
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="register-name" label="Full Name" type="text" value={formData.name} onChange={(v) => updateField('name', v)} required />
              <Field id="register-dob" label="Date of Birth" type="date" value={formData.dob} onChange={(v) => updateField('dob', v)} required />
            </div>
            <Field id="register-email" label="Email" type="email" value={formData.email} onChange={(v) => updateField('email', v)} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="register-phone" label="Phone Number" type="tel" maxLength={10} pattern="[0-9]{10}" value={formData.phone} onChange={(v) => updateField('phone', v)} required />
              <Field id="register-pin" label="4-digit PIN" type="password" maxLength={4} pattern="[0-9]{4}" value={formData.pin} onChange={(v) => updateField('pin', v)} />
            </div>
            <Field id="register-password" label="Password" type="password" value={formData.password} onChange={(v) => updateField('password', v)} />

            <button
              type="submit" disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 border-t border-border pt-5 text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/patient/login" className="font-semibold text-primary hover:underline">Sign in</Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Field({ id, label, type, placeholder, maxLength, pattern, value, onChange, required }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <input
        id={id} type={type} value={value} placeholder={placeholder} maxLength={maxLength} pattern={pattern}
        onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
