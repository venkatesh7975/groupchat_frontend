import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import config from './config/env';

// Components
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import GroupChat from './components/GroupChat';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';

// Configure axios defaults
axios.defaults.baseURL = config.API_URL;
axios.defaults.withCredentials = true;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authStep, setAuthStep] = useState('login'); // login, register, otp, forgot

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      console.log('Not authenticated');
    } finally {
      setLoading(false);
    }
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  const handleLogout = () => {
    setUser(null);
    // Redirect to login
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={
              !user ? (
                <Login 
                  onLogin={setUser} 
                  authStep={authStep}
                  setAuthStep={setAuthStep}
                />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            } 
          />
          <Route 
            path="/register" 
            element={
              !user ? (
                <Register 
                  onRegister={setUser}
                  authStep={authStep}
                  setAuthStep={setAuthStep}
                />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            } 
          />
          <Route 
            path="/forgot-password" 
            element={
              !user ? <ForgotPassword /> : <Navigate to="/dashboard" replace />
            } 
          />
          <Route 
            path="/reset-password" 
            element={
              !user ? <ResetPassword /> : <Navigate to="/dashboard" replace />
            } 
          />

          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              user ? (
                <Dashboard user={user} onUserUpdate={handleUserUpdate} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route 
            path="/group-chat" 
            element={
              user ? (
                <GroupChat user={user} />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />

          {/* Default redirect */}
          <Route 
            path="/" 
            element={
              user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
