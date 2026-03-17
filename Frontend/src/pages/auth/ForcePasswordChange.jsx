import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { KeyRound, Lock, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import { userApi } from '../../services/apiServices';
import { updateUser, logout } from '../../store/authSlice';

export default function ForcePasswordChange() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  // If not authenticated or doesn't need reset, redirect away
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (user && !user.mustResetPassword) {
    return <Navigate to={user.role === 'patient' ? '/patient/dashboard' : '/employee/dashboard'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters long.');
    }
    if (form.newPassword !== form.confirmPassword) {
      return toast.error('Passwords do not match.');
    }

    setIsLoading(true);
    try {
      const response = await userApi.changePassword({ 
        newPassword: form.newPassword 
      });
      
      // Update local state
      dispatch(updateUser({ 
        mustResetPassword: false, 
        onboardingStatus: response.data?.onboardingStatus || 'active' 
      }));
      
      toast.success('Password updated successfully! Welcome to the portal.');
      
      // Navigate to dashboard
      const homePath = user.role === 'patient' ? '/patient/dashboard' : '/employee/dashboard';
      navigate(homePath, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('mediflow_auth');
    navigate('/');
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Decorative background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-secondary/5 blur-[120px]" />
      </div>

      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="rounded-3xl border border-border bg-card p-8 shadow-2xl shadow-primary/5">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Secure Your Account</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This is your first time logging in with a temporary password. 
              Please set a permanent password to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                New Password
              </label>
              <input
                type="password"
                required
                placeholder="Min. 6 characters"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                Confirm New Password
              </label>
              <input
                type="password"
                required
                placeholder="Repeat new password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Complete Setup
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          </form>

          <button
            onClick={handleLogout}
            className="mt-6 w-full text-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Sign out and set later
          </button>
        </div>
        
        <p className="mt-8 text-center text-xs text-muted-foreground">
          &copy; 2026 Mediflow Hospital Management System. All rights reserved.
        </p>
      </motion.section>
    </main>
  );
}
