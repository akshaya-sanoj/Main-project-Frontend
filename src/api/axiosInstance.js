// src/services/axiosInstance.js
import axios from 'axios';

// Create a custom instance pointing to your json-server
const API = axios.create({
  baseURL: 'https://main-project-backend-4.onrender.com/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add a request interceptor to attach user info if needed
API.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem('fest_user');
    if (user) {
      // You can pass custom headers if your backend requires them
      // config.headers['X-User-Role'] = JSON.parse(user).role;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;