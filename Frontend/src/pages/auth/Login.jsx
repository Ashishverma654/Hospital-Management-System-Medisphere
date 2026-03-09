import { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/authSlice';
import { loginUser } from '../../services/authService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Activity, LogIn, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { user, token } = await loginUser(email, password);
      dispatch(loginSuccess({ user, token }));
      localStorage.setItem('mediflow_auth', JSON.stringify({ user, token }));
      toast.success(`Welcome back, ${user.name}!`);
      
      // Route based on role
      const rolePaths = {
        admin: '/admin',
        doctor: '/doctor',
        patient: '/patient',
        receptionist: '/receptionist'
      };
      
      navigate(rolePaths[user.role] || '/');
    } catch (error) {
      toast.error(error.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDemoCredentials = (role) => {
    const creds = {
      superadmin: { email: 'admin@hospital.com', password: 'AdminPassword123!' },
      admin: { email: 'admin2@hospital.com', password: 'password123' },
      superreceptionist: { email: 'super.receptionist@hospital.com', password: 'SuperRecPassword123!' },
      receptionist: { email: 'receptionist@hospital.com', password: 'password123' },
      patient: { email: 'patient@hospital.com', password: 'password123' }
    };
    if (creds[role]) {
      setEmail(creds[role].email);
      setPassword(creds[role].password);
      toast.info(`Loaded ${role} credentials!`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/10 flex items-center justify-center p-4">
      {/* Decorative floating elements */}
      <motion.div 
        animate={{ y: [0, -20, 0], opacity: [0.5, 0.8, 0.5] }} 
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10"
      />
      <motion.div 
        animate={{ y: [0, 20, 0], opacity: [0.5, 0.7, 0.5] }} 
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-secondary/20 rounded-full blur-3xl -z-10"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="flex items-center justify-center mb-8 gap-2 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
            <Activity className="h-6 w-6" />
          </div>
          <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            MediFlow
          </span>
        </Link>

        <Card className="backdrop-blur-xl bg-background/80 border-border/50 shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
               <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="doctor@hospital.com" 
                    className="pl-10 bg-background/50 focus:bg-background transition-colors"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="#" className="text-sm font-medium text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 bg-background/50 focus:bg-background transition-colors"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-11 text-md mt-6 shadow-lg shadow-primary/20" disabled={isLoading}>
                {isLoading ? (
                   <span className="animate-spin mr-2 border-b-2 border-white w-5 h-5 rounded-full"></span> 
                ) : (
                  <LogIn className="w-5 h-5 mr-2" />
                )}
                {isLoading ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/40 pt-6">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </CardFooter>
        </Card>
        
        <div className="mt-6 flex flex-col items-center gap-2">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Quick Login</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => loadDemoCredentials('superadmin')} className="text-xs h-8 border-primary/30 hover:bg-primary/10">Super Admin</Button>
            <Button variant="outline" size="sm" onClick={() => loadDemoCredentials('admin')} className="text-xs h-8 border-primary/30 hover:bg-primary/10">Admin</Button>
            <Button variant="outline" size="sm" onClick={() => loadDemoCredentials('superreceptionist')} className="text-xs h-8 border-secondary/30 hover:bg-secondary/10">Super Receptionist</Button>
            <Button variant="outline" size="sm" onClick={() => loadDemoCredentials('receptionist')} className="text-xs h-8 border-secondary/30 hover:bg-secondary/10">Receptionist</Button>
            <Button variant="outline" size="sm" onClick={() => loadDemoCredentials('patient')} className="text-xs h-8 border-teal-500/30 hover:bg-teal-500/10 text-teal-700">Patient</Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
