/**
 * Environment Utilities
 * 
 * Helper functions to detect the current environment
 */

/**
 * Check if the application is running in production
 * 
 * This checks both:
 * 1. process.env.NODE_ENV (build time)
 * 2. window.env.ENV (runtime - set by docker-entrypoint.sh)
 * 
 * @returns true if running in production, false otherwise
 */
export const isProduction = (): boolean => {
  // Check runtime environment first (set by docker-entrypoint.sh in production)
  if (typeof window !== 'undefined' && window.env?.ENV) {
    return window.env.ENV === 'production' || window.env.ENV === 'prod';
  }
  
  // Fallback to build-time environment
  return import.meta.env.PROD || process.env.NODE_ENV === 'production';
};

/**
 * Check if the application is running in development
 * 
 * @returns true if running in development, false otherwise
 */
export const isDevelopment = (): boolean => {
  return !isProduction();
};

/**
 * Get the current environment name
 * 
 * @returns 'production', 'development', or 'test'
 */
export const getEnvironment = (): 'production' | 'development' | 'test' => {
  if (typeof window !== 'undefined' && window.env?.ENV) {
    const env = window.env.ENV.toLowerCase();
    if (env === 'production' || env === 'prod') return 'production';
    if (env === 'test') return 'test';
    return 'development';
  }
  
  if (import.meta.env.MODE === 'test' || process.env.NODE_ENV === 'test') {
    return 'test';
  }
  
  if (import.meta.env.PROD || process.env.NODE_ENV === 'production') {
    return 'production';
  }
  
  return 'development';
};