import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/authService';
import logoImg from '../assets/images/logo.png';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiActivity, FiArrowRight } from 'react-icons/fi';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      login(data.user, data.accessToken, data.refreshToken);
      toast.success('Login successful!');
      const rolePaths = {
        admin: '/admin',
        doctor: '/doctor',
        patient: '/patient',
        receptionist: '/receptionist',
      };
      navigate(rolePaths[data.user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-shape auth-bg-shape--1"></div>
        <div className="auth-bg-shape auth-bg-shape--2"></div>
        <div className="auth-bg-shape auth-bg-shape--3"></div>
      </div>

      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-left-content">
            <div className="auth-logo">
              <img src={logoImg} alt="MediFlow Logo" style={{ height: '48px', width: 'auto' }} />
            </div>
            <h1>MediFlow HMS</h1>
            <p>Comprehensive Hospital Management System for seamless healthcare operations, patient care, and administrative excellence.</p>
            <div className="auth-features">
              <div className="auth-feature">
                <span className="auth-feature-dot"></span>
                Doctor & Department Management
              </div>
              <div className="auth-feature">
                <span className="auth-feature-dot"></span>
                Smart Appointment Scheduling
              </div>
              <div className="auth-feature">
                <span className="auth-feature-dot"></span>
                Digital Prescriptions & Reports
              </div>
              <div className="auth-feature">
                <span className="auth-feature-dot"></span>
                Real-time Analytics Dashboard
              </div>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-form-wrapper">
            <div className="auth-form-header">
              <h2>Welcome Back</h2>
              <p>Sign in to access your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-input-group">
                <FiMail className="auth-input-icon" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  id="login-email"
                />
              </div>

              <div className="auth-input-group">
                <FiLock className="auth-input-icon" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                  id="login-password"
                />
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
                id="login-submit"
              >
                {loading ? (
                  <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span>
                ) : (
                  <>
                    Sign In
                    <FiArrowRight />
                  </>
                )}
              </button>
            </form>

            <p className="auth-footer-text">
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
