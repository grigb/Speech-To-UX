import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from './core/store';
import { App } from './ui/App';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
