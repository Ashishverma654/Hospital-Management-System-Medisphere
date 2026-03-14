import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Shield, Loader2, User, Stethoscope, Heart, FlaskConical, Pill, ClipboardList, Settings, Building2 } from 'lucide-react';
import { EMPLOYEE_ROLE_OPTIONS, getEmployeeHomeRoute } from '../../auth/constants.js';
import { loginEmployee } from '../../services/authService.js';
import { loginSuccess } from '../../store/authSlice.js';

const roleIcons = {
  superadmin: Shield,
  admin: Settings,
  subadmin: Building2,
  doctor: Stethoscope,
  nurse: Heart,
  receptionist: ClipboardList,
  labTechnician: FlaskConical,
  pharmacist: Pill,
};

export default function EmployeeLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, sessionType, user } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({ identifier: '', password: '', role: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [cooldownNow, setCooldownNow] = useState(Date.now());

  if (isAuthenticated && sessionType === 'employee') {
    return <Navigate to={getEmployeeHomeRoute(user?.role)} replace />;
  }

  const updateField = (field, value) => setFormData((c) => ({ ...c, [field]: value }));

  useEffect(() => {
    if (!cooldownUntil) return;
    const timer = setInterval(() => setCooldownNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [cooldownUntil]);

  const cooldownSeconds = Math.max(0, Math.ceil((cooldownUntil - cooldownNow) / 1000));

  const startCooldown = (err) => {
    if (err?.response?.status !== 429) return;
    const retryHeader = err.response?.headers?.['retry-after'];
    const retrySeconds = retryHeader ? Number(retryHeader) : 30;
    const safeSeconds = Number.isFinite(retrySeconds) && retrySeconds > 0 ? retrySeconds : 30;
    setCooldownUntil(Date.now() + safeSeconds * 1000);
    toast.error(`Too many requests. Try again in ${safeSeconds}s.`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cooldownSeconds > 0) { toast.error(`Please wait ${cooldownSeconds}s before retrying.`); return; }
    if (!formData.role) { toast.error('Select your role.'); return; }
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
    } catch (err) {
      startCooldown(err);
      if (err?.response?.status !== 429) {
        toast.error(err.response?.data?.message || 'Invalid credentials.');
      }
    } finally { setIsLoading(false); }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[oklch(0.10_0.02_260)] px-4 py-12">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-secondary/5 blur-3xl animate-float delay-300" />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="mb-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Hospital System</p>
            <h1 className="mt-1 text-3xl font-bold text-white">Staff Sign In</h1>
            <p className="mt-2 text-sm text-white/60">
              Select your role and enter your credentials to access the employee portal.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selector as grid cards */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">Select Role</label>
              <div className="grid grid-cols-4 gap-2">
                {EMPLOYEE_ROLE_OPTIONS.map((role) => {
                  const Icon = roleIcons[role.value] || User;
                  const isSelected = formData.role === role.value;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => updateField('role', role.value)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center transition-all ${
                        isSelected
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-[1.02]'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[10px] font-medium leading-tight">{role.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="emp-id" className="mb-1.5 block text-sm font-medium text-white/80">Email or Employee ID</label>
              <input
                id="emp-id" type="text" value={formData.identifier}
                onChange={(e) => updateField('identifier', e.target.value)}
                placeholder="name@hospital.com or EMP-1001" required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label htmlFor="emp-pw" className="mb-1.5 block text-sm font-medium text-white/80">Password</label>
              <input
                id="emp-pw" type="password" value={formData.password}
                onChange={(e) => updateField('password', e.target.value)} required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              type="submit" disabled={isLoading || cooldownSeconds > 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? 'Signing in...' : cooldownSeconds > 0 ? `Try again in ${cooldownSeconds}s` : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-white/40">
            Patient or public visitor?{' '}
            <a href="/patient/login" className="font-medium text-primary hover:underline">Use the patient portal</a>
          </div>
        </div>
      </motion.section>
    </main>
  );
}
