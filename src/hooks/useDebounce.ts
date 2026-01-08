import { useEffect, useRef } from 'react';

interface UseDebounceOptions {
  delay?: number;
}

const DEFAULT_DEBOUNCE_DELAY = 400;

/**
 * Custom hook for debouncing a value and calling a callback function
 * @param value - The value to debounce
 * @param callback - The function to call after the debounce delay
 * @param options - Configuration options
 * @param options.delay - Debounce delay in milliseconds (default: 500)
 */
export function useDebounce<T>(
  value: T,
  callback: (value: T) => void,
  options: UseDebounceOptions = {}
) {
  const { delay = DEFAULT_DEBOUNCE_DELAY } = options;
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  // Keep the callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Debounced effect
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
}
