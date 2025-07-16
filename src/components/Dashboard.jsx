import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, paymentAPI, authAPI, apiUtils } from '../api';
import './Dashboard.css';

const Dashboard = ({ user, onUserUpdate, onLogout }) => {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [profilePic, setProfilePic] = useState(user?.profilePic || '');
  const [uploading, setUploading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setProfilePic(user.profilePic);
      
      // Check payment status if user is not already a group member
      if (!user.isGroupMember) {
        checkPaymentStatus();
      }
    }
  }, [user]);

  const checkPaymentStatus = async () => {
    try {
      const response = await paymentAPI.getPaymentStatus();
      
      if (response.data.isGroupMember && onUserUpdate) {
        onUserUpdate({ ...user, isGroupMember: true });
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage('Name is required');
      return;
    }

    try {
      const response = await userAPI.updateProfile({ name });
      
      if (onUserUpdate) {
        onUserUpdate(response.data.user);
      }
      setEditing(false);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log('📁 File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    setUploading(true);
    const formData = new FormData();
    formData.append('profilePic', file);

    try {
      console.log('📤 Uploading profile picture...');
      const response = await userAPI.uploadProfilePic(formData);
      console.log('✅ Upload successful:', response.data);

      setProfilePic(response.data.profilePic);
      if (onUserUpdate) {
        onUserUpdate({ ...user, profilePic: response.data.profilePic });
      }
      setMessage('Profile picture updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('❌ Upload failed:', error.response?.data || error.message);
      setMessage(error.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleJoinGroupChat = async () => {
    setJoining(true);
    setMessage('');

    try {
      // Create payment order
      const orderResponse = await paymentAPI.createOrder({});

      const { orderId, amount, currency, keyId } = orderResponse.data;

      // Initialize Razorpay
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'Group Chat Access',
        description: 'Join our exclusive group chat',
        order_id: orderId,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyResponse = await paymentAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (onUserUpdate) {
              onUserUpdate({ ...user, isGroupMember: true });
            }
            setMessage('Payment successful! You can now access the group chat.');
            setTimeout(() => setMessage(''), 5000);
            
            // Refresh the page to update the UI
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } catch (error) {
            setMessage(error.response?.data?.message || 'Payment verification failed');
          } finally {
            setJoining(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email
        },
        theme: {
          color: '#667eea'
        },
        modal: {
          ondismiss: function() {
            setJoining(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to create payment order');
      setJoining(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authAPI.logout();
      
      // Clear client-side storage
      apiUtils.clearAuth();
      
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still logout even if backend call fails
      apiUtils.clearAuth();
      if (onLogout) {
        onLogout();
      }
    } finally {
      setLoggingOut(false);
    }
  };

  if (!user) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user.name}!</p>
        <button 
          onClick={handleLogout}
          disabled={loggingOut}
          className="logout-btn"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {loggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="dashboard-content">
        <div className="profile-section">
          <h2>Profile</h2>
          
          <div className="profile-info">
            <div className="profile-picture">
              <img 
                src={profilePic || '/default-avatar.png'} 
                alt={user.name}
                className="profile-avatar"
              />
              <div className="upload-overlay">
                <label htmlFor="profile-pic-upload" className="upload-btn">
                  {uploading ? 'Uploading...' : '📷'}
                </label>
                <input
                  id="profile-pic-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicUpload}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
              </div>
            </div>

            <div className="profile-details">
              {editing ? (
                <form onSubmit={handleProfileUpdate} className="edit-form">
                  <div className="form-group">
                    <label htmlFor="name">Name:</label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="save-btn">
                      Save
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setEditing(false)}
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="profile-display">
                  <div className="info-row">
                    <strong>Name:</strong> {user.name}
                  </div>
                  <div className="info-row">
                    <strong>Email:</strong> {user.email}
                  </div>
                  <div className="info-row">
                    <strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                  <button 
                    onClick={() => setEditing(true)}
                    className="edit-btn"
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="group-chat-section">
          <h2>Group Chat</h2>
          
          {user.isGroupMember ? (
            <div className="member-status">
              <div className="status-badge success">✅ Group Member</div>
              <p>You have access to the group chat!</p>
              <button 
                onClick={() => navigate('/group-chat')}
                className="join-chat-btn"
              >
                Open Group Chat
              </button>
            </div>
          ) : (
            <div className="join-section">
              <div className="join-info">
                <h3>Join Group Chat</h3>
                <p>Connect with other members in real-time chat!</p>
                <ul className="features-list">
                  <li>✨ Real-time messaging</li>
                  <li>📁 File sharing (images, videos, documents)</li>
                  <li>👥 See who's online</li>
                  <li>💬 Group discussions</li>
                </ul>
                <div className="price-info">
                  <span className="price">₹1</span>
                  <span className="price-note">One-time payment</span>
                </div>
              </div>
              <button 
                onClick={handleJoinGroupChat}
                disabled={joining}
                className="join-btn"
              >
                {joining ? 'Processing...' : 'Join Group Chat - ₹1'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 