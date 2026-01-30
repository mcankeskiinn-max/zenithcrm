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
  console.log('Axios baseURL set to:', axios.defaults.baseURL);
}
axios.defaults.withCredentials = true;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
