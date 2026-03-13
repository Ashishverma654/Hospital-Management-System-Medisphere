import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
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
import logoImg from '../../assets/logo.png';
import { getEmployeeHomeRoute } from '../../auth/constants.js';

const initialResetState = {
  phone: '',
  pin: '',
  email: '',
  password: '',
  otp: '',
  firstName: '',
  lastName: '',
  dob: '',
  foundAccountEmail: '',
  obfuscatedEmail: '',
  newPassword: '',
  newPin: '',
};

export default function PatientLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, sessionType, user } = useSelector((state) => state.auth);
  const [view, setView] = useState('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState(initialResetState);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  if (isAuthenticated) {
    if (sessionType === 'patient' && user?.role === 'patient') {
      return <Navigate to="/patient/dashboard" replace />;
    }

    return <Navigate to={getEmployeeHomeRoute(user?.role)} replace />;
  }

  const completeLogin = ({ user, token, sessionType }) => {
    dispatch(loginSuccess({ user, token, sessionType }));
    localStorage.setItem('mediflow_auth', JSON.stringify({ user, token, sessionType }));
    toast.success(`Welcome back, ${user.name}!`);
    const fallback = location.state?.from?.pathname?.startsWith('/patient')
      ? location.state.from.pathname
      : '/patient';
    navigate(fallback, { replace: true });
  };

  const handlePhoneLogin = async (event) => {
    event.preventDefault();
    if (!form.phone || !form.pin) {
      toast.error('Phone and PIN are required.');
      return;
    }

    setIsLoading(true);
    try {
      const auth = await loginWithPhonePin(form.phone, form.pin);
      completeLogin(auth);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async (event) => {
    event.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Email or Patient ID and password are required.');
      return;
    }

    setIsLoading(true);
    try {
      const auth = await loginPatient(form.email, form.password);
      completeLogin(auth);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendLoginOtp = async () => {
    if (!form.email) {
      toast.error('Enter your email or patient ID first.');
      return;
    }

    setIsLoading(true);
    try {
      await sendLoginOtp(form.email);
      toast.success('OTP sent to your registered email.');
      setView('otp');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Unable to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpLogin = async (event) => {
    event.preventDefault();
    if (!form.email || !form.otp) {
      toast.error('Email and OTP are required.');
      return;
    }

    setIsLoading(true);
    try {
      const auth = await loginWithOtp(form.email, form.otp);
      completeLogin(auth);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'OTP login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindAccount = async (event) => {
    event.preventDefault();
    if (!form.firstName || !form.lastName || !form.dob) {
      toast.error('All recovery fields are required.');
      return;
    }

    setIsLoading(true);
    try {
      const account = await findAccountForHelp(form.firstName, form.lastName, form.dob);
      updateField('foundAccountEmail', account.email);
      updateField('obfuscatedEmail', account.obfuscatedEmail);
      await forgotPassword(account.email);
      toast.success(`Recovery OTP sent to ${account.obfuscatedEmail}.`);
      setView('reset');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Unable to find that account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetCredentials = async (event) => {
    event.preventDefault();
    if (!form.foundAccountEmail || !form.otp || (!form.newPassword && !form.newPin)) {
      toast.error('OTP and a new password or PIN are required.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(form.foundAccountEmail, form.otp, form.newPassword, form.newPin);
      toast.success('Credentials updated. Please sign in.');
      setForm(initialResetState);
      setView('phone');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Unable to reset credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 flex items-center gap-3">
          <img src={logoImg} alt="MediFlow" className="h-12 w-auto" />
          <div>
            <p className="text-sm text-slate-500">Patient access</p>
            <h1 className="text-2xl font-semibold text-slate-900">Sign in to your portal</h1>
          </div>
        </div>
        <div className="mb-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          This sign-in is for patients only. Hospital employees should use the separate employee system.
        </div>

        {view === 'phone' && (
          <form onSubmit={handlePhoneLogin} className="space-y-4">
            <FieldLabel htmlFor="patient-phone">Mobile Number</FieldLabel>
            <input
              id="patient-phone"
              type="tel"
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              placeholder="Enter 10 digit phone number"
              maxLength={10}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#ee4c35]"
            />

            <FieldLabel htmlFor="patient-pin">4-digit PIN</FieldLabel>
            <input
              id="patient-pin"
              type="password"
              value={form.pin}
              onChange={(event) => updateField('pin', event.target.value)}
              placeholder="Enter PIN"
              maxLength={4}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#ee4c35]"
            />

            <PrimaryButton disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Login with PIN'}
            </PrimaryButton>
          </form>
        )}

        {view === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <FieldLabel htmlFor="patient-email">Email or Patient ID</FieldLabel>
            <input
              id="patient-email"
              type="text"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="name@example.com or PAT-123456"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#ee4c35]"
            />

            <FieldLabel htmlFor="patient-password">Password</FieldLabel>
            <input
              id="patient-password"
              type="password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              placeholder="Enter password"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#ee4c35]"
            />

            <PrimaryButton disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Login with Password'}
            </PrimaryButton>

            <button
              type="button"
              onClick={handleSendLoginOtp}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Send OTP Instead
            </button>
          </form>
        )}

        {view === 'otp' && (
          <form onSubmit={handleOtpLogin} className="space-y-4">
            <FieldLabel htmlFor="patient-otp">6-digit OTP</FieldLabel>
            <input
              id="patient-otp"
              type="text"
              value={form.otp}
              onChange={(event) => updateField('otp', event.target.value)}
              placeholder="Enter OTP"
              maxLength={6}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#ee4c35]"
            />

            <PrimaryButton disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify and Login'}
            </PrimaryButton>
          </form>
        )}

        {view === 'help' && (
          <form onSubmit={handleFindAccount} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor="patient-first-name">First Name</FieldLabel>
                <input
                  id="patient-first-name"
                  type="text"
                  value={form.firstName}
                  onChange={(event) => updateField('firstName', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#ee4c35]"
                />
              </div>
              <div>
                <FieldLabel htmlFor="patient-last-name">Last Name</FieldLabel>
                <input
                  id="patient-last-name"
                  type="text"
                  value={form.lastName}
                  onChange={(event) => updateField('lastName', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#ee4c35]"
                />
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="patient-dob">Date of Birth</FieldLabel>
              <input
                id="patient-dob"
                type="date"
                value={form.dob}
                onChange={(event) => updateField('dob', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#ee4c35]"
              />
            </div>

            <PrimaryButton disabled={isLoading}>
              {isLoading ? 'Checking...' : 'Find My Account'}
            </PrimaryButton>
          </form>
        )}

        {view === 'reset' && (
          <form onSubmit={handleResetCredentials} className="space-y-4">
            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Recovery code sent to {form.obfuscatedEmail || 'your registered email'}.
            </p>

            <div>
              <FieldLabel htmlFor="patient-reset-otp">OTP</FieldLabel>
              <input
                id="patient-reset-otp"
                type="text"
                value={form.otp}
                onChange={(event) => updateField('otp', event.target.value)}
                maxLength={6}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#ee4c35]"
              />
            </div>

            <div>
              <FieldLabel htmlFor="patient-new-password">New Password</FieldLabel>
              <input
                id="patient-new-password"
                type="password"
                value={form.newPassword}
                onChange={(event) => updateField('newPassword', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#ee4c35]"
              />
            </div>

            <div>
              <FieldLabel htmlFor="patient-new-pin">New PIN</FieldLabel>
              <input
                id="patient-new-pin"
                type="password"
                value={form.newPin}
                onChange={(event) => updateField('newPin', event.target.value)}
                maxLength={4}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#ee4c35]"
              />
            </div>

            <PrimaryButton disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Reset Credentials'}
            </PrimaryButton>
          </form>
        )}

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          {view !== 'phone' && (
            <button type="button" onClick={() => setView('phone')} className="text-[#ee4c35] hover:underline">
              Login with PIN
            </button>
          )}
          {view !== 'password' && (
            <button type="button" onClick={() => setView('password')} className="text-[#ee4c35] hover:underline">
              Login with Password
            </button>
          )}
          {view !== 'help' && view !== 'reset' && (
            <button type="button" onClick={() => setView('help')} className="text-[#ee4c35] hover:underline">
              Need help?
            </button>
          )}
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6 text-sm text-slate-600">
          New patient?{' '}
          <Link to="/patient/register" className="font-semibold text-[#ee4c35] hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </section>
  );
}

function FieldLabel({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-slate-700">
      {children}
    </label>
  );
}

function PrimaryButton({ children, disabled }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full rounded-2xl bg-[#ee4c35] px-4 py-3 font-semibold text-white transition hover:bg-[#d6442e] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {children}
    </button>
  );
}
