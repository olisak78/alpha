import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';

// Import hooks to test
import { usePersistedState } from '../../src/hooks/usePersistedState';
import { AppStateProvider, useAppState } from '../../src/contexts/AppStateContext';
import {
  usePortalState,
} from '../../src/contexts/hooks';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock router
vi.mock('react-router-dom', () => ({
  useLocation: () => ({
    pathname: '/test',
    search: '',
    hash: '',
    state: null,
    key: 'test',
  }),
}));

// ============================================================================
// TEST UTILITIES
// ============================================================================

function createAppStateWrapper() {
  return ({ children }: { children: ReactNode }) => (
    <AppStateProvider>{children}</AppStateProvider>
  );
}

// ============================================================================
// PERSISTED STATE HOOK TESTS
// ============================================================================

describe('usePersistedState Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default value when localStorage is empty', () => {
    const { result } = renderHook(() =>
      usePersistedState('test-key', 'default-value')
    );

    expect(result.current[0]).toBe('default-value');
  });

  it('should initialize with value from localStorage if it exists', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'));

    const { result } = renderHook(() =>
      usePersistedState('test-key', 'default-value')
    );

    expect(result.current[0]).toBe('stored-value');
  });

  it('should persist state changes to localStorage', () => {
    const { result } = renderHook(() =>
      usePersistedState('test-key', 'initial')
    );

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify('updated'));
  });

  it('should handle complex objects', () => {
    const complexObject = { name: 'test', count: 42, nested: { value: true } };

    const { result } = renderHook(() =>
      usePersistedState('test-key', complexObject)
    );

    const updatedObject = { ...complexObject, count: 100 };

    act(() => {
      result.current[1](updatedObject);
    });

    expect(result.current[0]).toEqual(updatedObject);
    expect(JSON.parse(localStorage.getItem('test-key') || '{}')).toEqual(updatedObject);
  });

  it('should handle arrays', () => {
    const array = [1, 2, 3];

    const { result } = renderHook(() =>
      usePersistedState('test-key', array)
    );

    act(() => {
      result.current[1]([...array, 4]);
    });

    expect(result.current[0]).toEqual([1, 2, 3, 4]);
  });

  it('should sync state across hook instances with same key', () => {
    // Fixed: First instance writes to localStorage
    const { result: result1 } = renderHook(() =>
      usePersistedState('shared-key', 'initial')
    );

    act(() => {
      result1.current[1]('changed');
    });

    expect(result1.current[0]).toBe('changed');
    
    // Fixed: Second instance should read the updated value from localStorage on initialization
    const { result: result2 } = renderHook(() =>
      usePersistedState('shared-key', 'initial')
    );

    // The second instance reads from localStorage and gets the updated value
    expect(result2.current[0]).toBe('changed');
  });

  it('should handle null and undefined values', () => {
    const { result } = renderHook(() =>
      usePersistedState<string | null>('test-key', null)
    );

    expect(result.current[0]).toBe(null);

    act(() => {
      result.current[1]('value');
    });

    expect(result.current[0]).toBe('value');

    act(() => {
      result.current[1](null);
    });

    expect(result.current[0]).toBe(null);
  });

  it('should handle boolean values', () => {
    const { result } = renderHook(() =>
      usePersistedState('test-key', false)
    );

    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1](true);
    });

    expect(result.current[0]).toBe(true);
  });

  it('should handle number values', () => {
    const { result } = renderHook(() =>
      usePersistedState('test-key', 0)
    );

    expect(result.current[0]).toBe(0);

    act(() => {
      result.current[1](42);
    });

    expect(result.current[0]).toBe(42);
  });
});

// ============================================================================
// APP STATE CONTEXT TESTS
// ============================================================================

describe('AppStateContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should provide default values', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: createAppStateWrapper(),
    });

    expect(result.current.activeTab).toBe('components');
    expect(result.current.timelineViewMode).toBe('table');
    expect(result.current.showLandscapeDetails).toBe(false);
    expect(result.current.selectedComponent).toBe(null);
    expect(result.current.selectedLandscape).toBe(null);
    expect(result.current.meHighlightNotifications).toBe(false);
  });

  it('should update currentDevId', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: createAppStateWrapper(),
    });

    act(() => {
      result.current.setCurrentDevId('dev-123');
    });

    expect(result.current.currentDevId).toBe('dev-123');
  });

  it('should update activeTab', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: createAppStateWrapper(),
    });

    act(() => {
      result.current.setActiveTab('feature-toggle');
    });

    expect(result.current.activeTab).toBe('feature-toggle');
  });

  it('should update timelineViewMode', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: createAppStateWrapper(),
    });

    act(() => {
      result.current.setTimelineViewMode('chart');
    });

    expect(result.current.timelineViewMode).toBe('chart');
  });

  it('should update showLandscapeDetails', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: createAppStateWrapper(),
    });

    act(() => {
      result.current.setShowLandscapeDetails(true);
    });

    expect(result.current.showLandscapeDetails).toBe(true);
  });

  it('should update selectedComponent', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: createAppStateWrapper(),
    });

    act(() => {
      result.current.setSelectedComponent('component-123');
    });

    expect(result.current.selectedComponent).toBe('component-123');
  });

  it('should update selectedLandscape', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: createAppStateWrapper(),
    });

    act(() => {
      result.current.setSelectedLandscape('landscape-123');
    });

    expect(result.current.selectedLandscape).toBe('landscape-123');
  });

  it('should update meHighlightNotifications', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: createAppStateWrapper(),
    });

    act(() => {
      result.current.setMeHighlightNotifications(true);
    });

    expect(result.current.meHighlightNotifications).toBe(true);
  });

  it('should persist currentDevId to localStorage', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: createAppStateWrapper(),
    });

    act(() => {
      result.current.setCurrentDevId('dev-456');
    });

    // Fixed: Use the correct storage key from STORAGE_KEYS constant
    const stored = localStorage.getItem('currentDeveloperId');
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!)).toBe('dev-456');
  });

  it('should persist timelineViewMode to localStorage', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: createAppStateWrapper(),
    });

    act(() => {
      result.current.setTimelineViewMode('chart');
    });

    // Fixed: Use the correct storage key from STORAGE_KEYS constant
    const stored = localStorage.getItem('timelineViewMode');
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!)).toBe('chart');
  });

  it('should NOT persist selectedLandscape to localStorage (session-only)', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: createAppStateWrapper(),
    });

    act(() => {
      result.current.setSelectedLandscape('prod-landscape');
    });

    // selectedLandscape should NOT be persisted to localStorage anymore
    const stored = localStorage.getItem('selectedLandscape');
    expect(stored).toBe(null);
    
    // But the state should still be updated in memory
    expect(result.current.selectedLandscape).toBe('prod-landscape');
  });

  it('should throw error when used outside provider', () => {
    // Suppress console error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAppState());
    }).toThrow('useAppState must be used within an AppStateProvider');

    consoleError.mockRestore();
  });

  it('should handle multiple state updates in sequence', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: createAppStateWrapper(),
    });

    act(() => {
      result.current.setActiveTab('components');
      result.current.setSelectedComponent('comp-1');
      result.current.setShowLandscapeDetails(true);
    });

    expect(result.current.activeTab).toBe('components');
    expect(result.current.selectedComponent).toBe('comp-1');
    expect(result.current.showLandscapeDetails).toBe(true);
  });

  it('should maintain independent state for non-persisted values across re-renders', () => {
    const { result, rerender } = renderHook(() => useAppState(), {
      wrapper: createAppStateWrapper(),
    });

    act(() => {
      result.current.setShowLandscapeDetails(true);
      result.current.setSelectedComponent('test-component');
    });

    rerender();

    expect(result.current.showLandscapeDetails).toBe(true);
    expect(result.current.selectedComponent).toBe('test-component');
  });
});

// ============================================================================
// PORTAL STATE HOOK TESTS
// ============================================================================

describe('usePortalState Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should provide access to app state', () => {
    const { result } = renderHook(() => usePortalState(), {
      wrapper: createAppStateWrapper(),
    });

    expect(result.current.activeTab).toBeDefined();
    expect(result.current.currentDevId).toBeDefined();
    expect(result.current.selectedComponent).toBeDefined();
    expect(result.current.selectedLandscape).toBeDefined();
  });

  it('should allow updating activeTab', () => {
    const { result } = renderHook(() => usePortalState(), {
      wrapper: createAppStateWrapper(),
    });

    act(() => {
      result.current.setActiveTab('feature-toggle');
    });

    expect(result.current.activeTab).toBe('feature-toggle');
  });

  it('should allow updating currentDevId', () => {
    const { result } = renderHook(() => usePortalState(), {
      wrapper: createAppStateWrapper(),
    });

    act(() => {
      result.current.setCurrentDevId('new-dev-id');
    });

    expect(result.current.currentDevId).toBe('new-dev-id');
  });

  it('should allow updating selectedComponent', () => {
    const { result } = renderHook(() => usePortalState(), {
      wrapper: createAppStateWrapper(),
    });

    act(() => {
      result.current.setSelectedComponent('component-id');
    });

    expect(result.current.selectedComponent).toBe('component-id');
  });

  it('should allow updating selectedLandscape', () => {
    const { result } = renderHook(() => usePortalState(), {
      wrapper: createAppStateWrapper(),
    });

    act(() => {
      result.current.setSelectedLandscape('landscape-id');
    });

    expect(result.current.selectedLandscape).toBe('landscape-id');
  });

  it('should allow updating showLandscapeDetails', () => {
    const { result } = renderHook(() => usePortalState(), {
      wrapper: createAppStateWrapper(),
    });

    act(() => {
      result.current.setShowLandscapeDetails(true);
    });

    expect(result.current.showLandscapeDetails).toBe(true);
  });

  it('should allow updating meHighlightNotifications', () => {
    const { result } = renderHook(() => usePortalState(), {
      wrapper: createAppStateWrapper(),
    });

    act(() => {
      result.current.setMeHighlightNotifications(true);
    });

    expect(result.current.meHighlightNotifications).toBe(true);
  });
});

// ============================================================================
// STORAGE EVENT SYNCHRONIZATION TESTS
// ============================================================================

describe('localStorage Synchronization', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should sync state when storage event is fired', () => {
    const { result } = renderHook(() =>
      usePersistedState('sync-test', 'initial')
    );

    // Simulate storage event from another tab
    const storageEvent = new StorageEvent('storage', {
      key: 'sync-test',
      newValue: JSON.stringify('from-another-tab'),
      oldValue: JSON.stringify('initial'),
    });

    act(() => {
      window.dispatchEvent(storageEvent);
    });

    expect(result.current[0]).toBe('from-another-tab');
  });

  it('should not sync state for different keys', () => {
    const { result } = renderHook(() =>
      usePersistedState('key-a', 'initial')
    );

    // Simulate storage event for a different key
    const storageEvent = new StorageEvent('storage', {
      key: 'key-b',
      newValue: JSON.stringify('different-value'),
    });

    act(() => {
      window.dispatchEvent(storageEvent);
    });

    expect(result.current[0]).toBe('initial');
  });

  it('should handle null newValue in storage event', () => {
    const { result } = renderHook(() =>
      usePersistedState('test-key', 'initial')
    );

    const storageEvent = new StorageEvent('storage', {
      key: 'test-key',
      newValue: null,
    });

    act(() => {
      window.dispatchEvent(storageEvent);
    });

    expect(result.current[0]).toBe('initial'); // Falls back to default
  });
});
