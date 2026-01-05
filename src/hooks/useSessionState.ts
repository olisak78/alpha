import { useState, useEffect } from 'react';

/**
 * Hook for persisting state in sessionStorage (cleared when browser/tab closes)
 * Similar to usePersistedState but uses sessionStorage instead of localStorage
 * 
 * @param key - The sessionStorage key
 * @param defaultValue - Default value if no stored value exists
 * @returns Tuple of [state, setState] similar to useState
 */
export function useSessionState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  // Initialize state from sessionStorage
  const [state, setState] = useState<T>(() => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from sessionStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  // Persist state changes to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error writing to sessionStorage key "${key}":`, error);
    }
  }, [key, state]);

  // Listen for changes from other tabs/windows (storage event only fires for localStorage, 
  // but we include it for consistency)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.storageArea === sessionStorage) {
        try {
          const newValue = e.newValue ? JSON.parse(e.newValue) : defaultValue;
          setState(newValue);
        } catch (error) {
          console.error(`Error parsing storage event for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, defaultValue]);

  return [state, setState];
}

/**
 * Utility function to safely get value from sessionStorage
 */
export function safeSessionStorageGet<T>(key: string, defaultValue: T): T {
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from sessionStorage key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Utility function to safely set value in sessionStorage
 */
export function safeSessionStorageSet<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to sessionStorage key "${key}":`, error);
  }
}