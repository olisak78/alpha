// Runtime environment variables placeholder for local development
// This file is auto-generated in production by docker-entrypoint.sh
// In local development, the application will use localhost defaults

// Only set if not already defined (docker-entrypoint.sh may have set it)
if (typeof window.env === 'undefined') {
  window.env = {
    // Leave empty for local development
    // The application code will fall back to localhost defaults
  };
  console.log('📝 Using local development environment (localhost defaults)');
}

