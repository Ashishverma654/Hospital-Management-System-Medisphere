import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { Shield, Mail, KeyRound, Lock, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { forgotPassword, resetPassword, verifyResetOtp } from '../../services/authService.js';
import { Button } from '../../components/ui/button';

export default function EmployeeForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(formData.email);
      toast.success('OTP sent to your email.');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (formData.otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP.');
      return;
    }
    
    setLoading(true);
    try {
      await verifyResetOtp(formData.email, formData.otp);
      toast.success('Code verified. Set your new password.');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(formData.email, formData.otp, formData.newPassword);
      toast.success('Password reset successfully.');
      setStep(4);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[oklch(0.10_0.02_260)] px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-secondary/5 blur-3xl animate-float delay-300" />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-7 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-white">Reset Password</h1>
            <p className="mt-2 text-sm text-white/60">
              {step === 1 && "Enter your email to receive a reset code."}
              {step === 2 && "Enter the 6-digit code sent to your email."}
              {step === 3 && "Create a secure new password for your account."}
              {step === 4 && "Your password has been updated."}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSendOtp}
                className="space-y-5"
              >
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/80">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@hospital.com"
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                  Send Reset Link
                </Button>
                <button type="button" onClick={() => navigate('/employee/login')} className="flex w-full items-center justify-center text-xs text-white/40 hover:text-white/70 transition-colors">
                  <ArrowLeft className="mr-1 h-3 w-3" /> Back to Login
                </button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOtp}
                className="space-y-5"
              >
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/80">Verification Code</label>
                  <div className="relative">
                    <KeyRound className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      maxLength={6}
                      value={formData.otp}
                      onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                      placeholder="123456"
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/30 tracking-[0.5em] font-mono focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Verify Code
                </Button>
                <button type="button" onClick={() => setStep(1)} className="flex w-full items-center justify-center text-xs text-white/40 hover:text-white/70 transition-colors">
                  <ArrowLeft className="mr-1 h-3 w-3" /> Use different email
                </button>
              </motion.form>
            )}

            {step === 3 && (
              <motion.form
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleResetPassword}
                className="space-y-5"
              >
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/80">New Password</label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/80">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Set New Password
                </Button>
              </motion.form>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-white">All Set!</h3>
                <p className="mt-2 text-sm text-white/50">Your password has been changed successfully.</p>
                <Button onClick={() => navigate('/employee/login')} className="mt-8 w-full">
                  Go to Login
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>
    </main>
  );
}
