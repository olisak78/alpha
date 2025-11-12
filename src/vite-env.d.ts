/// <reference types="vite/client" />

// Runtime environment variables from window.env
interface RuntimeEnv {
  BACKEND_URL?: string;
  ENV?: string;
}

interface Window {
  env?: RuntimeEnv;
}
