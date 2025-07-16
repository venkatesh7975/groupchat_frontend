import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI, apiUtils } from '../api';
import './Auth.css';

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const Login = ({ onLogin, authStep, setAuthStep }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      console.log('🔐 Attempting login for:', formData.email);
      const response = await authAPI.login(formData);
      setEmail(formData.email);
      console.log('📧 OTP sent to email:', formData.email);
      setMessage(response.data.message);
      setAuthStep('otp');
    } catch (error) {
      console.error('❌ Login failed:', error.response?.data?.message);
      setMessage(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await authAPI.verifyOTP({
        email: email,
        otp: otp
      });
      
      console.log('Login response:', response.data);
      console.log('Cookies after login:', document.cookie);
      
      // Store token in localStorage as backup
      const token = response.data.token || getCookie('token');
      console.log('Token from response:', response.data.token ? 'present' : 'missing');
      console.log('Token from cookie:', getCookie('token') ? 'present' : 'missing');
      
      if (token) {
        apiUtils.setToken(token);
        console.log('Token stored in localStorage');
        console.log('Token verification - isAuthenticated:', apiUtils.isAuthenticated());
      } else {
        console.warn('No token received from server');
      }
      
      console.log('Login successful, user data:', response.data.user);
      onLogin(response.data.user);
      setMessage('Login successful!');
    } catch (error) {
      console.error('Login error:', error);
      setMessage(error.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await authAPI.login({
        email: email,
        password: formData.password
      });
      setMessage('OTP resent successfully!');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  if (authStep === 'otp') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Verify OTP</h2>
          <p className="auth-subtitle">
            We've sent a 6-digit code to {email}
          </p>
          
          {message && (
            <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleOtpVerification} className="auth-form">
            <div className="form-group">
              <label htmlFor="otp">Enter OTP</label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                maxLength="6"
                required
                className="form-input"
              />
            </div>

            <button 
              type="submit" 
              className="auth-btn primary"
              disabled={loading || !otp.trim()}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>

          <div className="auth-links">
            <button 
              onClick={handleResendOtp}
              disabled={loading}
              className="link-btn"
            >
              Resend OTP
            </button>
            <button 
              onClick={() => setAuthStep('login')}
              className="link-btn"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        <p className="auth-subtitle">Welcome back! Please sign in to your account.</p>
        
        {message && (
          <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              required
              className="form-input"
            />
          </div>

          <button 
            type="submit" 
            className="auth-btn primary"
            disabled={loading || !formData.email || !formData.password}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password" className="link-btn">
            Forgot Password?
          </Link>
          <p className="auth-switch">
            Don't have an account?{' '}
            <Link to="/register" className="link-btn">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 