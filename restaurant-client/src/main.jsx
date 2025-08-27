import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css';
import { CookiesProvider } from 'react-cookie';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CookiesProvider>
    <App />
    </CookiesProvider>
  </StrictMode>,
)
