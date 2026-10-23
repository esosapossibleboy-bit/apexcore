import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // WEEK 5: Global session binding - passes httpOnly cookie
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Response interceptor for 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Session expired - redirect to login");
    }
    return Promise.reject(error);
  }
);

export default api;