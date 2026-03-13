import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Mail, KeyRound, CheckCircle, Loader2, Shield } from 'lucide-react';
import api from '../../lib/api';

const STEPS = ['email', 'otp', 'reset', 'success'];

export default function EmployeeForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) return setError('Email is required.');
    setIsLoading(true);
    try {
      await api.post('/auth/password/forgot', { email });
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndReset = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp) return setError('OTP is required.');
    if (step === 'otp') {
      setStep('reset');
      return;
    }
    if (!newPassword || !confirmPassword) return setError('Both fields are required.');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters.');
    if (newPassword !== confirmPassword) return setError('Passwords do not match.');
    
    setIsLoading(true);
    try {
      await api.post('/auth/password/reset', { email, otp, newPassword });
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1e293b] to-[#334155] px-6 py-5 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-6 w-6 text-blue-300" />
            <h2 className="text-lg font-bold">Employee Password Reset</h2>
          </div>
          <p className="text-gray-300 text-sm">Reset your employee account password securely</p>
        </div>

        {/* Progress */}
        <div className="px-6 pt-5">
          <div className="flex items-center gap-2 mb-6">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  STEPS.indexOf(step) >= i ? 'bg-[#1e293b] text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 ${STEPS.indexOf(step) > i ? 'bg-[#1e293b]' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="px-6 pb-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg font-medium">
              {error}
            </div>
          )}

          {/* Step 1: Enter Email */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Registered Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your-email@hospital.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1e293b]/30 text-gray-700"
                    autoFocus
                  />
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full bg-[#1e293b] hover:bg-[#0f172a] text-white py-3 rounded-xl font-bold">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send OTP'}
              </Button>
            </form>
          )}

          {/* Step 2: Enter OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyAndReset} className="space-y-4">
              <p className="text-sm text-gray-600 mb-2">An OTP has been sent to <strong>{email}</strong>. Check your email (or backend console in dev mode).</p>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1e293b]/30 text-gray-700 text-center tracking-[0.5em] text-lg font-bold"
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full bg-[#1e293b] hover:bg-[#0f172a] text-white py-3 rounded-xl font-bold">
                Verify OTP
              </Button>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === 'reset' && (
            <form onSubmit={handleVerifyAndReset} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1e293b]/30 text-gray-700"
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1e293b]/30 text-gray-700"
                  />
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full bg-[#1e293b] hover:bg-[#0f172a] text-white py-3 rounded-xl font-bold">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Reset Password'}
              </Button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="text-center py-6 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h3 className="text-xl font-bold text-gray-800">Password Reset Successful!</h3>
              <p className="text-gray-500 text-sm">You can now login with your new password.</p>
              <Button onClick={() => navigate('/employee/login')} className="w-full bg-[#1e293b] hover:bg-[#0f172a] text-white py-3 rounded-xl font-bold">
                Go to Login
              </Button>
            </div>
          )}

          {step !== 'success' && (
            <button
              onClick={() => navigate('/employee/login')}
              className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
