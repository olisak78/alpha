import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    actualTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'developer-portal-theme';

function getSystemTheme(): 'light' | 'dark' {
    if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
}

function getStoredTheme(): Theme {
    if (typeof window !== 'undefined') {
        try {
            const stored = localStorage.getItem(THEME_STORAGE_KEY);
            if (stored === 'light' || stored === 'dark' || stored === 'system') {
                return stored;
            }
        } catch (error) {
            console.warn('Failed to read theme from localStorage:', error);
        }
    }
    return 'system';
}

function storeTheme(theme: Theme): void {
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch (error) {
            console.warn('Failed to store theme in localStorage:', error);
        }
    }
}

function applyThemeToDocument(actualTheme: 'light' | 'dark'): void {
    if (typeof window !== 'undefined') {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(actualTheme);
    }
}

interface ThemeProviderProps {
    children: ReactNode;
    defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme = 'system' }: ThemeProviderProps) {
    const stored = getStoredTheme();
    const [theme, setThemeState] = useState<Theme>(() => {
        return stored || defaultTheme;
    });

    const [actualTheme, setActualTheme] = useState<'light' | 'dark'>(() => {
        if (stored === 'system') {
            return getSystemTheme();
        }
        return stored === 'dark' ? 'dark' : 'light';
    });

    // Apply theme to document immediately when actualTheme changes
    useEffect(() => {
        applyThemeToDocument(actualTheme);
    }, [actualTheme]);

    // Handle system theme changes when theme is set to 'system'
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleSystemThemeChange = (e: MediaQueryListEvent) => {
            setActualTheme(e.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleSystemThemeChange);

        // Set initial system theme
        setActualTheme(mediaQuery.matches ? 'dark' : 'light');

        return () => {
            mediaQuery.removeEventListener('change', handleSystemThemeChange);
        };
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        storeTheme(newTheme);

        if (newTheme === 'system') {
            setActualTheme(getSystemTheme());
        } else {
            setActualTheme(newTheme === 'dark' ? 'dark' : 'light');
        }
    };

    const toggleTheme = () => {
        if (theme === 'system') {
            // If currently system, toggle to the opposite of current system theme
            const systemTheme = getSystemTheme();
            setTheme(systemTheme === 'dark' ? 'light' : 'dark');
        } else {
            // Toggle between light and dark
            setTheme(actualTheme === 'dark' ? 'light' : 'dark');
        }
    };

    const contextValue: ThemeContextType = {
        theme,
        actualTheme,
        setTheme,
        toggleTheme,
    };

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextType {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}