import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI, apiUtils } from '../api';
import './Auth.css';

const Register = ({ onRegister, authStep, setAuthStep }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [passwordErrors, setPasswordErrors] = useState([]);

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push('Password must be at least 8 characters long');
    if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');
    if (!/\d/.test(password)) errors.push('Password must contain at least one number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Password must contain at least one special character');
    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (name === 'password') {
      const errors = validatePassword(value);
      setPasswordErrors(errors);
    }

    if (name === 'confirmPassword' && formData.password !== value) {
      setPasswordErrors(['Passwords do not match']);
    } else if (name === 'confirmPassword' && formData.password === value) {
      setPasswordErrors([]);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    const errors = validatePassword(formData.password);
    if (errors.length > 0) {
      setMessage('Please fix password requirements');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });
      
      setEmail(formData.email);
      setMessage(response.data.message);
      setAuthStep('otp');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Registration failed');
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
      
      // Store token if provided
      if (response.data.token) {
        apiUtils.setToken(response.data.token);
      }
      
      onRegister(response.data.user);
      setMessage('Registration successful!');
    } catch (error) {
      setMessage(error.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await authAPI.register({
        name: formData.name,
        email: email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
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
              onClick={() => setAuthStep('register')}
              className="link-btn"
            >
              Back to Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>
        <p className="auth-subtitle">Join us! Create your account to get started.</p>
        
        {message && (
          <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              required
              className="form-input"
            />
          </div>

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
            {passwordErrors.length > 0 && (
              <div className="password-errors">
                {passwordErrors.map((error, index) => (
                  <div key={index} className="error-item">• {error}</div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
              required
              className="form-input"
            />
          </div>

          <button 
            type="submit" 
            className="auth-btn primary"
            disabled={loading || !formData.name || !formData.email || !formData.password || !formData.confirmPassword || passwordErrors.length > 0}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-links">
          <p className="auth-switch">
            Already have an account?{' '}
            <Link to="/login" className="link-btn">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register; 