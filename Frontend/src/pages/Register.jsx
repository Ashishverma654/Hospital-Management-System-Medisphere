import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/authService';
import toast from 'react-hot-toast';
import logoImg from '../assets/images/logo.png';
import { FiUser, FiMail, FiLock, FiActivity, FiArrowRight } from 'react-icons/fi';
import './Auth.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await registerUser(name, email, password);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
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
            <h1>Join MediFlow</h1>
            <p>Create your patient account to book appointments, view prescriptions, and access your medical records anytime.</p>
            <div className="auth-features">
              <div className="auth-feature">
                <span className="auth-feature-dot"></span>
                Instant Appointment Booking
              </div>
              <div className="auth-feature">
                <span className="auth-feature-dot"></span>
                Digital Health Records
              </div>
              <div className="auth-feature">
                <span className="auth-feature-dot"></span>
                Prescription History Access
              </div>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-form-wrapper">
            <div className="auth-form-header">
              <h2>Create Account</h2>
              <p>Register as a new patient</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-input-group">
                <FiUser className="auth-input-icon" />
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="auth-input"
                  id="register-name"
                />
              </div>

              <div className="auth-input-group">
                <FiMail className="auth-input-icon" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  id="register-email"
                />
              </div>

              <div className="auth-input-group">
                <FiLock className="auth-input-icon" />
                <input
                  type="password"
                  placeholder="Password (min. 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                  id="register-password"
                />
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
                id="register-submit"
              >
                {loading ? (
                  <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span>
                ) : (
                  <>
                    Create Account
                    <FiArrowRight />
                  </>
                )}
              </button>
            </form>

            <p className="auth-footer-text">
              Already have an account?{' '}
              <Link to="/login" className="auth-link">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
