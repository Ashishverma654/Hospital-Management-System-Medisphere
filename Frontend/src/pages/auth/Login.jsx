import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/authSlice';
import { 
  loginUser, 
  loginWithPhonePin, 
  sendLoginOtp, 
  loginWithOtp,
  findAccountForHelp,
  forgotPassword,
  resetPassword
} from '../../services/authService';
import { Button } from '../../components/ui/button';
import { X, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import logoImg from '../../assets/logo.png';

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // View states: 'phone', 'email', 'otp', 'help', 'forgot', 'reset'
  const [view, setView] = useState('phone');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form data
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState(''); // can be email or patient ID
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  // Help flow data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [foundAccountEmail, setFoundAccountEmail] = useState('');
  const [obfuscatedEmail, setObfuscatedEmail] = useState('');

  // Reset flow data
  const [newPassword, setNewPassword] = useState('');
  const [newPin, setNewPin] = useState('');

  const handleSuccess = (user, token) => {
    dispatch(loginSuccess({ user, token }));
    localStorage.setItem('mediflow_auth', JSON.stringify({ user, token }));
    toast.success(`Welcome back, ${user.name}!`);
    const rolePaths = { 
      superadmin: '/superadmin',
      admin: '/admin', 
      doctor: '/doctor', 
      patient: '/patient', 
      superreceptionist: '/superreceptionist',
      receptionist: '/receptionist',
      nurse: '/nurse',
      pharmacist: '/pharmacist',
      labTechnician: '/labTechnician',
    };
    navigate(rolePaths[user.role] || '/');
  };

  const handlePhoneLogin = async (e) => {
    e.preventDefault();
    if (!phone || !pin) return toast.error("Phone and PIN required");
    setIsLoading(true);
    try {
      const { user, token } = await loginWithPhonePin(phone, pin);
      handleSuccess(user, token);
    } catch (error) {
      toast.error(error.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailPasswordLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Email/Patient ID and password required");
    setIsLoading(true);
    try {
      const { user, token } = await loginUser(email, password);
      handleSuccess(user, token);
    } catch (error) {
      toast.error(error.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendLoginOtp = async () => {
    if (!email) return toast.error("Please enter Email or Patient ID first.");
    setIsLoading(true);
    try {
      await sendLoginOtp(email);
      toast.success("OTP sent to your registered email!");
      setView('otp');
    } catch (error) {
      toast.error(error.message || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginOtpVerify = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error("Please enter the OTP");
    setIsLoading(true);
    try {
      const { user, token } = await loginWithOtp(email, otp);
      handleSuccess(user, token);
    } catch (error) {
      toast.error(error.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindAccount = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !dob) return toast.error("All fields required");
    setIsLoading(true);
    try {
      const res = await findAccountForHelp(firstName, lastName, dob);
      setFoundAccountEmail(res.email);
      setObfuscatedEmail(res.obfuscatedEmail);
      toast.success(`Account found!`);
      // Automatically send forgot password OTP to the found email
      await forgotPassword(res.email);
      toast.info(`Recovery OTP sent to ${res.obfuscatedEmail}`);
      setView('reset');
    } catch (error) {
      toast.error(error.message || 'Account not found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendForgotPasswordOtp = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setFoundAccountEmail(email);
      toast.success("Recovery OTP sent!");
      setView('reset');
    } catch (error) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || (!newPassword && !newPin)) return toast.error("OTP and new password or PIN required");
    setIsLoading(true);
    try {
      await resetPassword(foundAccountEmail, otp, newPassword, newPin);
      toast.success("Credentials updated successfully. Please login.");
      // Reset state and go to default view
      setEmail(''); setPassword(''); setPhone(''); setPin(''); setOtp('');
      setView('phone');
    } catch (error) {
      toast.error(error.message || 'Failed to reset credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Container echoing Medanta modal */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[480px] overflow-hidden relative border border-gray-100">
        
        {/* Header Ribbon (Orange) */}
        <div className="h-[6px] w-full bg-[#ee4c35]"></div>
        
        <button onClick={() => navigate('/')} className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 transition-colors p-2 z-10">
          <X className="h-6 w-6" />
        </button>

        {(view !== 'phone' && view !== 'email' && view !== 'help') && (
           <button onClick={() => setView('phone')} className="absolute left-4 top-4 text-gray-400 hover:text-gray-700 transition-colors p-2 z-10">
             <ArrowLeft className="h-6 w-6" />
           </button>
        )}

        <div className="px-8 pt-10 pb-8">
          
          <div className="flex flex-col items-center mb-10 relative">
             <div className="flex items-center w-full justify-center mb-6">
                <div className="h-[1px] bg-gray-200 flex-grow"></div>
                <span className="px-4 text-gray-800 font-bold text-lg tracking-wide uppercase">Welcome To</span>
                <div className="h-[1px] bg-gray-200 flex-grow"></div>
             </div>
             
             <div className="flex items-center gap-3">
               <img src={logoImg} alt="logo" className="h-10 w-auto" />
               <span className="font-bold text-3xl text-gray-700 tracking-tight">MediFlow</span>
             </div>
          </div>

          <AnimatePresence mode="wait">
            {/* VIEW: PHONE LOGIN */}
            {view === 'phone' && (
              <motion.div key="phone" initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:20}}>
                <h2 className="text-xl font-bold text-center text-gray-800 mb-6">Login with Mobile Number</h2>
                <form onSubmit={handlePhoneLogin} className="space-y-4">
                  
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#ee4c35]/30 focus-within:border-[#ee4c35] transition-all bg-white">
                    <div className="bg-gray-50 px-4 py-3 text-gray-500 font-medium border-r border-gray-300 select-none">
                      +91
                    </div>
                    <input 
                      type="tel" 
                      placeholder="Enter 10 digit mobile number" 
                      className="w-full py-3 px-4 outline-none text-gray-700 placeholder:text-gray-400 bg-transparent"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      maxLength={10}
                      required
                    />
                  </div>

                  <div className="relative">
                     <input 
                        type="password" 
                        placeholder="Enter 4-digit PIN" 
                        className="w-full border border-gray-300 rounded-lg py-3 px-4 outline-none text-gray-700 placeholder:text-gray-400 focus:border-[#ee4c35] focus:ring-2 focus:ring-[#ee4c35]/30 transition-all text-center tracking-[0.5em] text-lg font-bold"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        maxLength={4}
                        required
                      />
                  </div>

                  <div className="mt-6">
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full bg-white text-gray-400 border border-gray-200 hover:bg-gray-50 hover:text-gray-600 font-bold h-12 text-lg rounded-lg shadow-sm"
                      style={phone.length === 10 && pin.length === 4 ? {backgroundColor: '#ee4c35', color: 'white', borderColor: '#ee4c35'} : {}}
                    >
                      {isLoading ? <Loader2 className="animate-spin w-5 h-5 mx-auto"/> : "Login by PIN"}
                    </Button>
                  </div>
                </form>

                <div className="mt-8 text-center space-y-4">
                  <button onClick={() => setView('email')} className="text-[#ee4c35] hover:underline font-semibold block w-full">
                    Login with Email or Patient ID
                  </button>
                  <div className="w-2/3 h-[1px] bg-gray-200 mx-auto my-6"></div>
                  <button onClick={() => setView('help')} className="text-[#ee4c35] hover:underline font-semibold block w-full">
                    Need Help Logging in?
                  </button>
                </div>
              </motion.div>
            )}

            {/* VIEW: EMAIL LOGIN */}
            {view === 'email' && (
              <motion.div key="email" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}}>
                <h2 className="text-xl font-bold text-center text-gray-800 mb-6">Login with Email / Patient ID</h2>
                <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
                  
                  <input 
                    type="text" 
                    placeholder="Enter Email or Patient ID" 
                    className="w-full border border-gray-300 rounded-lg py-3 px-4 outline-none text-gray-700 placeholder:text-gray-400 focus:border-[#ee4c35] focus:ring-2 focus:ring-[#ee4c35]/30 transition-all font-medium"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <div className="relative">
                    <input 
                      type="password" 
                      placeholder="Enter Password" 
                      className="w-full border border-gray-300 rounded-lg py-3 px-4 outline-none text-gray-700 placeholder:text-gray-400 focus:border-[#ee4c35] focus:ring-2 focus:ring-[#ee4c35]/30 transition-all font-medium"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <div className="mt-6">
                    <Button 
                      type="submit" 
                      disabled={isLoading || !email || !password}
                      className="w-full bg-[#ee4c35] hover:bg-[#d8442f] text-white font-bold h-12 text-lg rounded-lg shadow-md"
                    >
                      {isLoading && password ? <Loader2 className="animate-spin w-5 h-5 mx-auto"/> : "Login"}
                    </Button>
                  </div>
                </form>

                <div className="mt-8 text-center space-y-4">
                  <button onClick={() => setView('phone')} className="text-[#ee4c35] hover:underline font-semibold block w-full">
                    Login with Mobile Number
                  </button>
                  <div className="w-2/3 h-[1px] bg-gray-200 mx-auto my-6"></div>
                  <button onClick={() => setView('help')} className="text-[#ee4c35] hover:underline font-semibold block w-full">
                    Need Help Logging in?
                  </button>
                </div>
              </motion.div>
            )}

             {/* VIEW: LOGIN OTP VERIFICATION */}
            {view === 'otp' && (
              <motion.div key="otp" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}}>
                <h2 className="text-xl font-bold text-center text-gray-800 mb-2">Verify OTP</h2>
                <p className="text-center text-gray-500 mb-6 text-sm">We've sent a 6-digit code to your email.</p>
                <form onSubmit={handleLoginOtpVerify} className="space-y-6">
                  
                  <input 
                    type="text" 
                    placeholder="Enter 6-digit OTP" 
                    className="w-full border border-gray-300 rounded-lg py-4 px-4 outline-none text-gray-700 placeholder:text-gray-400 focus:border-[#ee4c35] focus:ring-2 focus:ring-[#ee4c35]/30 transition-all text-center tracking-[0.5em] text-2xl font-bold"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    required
                  />

                  <Button 
                    type="submit" 
                    disabled={isLoading || otp.length !== 6}
                    className="w-full bg-[#ee4c35] hover:bg-[#d8442f] text-white font-bold h-12 text-lg rounded-lg shadow-md"
                  >
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5 mx-auto"/> : "Verify & Login"}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* VIEW: NEED HELP */}
            {view === 'help' && (
              <motion.div key="help" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}}>
                <h2 className="text-xl font-bold text-center text-gray-800 mb-2">Find Your Account</h2>
                <p className="text-center text-gray-500 mb-6 text-sm text-balance">Enter your details exactly as they appear on your hospital records.</p>
                <form onSubmit={handleFindAccount} className="space-y-4">
                  
                  <div className="grid grid-cols-2 gap-3">
                     <input 
                        type="text" 
                        placeholder="First Name" 
                        className="w-full border border-gray-300 rounded-lg py-3 px-4 outline-none text-gray-700 focus:border-[#ee4c35] focus:ring-2 focus:ring-[#ee4c35]/30 transition-all"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                      <input 
                        type="text" 
                        placeholder="Last Name" 
                        className="w-full border border-gray-300 rounded-lg py-3 px-4 outline-none text-gray-700 focus:border-[#ee4c35] focus:ring-2 focus:ring-[#ee4c35]/30 transition-all"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                  </div>

                  <div>
                     <label className="block text-sm text-gray-500 mb-1 ml-1 font-medium">Date of Birth</label>
                     <input 
                        type="date" 
                        className="w-full border border-gray-300 rounded-lg py-3 px-4 outline-none text-gray-700 focus:border-[#ee4c35] focus:ring-2 focus:ring-[#ee4c35]/30 transition-all"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        required
                      />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold h-12 text-lg rounded-lg shadow-md mt-4"
                  >
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5 mx-auto"/> : "Find Account"}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <button onClick={() => setView('phone')} className="text-gray-500 hover:text-gray-800 text-sm font-medium">
                    Back to Login
                  </button>
                </div>
              </motion.div>
            )}

             {/* VIEW: FORGOT PW / PIN */}
             {view === 'forgot' && (
              <motion.div key="forgot" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}}>
                <h2 className="text-xl font-bold text-center text-gray-800 mb-2">Reset Credentials</h2>
                <p className="text-center text-gray-500 mb-6 text-sm">Enter the email associated with your account.</p>
                <form onSubmit={handleSendForgotPasswordOtp} className="space-y-4">
                   <input 
                    type="email" 
                    placeholder="Enter Email address" 
                    className="w-full border border-gray-300 rounded-lg py-3 px-4 outline-none text-gray-700 placeholder:text-gray-400 focus:border-[#ee4c35] focus:ring-2 focus:ring-[#ee4c35]/30 transition-all font-medium"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <Button 
                    type="submit" 
                    disabled={isLoading || !email}
                    className="w-full bg-[#ee4c35] hover:bg-[#d8442f] text-white font-bold h-12 text-lg rounded-lg shadow-md"
                  >
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5 mx-auto"/> : "Send Recovery OTP"}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* VIEW: RESET PW / PIN */}
            {view === 'reset' && (
              <motion.div key="reset" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="space-y-6">
                <div className="text-center">
                   <h2 className="text-xl font-bold text-gray-800 mb-1">Set New Credentials</h2>
                   <p className="text-gray-500 text-sm">Enter the 6-digit OTP sent to {obfuscatedEmail || "your email"}.</p>
                </div>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  
                  <input 
                    type="text" 
                    placeholder="Enter 6-digit OTP" 
                    className="w-full border border-gray-300 rounded-lg py-3 px-4 outline-none text-gray-700 placeholder:text-gray-400 focus:border-[#ee4c35] focus:ring-2 focus:ring-[#ee4c35]/30 transition-all font-bold tracking-widest text-center"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    required
                  />

                  <input 
                    type="password" 
                    placeholder="New Password (Optional)" 
                    className="w-full border border-gray-300 rounded-lg py-3 px-4 outline-none text-gray-700 focus:border-[#ee4c35] focus:ring-2 focus:ring-[#ee4c35]/30 transition-all"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />

                  <input 
                    type="password" 
                    placeholder="New 4-Digit PIN (Optional)" 
                    className="w-full border border-gray-300 rounded-lg py-3 px-4 outline-none text-gray-700 focus:border-[#ee4c35] focus:ring-2 focus:ring-[#ee4c35]/30 transition-all"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    maxLength={4}
                  />

                  <Button 
                    type="submit" 
                    disabled={isLoading || (!newPassword && !newPin)}
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold h-12 text-lg rounded-lg shadow-md mt-4"
                  >
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5 mx-auto"/> : "Reset & Continue"}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Login Section */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
              <span className="h-[1px] w-8 bg-gray-100"></span>
              Demo login
              <span className="h-[1px] w-8 bg-gray-100"></span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'SuperAdmin', email: 'superadmin@medanta.org', pass: 'SuperAdmin@123' },
                { label: 'Admin', email: 'admin@medanta.org', pass: 'Admin@123' },
                { label: 'Doctor', email: 'doctor@hospital.com', pass: 'Doctor@123' },
                { label: 'SuperRec', email: 'super.receptionist@hospital.com', pass: 'SuperRecPassword123!' },
                { label: 'Receptionist', email: 'receptionist@medanta.org', pass: 'Receptionist@123' },
                { label: 'Nurse', email: 'nurse@medanta.org', pass: 'Nurse@123' },
                { label: 'Pharmacist', email: 'pharmacist@medanta.org', pass: 'Pharmacist@123' },
                { label: 'LabTech', email: 'labtech@medanta.org', pass: 'LabTech@123' },
                { label: 'Patient', email: 'tester_pass_1@example.com', pass: 'password123' },
              ].map((demo) => (
                <button
                  key={demo.label}
                  type="button"
                  onClick={() => {
                    setEmail(demo.email);
                    setPassword(demo.pass);
                    setView('email');
                    // We don't auto-submit to allow user to see the creds
                    toast.info(`Pre-filled ${demo.label} credentials. Please click Login.`);
                  }}
                  className="px-2 py-2 text-[10px] font-bold border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#ee4c35] hover:text-[#ee4c35] transition-all text-gray-500 bg-white shadow-sm truncate"
                >
                  {demo.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
