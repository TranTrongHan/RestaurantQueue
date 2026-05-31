import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css';
import { CookiesProvider } from 'react-cookie';
import axios from 'axios';

axios.defaults.headers.common["ngrok-skip-browser-warning"] = "true";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CookiesProvider>
    <App />
    </CookiesProvider>
  </StrictMode>,
)
