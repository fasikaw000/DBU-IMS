import axios from 'axios';

// Create standardized Axios instance
const api = axios.create({
  baseURL: 'http://localhost:5001/api', // Maps to the backend
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to inject the JWT token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
    // Map standard backend error JSON format or fallback to network issue
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default api;
