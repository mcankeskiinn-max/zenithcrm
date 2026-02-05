import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import axios from 'axios'

// Configure axios - only set baseURL if VITE_API_URL is provided (production)
// In development, leave it empty so Vite proxy handles /api requests
const apiUrl = import.meta.env.VITE_API_URL;
if (apiUrl && apiUrl.trim() !== '' && apiUrl !== 'http://localhost:3000') {
  axios.defaults.baseURL = apiUrl.replace(/\/$/, '');
  if (import.meta.env.MODE !== 'production') {
    console.log('Axios baseURL set to:', axios.defaults.baseURL);
  }
}
axios.defaults.withCredentials = true;

import { ErrorBoundary } from '@/components/ErrorBoundary';

const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(';').shift() || '';
  return '';
};

axios.interceptors.request.use((config) => {
  const headers = config.headers || {};

  const authHeader = (headers as any).Authorization || (headers as any).authorization;
  if (typeof authHeader === 'string' && (authHeader === 'Bearer null' || authHeader === 'Bearer undefined' || authHeader === 'Bearer')) {
    delete (headers as any).Authorization;
    delete (headers as any).authorization;
  }

  const method = (config.method || 'get').toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const csrf = getCookie('XSRF-TOKEN');
    if (csrf) {
      (headers as any)['X-CSRF-Token'] = csrf;
    }
  }

  config.headers = headers;
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;
    const url = original.url || '';

    const isAuthEndpoint = typeof url === 'string' && url.includes('/api/auth/');
    const isRefresh = typeof url === 'string' && url.includes('/api/auth/refresh');

    if (status === 401 && !original._retry && !isRefresh) {
      original._retry = true;
      try {
        if (!isAuthEndpoint) {
          await axios.post('/api/auth/refresh', {});
          return axios(original);
        }
      } catch {
        const warningUntil = Date.now() + 15000;
        localStorage.setItem('session_warning_at', String(warningUntil));
        localStorage.removeItem('user');
        if (!window.location.pathname.startsWith('/login')) {
          setTimeout(() => {
            window.location.href = '/login';
          }, 3000);
        }
      }
    }

    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

