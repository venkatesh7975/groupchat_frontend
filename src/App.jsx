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
    console.log('🚀 App mounted, checking auth status...');
    console.log('📱 Frontend URL:', window.location.origin);
    console.log('🔗 Backend URL:', 'https://groupchat-with-payment.onrender.com');
    checkAuthStatus();
  }, []);

  // Monitor user state changes
  useEffect(() => {
    console.log('👤 User state changed:', user);
    if (user) {
      console.log('👤 User details:', {
        name: user.name,
        email: user.email,
        isGroupMember: user.isGroupMember,
        id: user._id
      });
    }
  }, [user]);

  const checkAuthStatus = async () => {
    try {
      // Check if there's a token in localStorage as backup
      const isAuth = apiUtils.isAuthenticated();
      const token = localStorage.getItem('token');
      console.log('🔐 Is authenticated:', isAuth);
      console.log('🎫 Token exists:', !!token);
      if (token) {
        console.log('🎫 Token length:', token.length);
        console.log('🎫 Token preview:', token.substring(0, 20) + '...');
      }
      
      if (!isAuth) {
        console.log('⚠️ No authentication token found - redirecting to login');
        console.log('💡 To get started, please create an account or sign in');
        setLoading(false);
        return;
      }

      console.log('🔍 Checking authentication status with server...');
      const response = await authAPI.getCurrentUser();
      console.log('✅ Authentication successful, user:', response.data.user);
      
      // Ensure the user object has all required fields
      const userData = {
        ...response.data.user,
        isGroupMember: response.data.user.isGroupMember || false
      };
      
      console.log('✅ Setting user state:', userData);
      setUser(userData);
    } catch (error) {
      console.log('❌ Not authenticated or token expired:', error.response?.status);
      console.log('🧹 Clearing invalid token...');
      // Clear any invalid token
      apiUtils.clearAuth();
    } finally {
      setLoading(false);
    }
  };

  const handleUserUpdate = (updatedUser) => {
    console.log('Updating user state:', updatedUser);
    setUser(updatedUser);
  };

  const handleLogout = async () => {
    try {
      // Call logout endpoint to clear server-side session
      await authAPI.logout();
    } catch (error) {
      console.log('Logout error:', error);
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

  console.log('App render - user:', user, 'loading:', loading);

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
              (() => {
                console.log('Dashboard route - user:', user);
                return user ? (
                  <Dashboard user={user} onUserUpdate={handleUserUpdate} onLogout={handleLogout} />
                ) : (
                  <Navigate to="/login" replace />
                );
              })()
            } 
          />
          <Route 
            path="/group-chat" 
            element={
              (() => {
                console.log('🔍 Group chat route - user:', user);
                console.log('🔍 User isGroupMember:', user?.isGroupMember);
                
                if (!user) {
                  console.log('❌ No user - redirecting to login');
                  return <Navigate to="/login" replace />;
                }
                
                if (!user.isGroupMember) {
                  console.log('❌ User not a group member - redirecting to dashboard');
                  return <Navigate to="/dashboard" replace />;
                }
                
                console.log('✅ User authenticated and is group member - rendering GroupChat');
                return <GroupChat user={user} />;
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
