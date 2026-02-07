import './styles/polyfills.js';
import './styles/shadcn-ui.css';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { validateEnv } from './utils/envValidator'

import { AuthProvider } from './context/AuthContext';
import AppWithRouter from './App.jsx';
import AppWrapper from './App.jsx';

// Validate environment on startup
const envValidation = validateEnv();

if (!envValidation.isValid) {
  // Show error to user
  const root = createRoot(document.getElementById('root'));
  root.render(
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#d32f2f', marginBottom: '1rem' }}>Configuration Error</h1>
        <p style={{ color: '#666', marginBottom: '1rem' }}>{envValidation.error}</p>
        <p style={{ color: '#999', fontSize: '0.9rem' }}>Please check your environment variables and refresh the page.</p>
      </div>
    </div>
  );
} else {
  createRoot(document.getElementById('root')).render(
    <AuthProvider>
      <AppWrapper />
    </AuthProvider>,
  );
}
