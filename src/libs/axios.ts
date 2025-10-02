import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'x-app-id': 'panel',
  },
});

// 👉 Interceptor de request: agrega token si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('uifort-authentication');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Error en solicitud:', error);
    return Promise.reject(error);
  }
);

// 👉 Interceptor de response: manejo de errores global
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      console.warn('⚠️ No autorizado, redirigiendo o limpiando token...');
      // localStorage.removeItem('uifort-authentication');
      // window.location.href = '/login'; // opcional
    }

    if (status === 403) {
      console.warn('🚫 Acceso prohibido.');
    }

    if (status >= 500) {
      console.error('💥 Error del servidor:', error.response?.data?.message || 'Error interno');
    }

    return Promise.reject(error);
  }
);

export { api };
