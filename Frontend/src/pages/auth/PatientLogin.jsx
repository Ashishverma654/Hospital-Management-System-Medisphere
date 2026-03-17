import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { Heart, Phone, Mail, KeyRound, HelpCircle, ArrowLeft, Loader2 } from 'lucide-react';
import {
  findAccountForHelp,
  forgotPassword,
  loginPatient,
  loginWithOtp,
  loginWithPhonePin,
  resetPassword,
  sendLoginOtp,
} from '../../services/authService.js';
import { loginSuccess } from '../../store/authSlice.js';
import { getEmployeeHomeRoute } from '../../auth/constants.js';

const initialResetState = {
  phone: '', pin: '', email: '', password: '', otp: '',
  firstName: '', lastName: '', dob: '',
  foundAccountEmail: '', obfuscatedEmail: '', newPassword: '', newPin: '',
};

const viewMeta = {
  phone: { icon: Phone, title: 'Sign in with PIN', subtitle: 'Enter your registered mobile number and 4-digit PIN.' },
  password: { icon: Mail, title: 'Sign in with Password', subtitle: 'Use your email or patient ID and password.' },
  otp: { icon: KeyRound, title: 'Verify OTP', subtitle: 'Enter the 6-digit code sent to your email.' },
  help: { icon: HelpCircle, title: 'Find My Account', subtitle: 'We\'ll look up your account using your personal details.' },
  reset: { icon: KeyRound, title: 'Reset Credentials', subtitle: 'Set a new password or PIN using the recovery code.' },
};

export default function PatientLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, sessionType, user } = useSelector((state) => state.auth);
  const [view, setView] = useState('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState(initialResetState);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [cooldownNow, setCooldownNow] = useState(Date.now());

  const updateField = (field, value) => {
    const digitOnlyFields = ['phone', 'pin', 'otp', 'newPin'];
    const cleanedValue = digitOnlyFields.includes(field) ? value.replace(/\D/g, '') : value;
    setForm((c) => ({ ...c, [field]: cleanedValue }));
  };

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

  if (isAuthenticated) {
    if (user?.mustResetPassword) return <Navigate to="/force-password-change" replace />;
    if (sessionType === 'patient' && user?.role === 'patient') return <Navigate to="/patient/dashboard" replace />;
    return <Navigate to={getEmployeeHomeRoute(user?.role)} replace />;
  }

  const completeLogin = ({ user, token, sessionType }) => {
    dispatch(loginSuccess({ user, token, sessionType }));
    localStorage.setItem('mediflow_auth', JSON.stringify({ user, token, sessionType }));
    toast.success(`Welcome back, ${user.name}!`);

    if (user.mustResetPassword) {
      navigate('/force-password-change', { replace: true });
      return;
    }

    const fallback = location.state?.from?.pathname?.startsWith('/patient') ? location.state.from.pathname : '/patient';
    navigate(fallback, { replace: true });
  };

  const handlePhoneLogin = async (e) => {
    e.preventDefault();
    if (cooldownSeconds > 0) { toast.error(`Please wait ${cooldownSeconds}s before retrying.`); return; }
    if (!/^\d{10}$/.test(form.phone)) { toast.error('Enter a valid 10-digit phone number.'); return; }
    if (!/^\d{4}$/.test(form.pin)) { toast.error('Enter a valid 4-digit PIN.'); return; }
    setIsLoading(true);
    try { completeLogin(await loginWithPhonePin(form.phone, form.pin)); }
    catch (err) {
      startCooldown(err);
      if (err?.response?.status !== 429) {
        toast.error(err.response?.data?.message || 'Login failed.');
      }
    }
    finally { setIsLoading(false); }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (cooldownSeconds > 0) { toast.error(`Please wait ${cooldownSeconds}s before retrying.`); return; }
    if (!form.email || !form.password) { toast.error('Email and password are required.'); return; }
    setIsLoading(true);
    try { completeLogin(await loginPatient(form.email, form.password)); }
    catch (err) {
      startCooldown(err);
      if (err?.response?.status !== 429) {
        toast.error(err.response?.data?.message || 'Login failed.');
      }
    }
    finally { setIsLoading(false); }
  };

  const handleSendLoginOtp = async () => {
    if (cooldownSeconds > 0) { toast.error(`Please wait ${cooldownSeconds}s before retrying.`); return; }
    if (!form.email) { toast.error('Enter your email first.'); return; }
    setIsLoading(true);
    try { await sendLoginOtp(form.email); toast.success('OTP sent.'); setView('otp'); }
    catch (err) {
      startCooldown(err);
      if (err?.response?.status !== 429) {
        toast.error(err.response?.data?.message || 'Unable to send OTP.');
      }
    }
    finally { setIsLoading(false); }
  };

  const handleOtpLogin = async (e) => {
    e.preventDefault();
    if (cooldownSeconds > 0) { toast.error(`Please wait ${cooldownSeconds}s before retrying.`); return; }
    if (!form.email || !form.otp) { toast.error('Email and OTP are required.'); return; }
    setIsLoading(true);
    try { completeLogin(await loginWithOtp(form.email, form.otp)); }
    catch (err) {
      startCooldown(err);
      if (err?.response?.status !== 429) {
        toast.error(err.response?.data?.message || 'OTP login failed.');
      }
    }
    finally { setIsLoading(false); }
  };

  const handleFindAccount = async (e) => {
    e.preventDefault();
    if (cooldownSeconds > 0) { toast.error(`Please wait ${cooldownSeconds}s before retrying.`); return; }
    if (!form.firstName || !form.lastName || !form.dob) { toast.error('All fields are required.'); return; }
    setIsLoading(true);
    try {
      const account = await findAccountForHelp(form.firstName, form.lastName, form.dob);
      updateField('foundAccountEmail', account.email);
      updateField('obfuscatedEmail', account.obfuscatedEmail);
      await forgotPassword(account.email);
      toast.success(`Recovery code sent to ${account.obfuscatedEmail}.`);
      setView('reset');
    } catch (err) {
      startCooldown(err);
      if (err?.response?.status !== 429) {
        toast.error(err.response?.data?.message || 'Account not found.');
      }
    }
    finally { setIsLoading(false); }
  };

  const handleResetCredentials = async (e) => {
    e.preventDefault();
    if (cooldownSeconds > 0) { toast.error(`Please wait ${cooldownSeconds}s before retrying.`); return; }
    if (!form.foundAccountEmail || !form.otp || (!form.newPassword && !form.newPin)) {
      toast.error('OTP and a new password or PIN are required.'); return;
    }
    setIsLoading(true);
    try {
      await resetPassword(form.foundAccountEmail, form.otp, form.newPassword, form.newPin);
      toast.success('Credentials updated. Please sign in.');
      setForm(initialResetState); setView('phone');
    } catch (err) {
      startCooldown(err);
      if (err?.response?.status !== 429) {
        toast.error(err.response?.data?.message || 'Reset failed.');
      }
    }
    finally { setIsLoading(false); }
  };

  const meta = viewMeta[view];
  const ViewIcon = meta.icon;

  return (
    <section className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-12 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="rounded-3xl border border-border bg-card p-8 shadow-xl shadow-primary/5">
          {/* Header */}
          <div className="mb-7 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <ViewIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Patient Portal</p>
              <h1 className="mt-1 text-2xl font-bold text-foreground">{meta.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{meta.subtitle}</p>
            </div>
          </div>

          <div className="mb-6 rounded-xl bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
            This sign-in is for patients. Hospital staff should use the{' '}
            <Link to="/employee/login" className="font-medium text-primary hover:underline">employee portal</Link>.
          </div>

          {/* Forms */}
          <AnimatePresence mode="wait">
            <motion.div key={view} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
              {view === 'phone' && (
                <form onSubmit={handlePhoneLogin} className="space-y-4">
                  <Field id="patient-phone" label="Mobile Number" type="tel" placeholder="10-digit phone number" maxLength={10} value={form.phone} onChange={(v) => updateField('phone', v)} />
                  <Field id="patient-pin" label="4-digit PIN" type="password" placeholder="Enter PIN" maxLength={4} value={form.pin} onChange={(v) => updateField('pin', v)} />
                  <SubmitButton loading={isLoading} disabled={cooldownSeconds > 0}>
                    {cooldownSeconds > 0 ? `Try again in ${cooldownSeconds}s` : 'Login with PIN'}
                  </SubmitButton>
                </form>
              )}

              {view === 'password' && (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <Field id="patient-email" label="Email or Patient ID" type="text" placeholder="name@example.com or PAT-123456" value={form.email} onChange={(v) => updateField('email', v)} />
                  <Field id="patient-password" label="Password" type="password" placeholder="Enter password" value={form.password} onChange={(v) => updateField('password', v)} />
                  <SubmitButton loading={isLoading} disabled={cooldownSeconds > 0}>
                    {cooldownSeconds > 0 ? `Try again in ${cooldownSeconds}s` : 'Login with Password'}
                  </SubmitButton>
                  <button type="button" onClick={handleSendLoginOtp} className="w-full rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                    Send OTP Instead
                  </button>
                </form>
              )}

              {view === 'otp' && (
                <form onSubmit={handleOtpLogin} className="space-y-4">
                  <Field id="patient-otp" label="6-digit OTP" type="text" placeholder="Enter OTP" maxLength={6} value={form.otp} onChange={(v) => updateField('otp', v)} />
                  <SubmitButton loading={isLoading} disabled={cooldownSeconds > 0}>
                    {cooldownSeconds > 0 ? `Try again in ${cooldownSeconds}s` : 'Verify and Login'}
                  </SubmitButton>
                </form>
              )}

              {view === 'help' && (
                <form onSubmit={handleFindAccount} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field id="patient-first-name" label="First Name" type="text" value={form.firstName} onChange={(v) => updateField('firstName', v)} />
                    <Field id="patient-last-name" label="Last Name" type="text" value={form.lastName} onChange={(v) => updateField('lastName', v)} />
                  </div>
                  <Field id="patient-dob" label="Date of Birth" type="date" value={form.dob} onChange={(v) => updateField('dob', v)} />
                  <SubmitButton loading={isLoading} disabled={cooldownSeconds > 0}>
                    {cooldownSeconds > 0 ? `Try again in ${cooldownSeconds}s` : 'Find My Account'}
                  </SubmitButton>
                </form>
              )}

              {view === 'reset' && (
                <form onSubmit={handleResetCredentials} className="space-y-4">
                  <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                    Recovery code sent to {form.obfuscatedEmail || 'your email'}.
                  </div>
                  <Field id="reset-otp" label="OTP" type="text" maxLength={6} value={form.otp} onChange={(v) => updateField('otp', v)} />
                  <Field id="reset-password" label="New Password" type="password" value={form.newPassword} onChange={(v) => updateField('newPassword', v)} />
                  <Field id="reset-pin" label="New PIN" type="password" maxLength={4} value={form.newPin} onChange={(v) => updateField('newPin', v)} />
                  <SubmitButton loading={isLoading} disabled={cooldownSeconds > 0}>
                    {cooldownSeconds > 0 ? `Try again in ${cooldownSeconds}s` : 'Reset Credentials'}
                  </SubmitButton>
                </form>
              )}
            </motion.div>
          </AnimatePresence>

          {/* View switchers */}
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            {view !== 'phone' && (
              <button type="button" onClick={() => setView('phone')} className="flex items-center gap-1 text-primary hover:underline">
                <ArrowLeft className="h-3 w-3" /> PIN Login
              </button>
            )}
            {view !== 'password' && view !== 'otp' && view !== 'help' && view !== 'reset' && (
              <button type="button" onClick={() => setView('password')} className="text-primary hover:underline">Password Login</button>
            )}
            {view !== 'help' && view !== 'reset' && (
              <button type="button" onClick={() => setView('help')} className="text-muted-foreground hover:text-foreground">Need help?</button>
            )}
          </div>

          {/* Register link */}
          <div className="mt-6 border-t border-border pt-5 text-sm text-muted-foreground">
            New patient?{' '}
            <Link to="/patient/register" className="font-semibold text-primary hover:underline">Create an account</Link>
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

function SubmitButton({ children, loading, disabled }) {
  return (
    <button
      type="submit" disabled={loading || disabled}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {loading ? 'Please wait...' : children}
    </button>
  );
}
