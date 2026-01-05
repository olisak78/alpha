import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';
type ActualTheme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  actualTheme: ActualTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  _updateActualTheme: (actualTheme: ActualTheme) => void;
}

const THEME_STORAGE_KEY = 'developer-portal-theme';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getSystemTheme(): ActualTheme {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function applyThemeToDocument(actualTheme: ActualTheme): void {
  if (typeof window !== 'undefined') {
    const root = window.document.documentElement;

    // Only update if actually different (prevents unnecessary DOM mutations)
    if (!root.classList.contains(actualTheme)) {
      root.classList.remove('light', 'dark');
      root.classList.add(actualTheme);
    }
  }
}

function resolveActualTheme(theme: Theme): ActualTheme {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme === 'dark' ? 'dark' : 'light';
}

/**
 * Read theme preference from localStorage synchronously
 * This ensures the initial store state matches what's persisted
 */
function getInitialTheme(): Theme {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.state?.theme || 'system';
      }
    } catch (e) {
      console.error('[themeStore] Failed to read initial theme from localStorage:', e);
    }
  }
  return 'system';
}

/**
 * Calculate initial actualTheme based on persisted preference
 * This prevents icon mismatch on page load
 */
function getInitialActualTheme(): ActualTheme {
  const theme = getInitialTheme();
  return resolveActualTheme(theme);
}

// ============================================================================
// STORE DEFINITION
// ============================================================================

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: getInitialTheme(),
      actualTheme: getInitialActualTheme(),
      setTheme: (newTheme) => {
        const actualTheme = resolveActualTheme(newTheme);
        set({ theme: newTheme, actualTheme });
        applyThemeToDocument(actualTheme);
      },

      toggleTheme: () => {
        const { theme, actualTheme } = get();

        if (theme === 'system') {
          const systemTheme = getSystemTheme();
          const newTheme = systemTheme === 'dark' ? 'light' : 'dark';
          set({ theme: newTheme, actualTheme: newTheme });
          applyThemeToDocument(newTheme);
        } else {
          const newTheme = actualTheme === 'dark' ? 'light' : 'dark';
          set({ theme: newTheme, actualTheme: newTheme });
          applyThemeToDocument(newTheme);
        }
      },

      _updateActualTheme: (actualTheme) => {
        set({ actualTheme });
        applyThemeToDocument(actualTheme);
      },
    }),
    {
      name: THEME_STORAGE_KEY,

      // Only persist the theme preference, not actualTheme
      // This means updating actualTheme won't trigger localStorage writes
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

// ============================================================================
// INITIALIZATION (runs once when module is imported)
// ============================================================================

if (typeof window !== 'undefined') {
  // Wait for store to be fully hydrated from localStorage
  const unsubscribe = useThemeStore.persist.onFinishHydration(() => {
    const state = useThemeStore.getState();
    const actualTheme = resolveActualTheme(state.theme);

    // Update actualTheme if needed
    // Since actualTheme is not in partialize, this won't trigger a localStorage write
    if (state.actualTheme !== actualTheme) {
      useThemeStore.setState({ actualTheme });
    }

    // Apply theme to document
    applyThemeToDocument(actualTheme);

    // Unsubscribe after first hydration
    unsubscribe();
  });
}

// ============================================================================
// SYSTEM THEME LISTENER (with duplicate protection)
// ============================================================================

let listenerInitialized = false;
let cleanupListener: (() => void) | null = null;

export function initializeThemeListener(): () => void {
  // Guard against duplicate initialization
  if (typeof window === 'undefined' || listenerInitialized) {
    return cleanupListener || (() => { });
  }

  listenerInitialized = true;
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleSystemThemeChange = (e: MediaQueryListEvent) => {
    const store = useThemeStore.getState();

    // Only update if theme preference is 'system'
    if (store.theme === 'system') {
      const newActualTheme = e.matches ? 'dark' : 'light';
      store._updateActualTheme(newActualTheme);
    }
  };

  mediaQuery.addEventListener('change', handleSystemThemeChange);

  cleanupListener = () => {
    mediaQuery.removeEventListener('change', handleSystemThemeChange);
    listenerInitialized = false;
    cleanupListener = null;
  };

  return cleanupListener;
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Get only the actual theme value
 * Use this for components that only need to know if it's light or dark
 */
export const useActualTheme = (): ActualTheme => {
  return useThemeStore((state) => state.actualTheme);
};

/**
 * Get only the theme preference
 * Use this for settings UI that shows the preference (light/dark/system)
 */
export const useThemePreference = (): Theme => {
  return useThemeStore((state) => state.theme);
};

/**
 * Get only the actions (never causes re-renders)
 * Use this for buttons that change theme but don't need to display current theme
 */
export const useThemeActions = () => {
  return {
    setTheme: useThemeStore((state) => state.setTheme),
    toggleTheme: useThemeStore((state) => state.toggleTheme),
  };
};

/**
 * Get both state and actions (drop-in replacement for old useTheme)
 * Use this when you need both theme info and ability to change it
 */
export const useTheme = () => {
  // Subscribe separately - each returns stable reference
  const theme = useThemeStore((state) => state.theme);
  const actualTheme = useThemeStore((state) => state.actualTheme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  return { theme, actualTheme, setTheme, toggleTheme };
};

// ============================================================================
// TESTING UTILITIES
// ============================================================================

/**
 * Reset store to initial state
 * Note: Since actualTheme is not persisted, this won't write to localStorage
 */
export const resetThemeStore = () => {
  const actualTheme = getSystemTheme();
  useThemeStore.setState({
    theme: 'system',
    actualTheme,
  });
  applyThemeToDocument(actualTheme);
};

/**
 * Set specific theme state for testing
 */
export const setThemeState = (state: Partial<Pick<ThemeState, 'theme' | 'actualTheme'>>) => {
  useThemeStore.setState(state);
  if (state.actualTheme) {
    applyThemeToDocument(state.actualTheme);
  }
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { Theme, ActualTheme, ThemeState };
export { THEME_STORAGE_KEY };