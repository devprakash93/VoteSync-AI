import axios from 'axios';

// Single source of truth for all API calls.
// VITE_API_URL can be set in .env for production deployments.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Automatically inject the JWT token from localStorage into every request
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

// Response interceptor — handle 401 globally (token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clean up
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default api;
export { BASE_URL };
