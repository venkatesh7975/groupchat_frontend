import axios from 'axios';

// API Configuration
const API_BASE_URL = 'https://groupchat-with-payment.onrender.com';

console.log('API Base URL:', API_BASE_URL);

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

// Request interceptor to add authentication token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Request interceptor - token found:', !!token);
    if (token) {
      console.log('Token length:', token.length);
      console.log('Token preview:', token.substring(0, 20) + '...');
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Request URL:', config.url);
    console.log('Request headers:', config.headers);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.log('Response error:', error.response?.status, error.response?.data, error.config?.url);
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token');
      console.log('Authentication required - token cleared');
    }
    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  // Register new user
  register: (userData) => api.post('/api/auth/register', userData),
  
  // Login user
  login: (credentials) => api.post('/api/auth/login', credentials),
  
  // Verify OTP
  verifyOTP: (otpData) => api.post('/api/auth/verify-otp', otpData),
  
  // Get current user
  getCurrentUser: () => api.get('/api/auth/me'),
  
  // Logout user
  logout: () => api.post('/api/auth/logout'),
  
  // Forgot password
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  
  // Verify reset OTP
  verifyResetOTP: (otpData) => api.post('/api/auth/verify-reset-otp', otpData),
  
  // Reset password
  resetPassword: (resetData) => api.post('/api/auth/reset-password', resetData),
};

// User API calls
export const userAPI = {
  // Get user profile
  getProfile: () => api.get('/api/user/profile'),
  
  // Update user profile
  updateProfile: (profileData) => api.put('/api/user/profile', profileData),
  
  // Upload profile picture
  uploadProfilePic: (formData) => api.put('/api/user/profile/picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // Get all users (for admin)
  getAllUsers: () => api.get('/api/user/all'),
};

// Payment API calls
export const paymentAPI = {
  // Create payment order
  createOrder: (orderData) => api.post('/api/payment/create-order', orderData),
  
  // Verify payment
  verifyPayment: (paymentData) => api.post('/api/payment/verify', paymentData),
  
  // Get payment history
  getPaymentHistory: () => api.get('/api/payment/history'),
  
  // Get payment status
  getPaymentStatus: () => api.get('/api/payment/status'),
};

// Group Chat API calls
export const chatAPI = {
  // Get chat messages
  getMessages: () => api.get('/api/chat/messages'),
  
  // Send message
  sendMessage: (messageData) => api.post('/api/chat/send', messageData),
  
  // Get online users
  getOnlineUsers: () => api.get('/api/chat/online-users'),
  
  // Join group chat
  joinGroup: () => api.post('/api/chat/join'),
  
  // Leave group chat
  leaveGroup: () => api.post('/api/chat/leave'),
};

// Health check
export const healthAPI = {
  check: () => api.get('/api/health'),
};

// Utility functions
export const apiUtils = {
  // Set authentication token
  setToken: (token) => {
    localStorage.setItem('token', token);
  },
  
  // Get authentication token
  getToken: () => {
    return localStorage.getItem('token');
  },
  
  // Remove authentication token
  removeToken: () => {
    localStorage.removeItem('token');
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
  
  // Clear all authentication data
  clearAuth: () => {
    localStorage.removeItem('token');
  },
};

// Export the axios instance for direct use if needed
export default api; 