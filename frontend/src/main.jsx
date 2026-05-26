import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import './index.css';
import App from './App.jsx';
import { initOneSignal } from './utils/onesignal';
import useAppStore from './store/useAppStore';
import i18n from './i18n';

// Initialize OneSignal
initOneSignal();

// Fetch app settings and update i18n app_name
useAppStore.getState().fetchSettings().then(() => {
  const name = useAppStore.getState().appName;
  i18n.addResource('en', 'translation', { app_name: name });
  i18n.addResource('ne', 'translation', { app_name: name });
  document.title = name;
});

// OneSignal handles its own service worker registration for push notifications

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
