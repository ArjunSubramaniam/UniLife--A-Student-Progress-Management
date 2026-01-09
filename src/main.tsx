import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { getTheme } from './utils/storage'

// Initialize theme on load
const theme = getTheme();
const root = document.documentElement;
root.classList.remove('light', 'dark');
root.classList.add(theme);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

