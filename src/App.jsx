import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { authAPI, apiUtils } from './api';

// Components
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import GroupChat from './components/GroupChat';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import AuthDebug from './components/AuthDebug';



function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authStep, setAuthStep] = useState('login'); // login, register, otp, forgot

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Monitor user state changes
  useEffect(() => {
    // User state changed
  }, [user]);

  const checkAuthStatus = async () => {
    try {
      // Check if there's a token in localStorage as backup
      const isAuth = apiUtils.isAuthenticated();
      const token = localStorage.getItem('token');
      
      if (!isAuth) {
        setLoading(false);
        return;
      }

      const response = await authAPI.getCurrentUser();
      
      // Ensure the user object has all required fields
      const userData = {
        ...response.data.user,
        isGroupMember: response.data.user.isGroupMember || false
      };
      
      setUser(userData);
    } catch (error) {
      // Clear any invalid token
      apiUtils.clearAuth();
    } finally {
      setLoading(false);
    }
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  const handleLogout = async () => {
    try {
      // Call logout endpoint to clear server-side session
      await authAPI.logout();
    } catch (error) {
      // Logout error handled silently
    } finally {
      // Clear client-side storage
      apiUtils.clearAuth();
      setUser(null);
      // Redirect to login
      window.location.href = '/login';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
        <div style={{ marginTop: '20px', textAlign: 'center', maxWidth: '400px' }}>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
            🔗 Connecting to backend...
          </p>
          <p style={{ fontSize: '12px', color: '#888' }}>
            Backend: https://groupchat-with-payment.onrender.com
          </p>
        </div>
        <button 
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          style={{ marginTop: '10px', padding: '5px 10px' }}
        >
          Clear Token & Reload
        </button>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <AuthDebug user={user} loading={loading} />
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
              (() => {
                if (!user) {
                  return <Navigate to="/login" replace />;
                }
                
                if (!user.isGroupMember) {
                  return <Navigate to="/dashboard" replace />;
                }
                
                return <GroupChat user={user} onLogout={handleLogout} />;
              })()
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
