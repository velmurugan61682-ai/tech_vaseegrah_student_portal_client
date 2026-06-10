// Intercept and silence benign Recharts ResponsiveContainer dimensions warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && (args[0].includes('width(-1)') || args[0].includes('should be greater than 0'))) {
    return;
  }
  originalWarn(...args);
};

const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && (args[0].includes('width(-1)') || args[0].includes('should be greater than 0'))) {
    return;
  }
  originalError(...args);
};

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
