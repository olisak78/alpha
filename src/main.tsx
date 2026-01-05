import { Buffer } from 'buffer';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Initialize Prism for syntax highlighting
import './lib/prism-languages';
import { initializeThemeListener } from './stores/themeStore.ts';
import React from 'react';
window.React = React;

// Polyfill Buffer for browser compatibility (needed by swagger-ui-react)
window.Buffer = Buffer;
initializeThemeListener();

createRoot(document.getElementById("root")!).render(<App />);
