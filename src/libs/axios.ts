import axios from 'axios';
import { getAuthToken } from 'src/utils/auth/custom/storage';
import { perfEnabled, route as perfRoute, recordApi } from './perf/monitor';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    'x-app-id': 'panel',
  },
});

// 👉 Interceptor de request: agrega token si existe
api.interceptors.request.use(
  (config) => {
    if (perfEnabled())
      Object.assign(config, { __perfStart: performance.now(), __perfRoute: perfRoute() });
    const token = getAuthToken();

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
// Monitor de rendimiento (?perf=1): tiempo, tamaño y estado de cada llamada.
const trackPerf = (config: any, status: number, data: unknown, headers?: any) => {
  if (!config?.__perfStart) return;
  const len = Number(headers?.['content-length']);
  recordApi({
    route: config.__perfRoute,
    method: String(config.method || 'get').toUpperCase(),
    endpoint: String(config.url || ''),
    ms: performance.now() - config.__perfStart,
    status,
    bytes:
      Number.isFinite(len) && len > 0
        ? len
        : typeof data === 'string'
          ? data.length
          : JSON.stringify(data ?? '').length,
  });
};

api.interceptors.response.use(
  (response) => {
    trackPerf(response.config, response.status, response.data, response.headers);
    return response;
  },
  (error) => {
    trackPerf(
      error.config,
      error.response?.status ?? 0,
      error.response?.data,
      error.response?.headers
    );
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
