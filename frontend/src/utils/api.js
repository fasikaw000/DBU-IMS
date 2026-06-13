import axios from 'axios';

// Create standardized Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to inject the JWT token automatically
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error handling
api.interceptors.response.use(
  (response) => {
    // Backend standardizes responses as { success, message, data }
    return response.data;
  },
  (error) => {
    // Handle Token Expired / Unauthorized - Automatic Logout
    if (error.response?.status === 401) {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
      // We don't use window.location.href here to avoid infinite loops, 
      // AuthContext will pick up the change.
    }

    // Map standard backend error JSON format or fallback to network issue
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    error.message = message;
    return Promise.reject(error);
  }
);

export default api;
