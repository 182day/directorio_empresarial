// src/api/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// 1. Adjuntar Token en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Interceptor de respuestas con manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si la respuesta es 401 pero NO proviene del intento de login
    const isLoginRoute = error.config?.url?.includes('/auth/login');

    if (error.response && error.response.status === 401 && !isLoginRoute) {
      // Solo limpiar y redirigir si el token expiró/falló en peticiones protegidas
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;