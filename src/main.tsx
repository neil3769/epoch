import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { startSync } from './lib/sync';
import { apply as applyTheme } from './lib/theme';
import './styles.css';

applyTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Precaches the app shell and all lesson content for offline use, and picks
// up new versions automatically.
registerSW({ immediate: true });

// Optional GitHub sync: does nothing until the learner connects a repository.
startSync();
