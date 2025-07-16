# Frontend Environment Setup

This document explains how to set up environment variables for the frontend application.

## Environment Variables

The frontend uses Vite's environment variable system. All environment variables must be prefixed with `VITE_` to be accessible in the client-side code.

### Required Environment Variables

Create a `.env` file in the frontend directory with the following variables:

```env
# API Configuration
VITE_API_URL=https://groupchat-with-payment.onrender.com
VITE_SOCKET_URL=https://groupchat-with-payment.onrender.com

# App Configuration
VITE_APP_NAME=Group Chat App
VITE_APP_VERSION=1.0.0
```

### Environment Variable Usage

The environment variables are accessed through the `config` object in `src/config/env.js`:

```javascript
import config from './config/env';

// Use API URL
const apiUrl = config.API_URL;

// Use Socket URL
const socketUrl = config.SOCKET_URL;
```

### Development vs Production

- **Development**: Uses `.env` file with localhost URLs
- **Production**: Update `.env` file with production URLs

### Available Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://groupchat-with-payment.onrender.com` |
| `VITE_SOCKET_URL` | WebSocket server URL | `https://groupchat-with-payment.onrender.com` |
| `VITE_APP_NAME` | Application name | `Group Chat App` |
| `VITE_APP_VERSION` | Application version | `1.0.0` |

### Configuration File

The `src/config/env.js` file centralizes all environment variable access and provides fallback values for development.

### Security Note

Environment variables prefixed with `VITE_` are exposed to the client-side code. Do not include sensitive information like API keys or secrets in these variables. 