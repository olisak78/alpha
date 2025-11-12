import { useState, useEffect } from 'react';
import { safeLocalStorageGet, safeLocalStorageSet } from '@/utils/developer-portal-helpers';

export function usePersistedState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  // Initialize state from localStorage
  const [state, setState] = useState<T>(() => {
    return safeLocalStorageGet(key, defaultValue);
  });

  // Persist state changes to localStorage
  useEffect(() => {
    safeLocalStorageSet(key, state);
  }, [key, state]);

  // Listen for changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        const newValue = e.newValue ? JSON.parse(e.newValue) : defaultValue;
        setState(newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, defaultValue]);

  return [state, setState];
}