import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker active, offline-first enabled:', reg.scope);
        
        // Handle message signals from registration
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SYNC_TRIGGERED') {
            window.dispatchEvent(new CustomEvent('pwa-sync'));
          }
        });
      })
      .catch((err) => {
        console.error('[PWA] Service Worker activation failed:', err);
      });
  });
}

