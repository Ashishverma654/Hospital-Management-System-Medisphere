import { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/authSlice';
import { registerUser } from '../../services/authService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Activity, UserPlus, Mail, Lock, User } from 'lucide-react';
import { toast } from 'sonner';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.password && !formData.pin) {
      toast.error('Please set either a Password or a 4-Digit PIN (or both) to secure your account.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { user, token } = await registerUser(formData);
      dispatch(loginSuccess({ user, token }));
      localStorage.setItem('mediflow_auth', JSON.stringify({ user, token }));
      toast.success(`Account created! Welcome, ${user.name}.`);
      
      navigate('/patient');
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      toast.error('Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/10 flex items-center justify-center p-4">
      {/* Decorative floating elements */}
      <motion.div 
        animate={{ y: [0, -20, 0], opacity: [0.5, 0.8, 0.5] }} 
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 0.5 }}
        className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10"
      />
      <motion.div 
        animate={{ y: [0, 20, 0], opacity: [0.5, 0.7, 0.5] }} 
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-secondary/20 rounded-full blur-3xl -z-10"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md my-8"
      >
        <Link to="/" className="flex items-center justify-center mb-6 gap-2 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
            <Activity className="h-6 w-6" />
          </div>
          <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            MediFlow
          </span>
        </Link>

        <Card className="backdrop-blur-xl bg-background/80 border-border/50 shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your details to join the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input 
                      id="name" 
                      placeholder="John Doe" 
                      className="pl-10 bg-background/50 focus:bg-background transition-colors"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <div className="relative">
                    <Input 
                      id="dob" 
                      type="date"
                      className="bg-background/50 focus:bg-background transition-colors"
                      value={formData.dob}
                      onChange={(e) => setFormData({...formData, dob: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

               <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@example.com" 
                    className="pl-10 bg-background/50 focus:bg-background transition-colors"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Input 
                      id="phone" 
                      type="tel"
                      placeholder="Enter 10 digit number"
                      className="bg-background/50 focus:bg-background transition-colors"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      required
                      maxLength={10}
                      pattern="[0-9]{10}"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pin">Set 4-Digit PIN (Optional)</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input 
                      id="pin" 
                      type="password"
                      placeholder="••••"
                      className="pl-10 bg-background/50 focus:bg-background transition-colors"
                      value={formData.pin}
                      onChange={(e) => setFormData({...formData, pin: e.target.value})}
                      maxLength={4}
                      pattern="[0-9]{4}"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password (Optional)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 bg-background/50 focus:bg-background transition-colors"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-right">
                Staff accounts (admin/doctor/receptionist) are created by the Super Admin.
              </p>

              <Button type="submit" className="w-full h-11 text-md shadow-lg shadow-primary/20" disabled={isLoading}>
                {isLoading ? (
                   <span className="animate-spin mr-2 border-b-2 border-white w-5 h-5 rounded-full"></span> 
                ) : (
                  <UserPlus className="w-5 h-5 mr-2" />
                )}
                {isLoading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/40 pt-6">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
