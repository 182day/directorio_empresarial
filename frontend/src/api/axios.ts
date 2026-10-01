// src/api/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRoute = error.config?.url?.includes('/auth/login');
    const isVerifyRoute = error.config?.url?.includes('/auth/verify');
    const status = error.response?.status;

    if (error.response && (status === 401 || status === 403) && !isLoginRoute && !isVerifyRoute) {
      const mensaje =
        error.response.data?.message ||
        error.response.data?.mensaje ||
        'Tu sesión ha expirado o tu cuenta ha sido desactivada.';

      localStorage.removeItem('user');
      localStorage.removeItem('token');

      // Redirigir al login pasando el mensaje en los parámetros de la URL
      window.location.href = `/login?expired=true&reason=${encodeURIComponent(mensaje)}`;
    }

    return Promise.reject(error);
  }
);

export default api;