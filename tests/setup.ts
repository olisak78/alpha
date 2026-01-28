import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

// Ensure localStorage.clear exists across jsdom/Vitest environments
if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
  const ls = window.localStorage as Storage;

  // Patch Storage.prototype.clear if missing
  const storageProto = Object.getPrototypeOf(ls);
  if (storageProto && typeof (storageProto as any).clear !== 'function') {
    const clearImpl = function (this: Storage) {
      // Remove all keys safely
      const keys: string[] = [];
      for (let i = 0; i < this.length; i++) {
        const k = this.key(i);
        if (k) keys.push(k);
      }
      keys.forEach((k) => this.removeItem(k));
    };
    try {
      Object.defineProperty(storageProto, 'clear', {
        value: clearImpl,
        configurable: true,
        writable: true,
      });
    } catch {
      // Fallback: patch the instance if prototype patching is disallowed
      try {
        (ls as any).clear = clearImpl;
      } catch (error) {
        console.warn('Failed to patch localStorage.clear:', error);
      }
    }
  }


  // Ensure globalThis.localStorage references the same Storage instance
  (globalThis as any).localStorage = ls;
}

// Cleanup after each test
afterEach(() => {
  cleanup();
});
