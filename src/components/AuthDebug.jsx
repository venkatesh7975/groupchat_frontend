import React from 'react';

const AuthDebug = ({ user, loading }) => {
  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#f0f0f0',
      border: '1px solid #ccc',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 1000
    }}>
      <h4>🔍 Auth Debug</h4>
      <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
      <div><strong>User:</strong> {user ? user.name : 'None'}</div>
      <div><strong>User ID:</strong> {user?._id || 'None'}</div>
      <div><strong>Group Member:</strong> {user?.isGroupMember ? 'Yes' : 'No'}</div>
      <div><strong>Token:</strong> {localStorage.getItem('token') ? 'Present' : 'Missing'}</div>
      <div><strong>Current Path:</strong> {window.location.pathname}</div>
    </div>
  );
};

export default AuthDebug; 