import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import axios from 'axios'

// Configure axios base URL for production
const rawApiUrl = import.meta.env.VITE_API_URL || '';
axios.defaults.baseURL = rawApiUrl.replace(/\/$/, '');
axios.defaults.withCredentials = true;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
