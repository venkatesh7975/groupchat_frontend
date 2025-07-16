// Environment configuration for the frontend
const config = {
  // API Configuration
  API_URL: import.meta.env.VITE_API_URL || 'https://groupchat-with-payment.onrender.com',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'https://groupchat-with-payment.onrender.com',
  
  // App Configuration
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Group Chat App',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Development/Production flags
  IS_DEVELOPMENT: import.meta.env.DEV || false,
  IS_PRODUCTION: import.meta.env.PROD || false,
  
  // Debug mode
  DEBUG: import.meta.env.DEV || false
};

// Log configuration in development
if (config.DEBUG) {
  console.log('Environment Configuration:', config);
}

export default config; 