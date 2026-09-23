/**
 * Axios API client — single instance used across the entire frontend.
 *
 * Configured with:
 *   - Base URL pointing to the Flask backend (/api, proxied by Vite in dev)
 *   - Automatic JWT token injection via request interceptor
 *   - Centralized error handling via response interceptor
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Request interceptor: attach JWT token to every request ---
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('leavetrack_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response interceptor: handle 401 (expired/invalid token) ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale auth data and redirect to login
      localStorage.removeItem('leavetrack_token');
      localStorage.removeItem('leavetrack_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
