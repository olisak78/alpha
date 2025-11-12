import { Buffer } from 'buffer';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './contexts/ThemeContext.tsx';
// Initialize Prism for syntax highlighting
import './lib/prism-languages';

// Polyfill Buffer for browser compatibility (needed by swagger-ui-react)
window.Buffer = Buffer;

createRoot(document.getElementById("root")!).render(<ThemeProvider><App /></ThemeProvider>);
