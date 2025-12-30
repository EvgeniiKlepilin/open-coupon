import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './views/App.tsx';
import AutoApplyManager from './AutoApplyManager';

console.log('[OpenCoupon] Content script loaded');

// Create container for React app (overlay UI)
const container = document.createElement('div');
container.id = 'opencoupon-app';
document.body.appendChild(container);

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Initialize Auto-Apply Manager (handles messages from popup)
const autoApplyManager = new AutoApplyManager();
autoApplyManager.init();
