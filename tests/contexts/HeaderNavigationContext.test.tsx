import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { HeaderNavigationProvider, useHeaderNavigation } from '@/contexts/HeaderNavigationContext';
import * as ReactRouter from 'react-router-dom';
import * as projectsStore from '@/stores/projectsStore';
import * as helpers from '@/utils/developer-portal-helpers';
import * as constants from '@/constants/developer-portal';
import React from 'react';

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: vi.fn(),
    useNavigate: vi.fn(),
  };
});

vi.mock('@/stores/projectsStore', () => ({
  useProjects: vi.fn(),
}));

vi.mock('@/utils/developer-portal-helpers', () => ({
  getBasePath: vi.fn(),
  shouldNavigateToTab: vi.fn(),
}));

vi.mock('@/constants/developer-portal', () => ({
  DEFAULT_COMMON_TAB: 'overview',
  VALID_COMMON_TABS: ['overview', 'members', 'settings'],
}));

describe('HeaderNavigationContext', () => {
  const mockNavigate = vi.fn();
  const mockProjects = [
    { id: 'proj-1', name: 'project1' },
    { id: 'proj-2', name: 'project2' },
  ];

  const mockLocation = {
    pathname: '/',
    search: '',
    hash: '',
    state: null,
    key: 'default',
  };

  const mockTabs = [
    { id: 'tab1', label: 'Tab 1', path: '/path1' },
    { id: 'tab2', label: 'Tab 2', path: '/path2' },
    { id: 'tab3', label: 'Tab 3', path: '/path3' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(ReactRouter.useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(ReactRouter.useLocation).mockReturnValue(mockLocation);
    vi.mocked(projectsStore.useProjects).mockReturnValue(mockProjects);
    vi.mocked(helpers.getBasePath).mockReturnValue(null);
    vi.mocked(helpers.shouldNavigateToTab).mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Provider Initialization', () => {
    it('should provide default values', () => {
      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      expect(result.current.tabs).toEqual([]);
      expect(result.current.activeTab).toBeNull();
      expect(result.current.isDropdown).toBe(false);
    });

    it('should provide setter functions', () => {
      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      expect(typeof result.current.setTabs).toBe('function');
      expect(typeof result.current.setActiveTab).toBe('function');
      expect(typeof result.current.setIsDropdown).toBe('function');
    });

    it('should call useProjects on mount', () => {
      renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      expect(projectsStore.useProjects).toHaveBeenCalled();
    });
  });

  describe('useHeaderNavigation Hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useHeaderNavigation());
      }).toThrow('useHeaderNavigation must be used within a HeaderNavigationProvider');

      console.error = originalError;
    });
  });

  describe('setTabs Function', () => {
    it('should update tabs', async () => {
      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      act(() => {
        result.current.setTabs(mockTabs);
      });

      await waitFor(() => {
        expect(result.current.tabs).toEqual(mockTabs);
      });
    });

    it('should set first tab as active by default', async () => {
      vi.mocked(helpers.getBasePath).mockReturnValue('/projects/project1');

      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      act(() => {
        result.current.setTabs(mockTabs);
      });

      await waitFor(() => {
        expect(result.current.activeTab).toBe('tab1');
      });
    });

    it('should not set active tab when tabs array is empty', async () => {
      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      act(() => {
        result.current.setTabs([]);
      });

      await waitFor(() => {
        expect(result.current.activeTab).toBeNull();
      });
    });

    it('should navigate to first tab when shouldNavigateToTab is true', () => {
      vi.mocked(helpers.getBasePath).mockReturnValue('/projects/project1');
      vi.mocked(helpers.shouldNavigateToTab).mockReturnValue(true);
      vi.mocked(ReactRouter.useLocation).mockReturnValue({
        ...mockLocation,
        pathname: '/projects/project1',
      });

      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      result.current.setTabs(mockTabs);

      expect(mockNavigate).toHaveBeenCalledWith('/projects/project1/tab1', { replace: true });
    });

    it('should not navigate when shouldNavigateToTab is false', () => {
      vi.mocked(helpers.getBasePath).mockReturnValue('/projects/project1');
      vi.mocked(helpers.shouldNavigateToTab).mockReturnValue(false);

      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      result.current.setTabs(mockTabs);

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should use tab from URL if valid', async () => {
      vi.mocked(helpers.getBasePath).mockReturnValue('/projects/project1');
      vi.mocked(ReactRouter.useLocation).mockReturnValue({
        ...mockLocation,
        pathname: '/projects/project1/tab2',
      });

      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      act(() => {
        result.current.setTabs(mockTabs);
      });

      await waitFor(() => {
        expect(result.current.activeTab).toBe('tab2');
      });
    });

    it('should handle teams path with common tab', () => {
      vi.mocked(helpers.getBasePath).mockReturnValue('/teams');
      vi.mocked(helpers.shouldNavigateToTab).mockReturnValue(true);
      vi.mocked(ReactRouter.useLocation).mockReturnValue({
        ...mockLocation,
        pathname: '/teams',
      });

      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      result.current.setTabs(mockTabs);

      expect(mockNavigate).toHaveBeenCalledWith('/teams/tab1/overview', { replace: true });
    });

    it('should preserve existing common tab in teams path', () => {
      vi.mocked(helpers.getBasePath).mockReturnValue('/teams');
      vi.mocked(helpers.shouldNavigateToTab).mockReturnValue(true);
      vi.mocked(ReactRouter.useLocation).mockReturnValue({
        ...mockLocation,
        pathname: '/teams/team1/members',
      });

      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      result.current.setTabs(mockTabs);

      expect(mockNavigate).toHaveBeenCalledWith('/teams/tab1/members', { replace: true });
    });

    it('should use default common tab for invalid common tab', () => {
      vi.mocked(helpers.getBasePath).mockReturnValue('/teams');
      vi.mocked(helpers.shouldNavigateToTab).mockReturnValue(true);
      vi.mocked(ReactRouter.useLocation).mockReturnValue({
        ...mockLocation,
        pathname: '/teams/team1/invalid',
      });

      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      result.current.setTabs(mockTabs);

      expect(mockNavigate).toHaveBeenCalledWith('/teams/tab1/overview', { replace: true });
    });

    it('should not navigate if already at target path', () => {
      vi.mocked(helpers.getBasePath).mockReturnValue('/projects/project1');
      vi.mocked(helpers.shouldNavigateToTab).mockReturnValue(true);
      vi.mocked(ReactRouter.useLocation).mockReturnValue({
        ...mockLocation,
        pathname: '/projects/project1/tab1',
      });

      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      result.current.setTabs(mockTabs);

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('setActiveTab Function', () => {
    it('should update active tab', async () => {
      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      result.current.setTabs(mockTabs);
      
      // Wait for tabs to be set first
      await waitFor(() => {
        expect(result.current.tabs).toEqual(mockTabs);
      });
      
      result.current.setActiveTab('tab2');

      await waitFor(() => {
        expect(result.current.activeTab).toBe('tab2');
      });
    });

    it('should navigate when changing active tab', () => {
      vi.mocked(helpers.getBasePath).mockReturnValue('/projects/project1');
      vi.mocked(helpers.shouldNavigateToTab).mockReturnValue(true);
      vi.mocked(ReactRouter.useLocation).mockReturnValue({
        ...mockLocation,
        pathname: '/projects/project1/tab1',
      });

      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      result.current.setTabs(mockTabs);
      result.current.setActiveTab('tab2');

      expect(mockNavigate).toHaveBeenCalledWith('/projects/project1/tab2', { replace: false });
    });

    it('should not navigate when shouldNavigateToTab is false', () => {
      vi.mocked(helpers.getBasePath).mockReturnValue('/projects/project1');
      vi.mocked(helpers.shouldNavigateToTab).mockReturnValue(false);

      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      result.current.setTabs(mockTabs);
      mockNavigate.mockClear();
      result.current.setActiveTab('tab2');

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should handle teams path when setting active tab', () => {
      vi.mocked(helpers.getBasePath).mockReturnValue('/teams');
      vi.mocked(helpers.shouldNavigateToTab).mockReturnValue(true);
      vi.mocked(ReactRouter.useLocation).mockReturnValue({
        ...mockLocation,
        pathname: '/teams/team1/overview',
      });

      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      result.current.setTabs(mockTabs);
      mockNavigate.mockClear();
      result.current.setActiveTab('tab2');

      expect(mockNavigate).toHaveBeenCalledWith('/teams/tab2/overview', { replace: false });
    });

    it('should preserve common tab when changing active tab in teams', () => {
      vi.mocked(helpers.getBasePath).mockReturnValue('/teams');
      vi.mocked(helpers.shouldNavigateToTab).mockReturnValue(true);
      vi.mocked(ReactRouter.useLocation).mockReturnValue({
        ...mockLocation,
        pathname: '/teams/team1/settings',
      });

      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      result.current.setTabs(mockTabs);
      mockNavigate.mockClear();
      result.current.setActiveTab('tab3');

      expect(mockNavigate).toHaveBeenCalledWith('/teams/tab3/settings', { replace: false });
    });

    it('should not navigate if already at target path', () => {
      vi.mocked(helpers.getBasePath).mockReturnValue('/projects/project1');
      vi.mocked(helpers.shouldNavigateToTab).mockReturnValue(true);
      vi.mocked(ReactRouter.useLocation).mockReturnValue({
        ...mockLocation,
        pathname: '/projects/project1/tab2',
      });

      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      result.current.setTabs(mockTabs);
      mockNavigate.mockClear();
      result.current.setActiveTab('tab2');

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should not navigate when basePath is null', () => {
      vi.mocked(helpers.getBasePath).mockReturnValue(null);

      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      result.current.setTabs(mockTabs);
      mockNavigate.mockClear();
      result.current.setActiveTab('tab2');

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('setIsDropdown Function', () => {
    it('should update dropdown state', async () => {
      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      result.current.setIsDropdown(true);

      await waitFor(() => {
        expect(result.current.isDropdown).toBe(true);
      });
    });

    it('should toggle dropdown state', async () => {
      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      result.current.setIsDropdown(true);
      await waitFor(() => {
        expect(result.current.isDropdown).toBe(true);
      });

      result.current.setIsDropdown(false);
      await waitFor(() => {
        expect(result.current.isDropdown).toBe(false);
      });
    });
  });

  describe('Base Path Changes', () => {

    it('should not clear tabs when base path stays the same', async () => {
      vi.mocked(helpers.getBasePath).mockReturnValue('/projects/project1');

      const { result, rerender } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      act(() => {
        result.current.setTabs(mockTabs);
      });
      
      await waitFor(() => {
        expect(result.current.tabs).toEqual(mockTabs);
      });

      rerender();

      await waitFor(() => {
        expect(result.current.tabs).toEqual(mockTabs);
      });
    });
  });

  describe('URL Synchronization', () => {
    it('should sync active tab when URL changes', async () => {
      vi.mocked(helpers.getBasePath).mockReturnValue('/projects/project1');
      
      const { result, rerender } = renderHook(() => useHeaderNavigation(), {
        wrapper: ({ children }) => {
          const location = ReactRouter.useLocation();
          return <HeaderNavigationProvider>{children}</HeaderNavigationProvider>;
        },
      });

      act(() => {
        result.current.setTabs(mockTabs);
      });
      
      await waitFor(() => {
        expect(result.current.activeTab).toBe('tab1');
      });

      // Change URL to different tab
      vi.mocked(ReactRouter.useLocation).mockReturnValue({
        ...mockLocation,
        pathname: '/projects/project1/tab3',
      });

      rerender();

      await waitFor(() => {
        expect(result.current.activeTab).toBe('tab3');
      });
    });

    it('should not change active tab for invalid tab in URL', async () => {
      vi.mocked(helpers.getBasePath).mockReturnValue('/projects/project1');
      vi.mocked(ReactRouter.useLocation).mockReturnValue({
        ...mockLocation,
        pathname: '/projects/project1/tab1',
      });

      const { result, rerender } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      act(() => {
        result.current.setTabs(mockTabs);
      });
      
      await waitFor(() => {
        expect(result.current.activeTab).toBe('tab1');
      });

      // Change URL to invalid tab
      vi.mocked(ReactRouter.useLocation).mockReturnValue({
        ...mockLocation,
        pathname: '/projects/project1/invalid-tab',
      });

      rerender();

      await waitFor(() => {
        expect(result.current.activeTab).toBe('tab1');
      });
    });

    it('should not sync when tabs are empty', async () => {
      vi.mocked(ReactRouter.useLocation).mockReturnValue({
        ...mockLocation,
        pathname: '/projects/project1/tab2',
      });

      const { result, rerender } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      expect(result.current.tabs).toEqual([]);
      expect(result.current.activeTab).toBeNull();

      rerender();

      await waitFor(() => {
        expect(result.current.activeTab).toBeNull();
      });
    });
  });

  describe('Project Names Memoization', () => {
    it('should recalculate project names when projects change', () => {
      const { rerender } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      expect(projectsStore.useProjects).toHaveBeenCalled();

      // Change projects
      const newProjects = [
        { id: 'proj-3', name: 'project3' },
      ];
      vi.mocked(projectsStore.useProjects).mockReturnValue(newProjects);

      rerender();

      // Should call useProjects again
      expect(projectsStore.useProjects).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tab array', async () => {
      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      act(() => {
        result.current.setTabs([]);
      });

      await waitFor(() => {
        expect(result.current.tabs).toEqual([]);
        expect(result.current.activeTab).toBeNull();
      });
    });

    it('should handle single tab', async () => {
      const singleTab = [{ id: 'only-tab', label: 'Only Tab' }];

      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      act(() => {
        result.current.setTabs(singleTab);
      });

      await waitFor(() => {
        expect(result.current.tabs).toEqual(singleTab);
        expect(result.current.activeTab).toBe('only-tab');
      });
    });

    it('should handle tabs with same id', async () => {
      const duplicateTabs = [
        { id: 'tab1', label: 'First' },
        { id: 'tab1', label: 'Duplicate' },
        { id: 'tab2', label: 'Second' },
      ];

      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      act(() => {
        result.current.setTabs(duplicateTabs);
      });

      await waitFor(() => {
        expect(result.current.tabs).toEqual(duplicateTabs);
      });
    });

    it('should handle tabs without path', async () => {
      const tabsWithoutPath = [
        { id: 'tab1', label: 'Tab 1' },
        { id: 'tab2', label: 'Tab 2' },
      ];

      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      act(() => {
        result.current.setTabs(tabsWithoutPath);
      });

      await waitFor(() => {
        expect(result.current.tabs).toEqual(tabsWithoutPath);
      });
    });

    it('should handle very long tab ids', async () => {
      const longId = 'a'.repeat(1000);
      const tabsWithLongId = [{ id: longId, label: 'Long ID Tab' }];

      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      act(() => {
        result.current.setTabs(tabsWithLongId);
      });

      await waitFor(() => {
        expect(result.current.tabs).toEqual(tabsWithLongId);
        expect(result.current.activeTab).toBe(longId);
      });
    });

    it('should handle special characters in tab ids', async () => {
      const specialTabs = [
        { id: 'tab-with-dashes', label: 'Dashes' },
        { id: 'tab_with_underscores', label: 'Underscores' },
        { id: 'tab.with.dots', label: 'Dots' },
      ];

      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      act(() => {
        result.current.setTabs(specialTabs);
      });

      await waitFor(() => {
        expect(result.current.tabs).toEqual(specialTabs);
      });
    });

    it('should handle rapid tab changes', async () => {
      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      act(() => {
        result.current.setTabs(mockTabs);
        result.current.setActiveTab('tab2');
        result.current.setActiveTab('tab3');
        result.current.setActiveTab('tab1');
      });

      await waitFor(() => {
        expect(result.current.activeTab).toBe('tab1');
      });
    });

    it('should handle setting active tab before setting tabs', async () => {
      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      act(() => {
        result.current.setActiveTab('tab1');
      });

      await waitFor(() => {
        expect(result.current.activeTab).toBe('tab1');
      });
    });

    it('should handle null base path gracefully', () => {
      vi.mocked(helpers.getBasePath).mockReturnValue(null);

      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      expect(() => {
        result.current.setTabs(mockTabs);
        result.current.setActiveTab('tab2');
      }).not.toThrow();
    });

    it('should handle empty projects array', () => {
      vi.mocked(projectsStore.useProjects).mockReturnValue([]);

      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      expect(() => {
        result.current.setTabs(mockTabs);
      }).not.toThrow();
    });
  });

  describe('Teams Path Specific Behavior', () => {
    it('should extract team name from teams path', async () => {
      vi.mocked(helpers.getBasePath).mockReturnValue('/teams');
      vi.mocked(ReactRouter.useLocation).mockReturnValue({
        ...mockLocation,
        pathname: '/teams/engineering/overview',
      });

      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      act(() => {
        result.current.setTabs(mockTabs);
      });

      await waitFor(() => {
        expect(result.current.activeTab).toBe('tab1');
      });
    });

    it('should handle teams path without team name', () => {
      vi.mocked(helpers.getBasePath).mockReturnValue('/teams');
      vi.mocked(helpers.shouldNavigateToTab).mockReturnValue(true);
      vi.mocked(ReactRouter.useLocation).mockReturnValue({
        ...mockLocation,
        pathname: '/teams',
      });

      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      result.current.setTabs(mockTabs);

      expect(mockNavigate).toHaveBeenCalledWith('/teams/tab1/overview', { replace: true });
    });

    it('should handle teams path with only team name', () => {
      vi.mocked(helpers.getBasePath).mockReturnValue('/teams');
      vi.mocked(helpers.shouldNavigateToTab).mockReturnValue(true);
      vi.mocked(ReactRouter.useLocation).mockReturnValue({
        ...mockLocation,
        pathname: '/teams/engineering',
      });

      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      result.current.setTabs(mockTabs);

      expect(mockNavigate).toHaveBeenCalledWith('/teams/tab1/overview', { replace: true });
    });
  });

  describe('Return Value Structure', () => {
    it('should return all expected properties', () => {
      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      expect(result.current).toHaveProperty('tabs');
      expect(result.current).toHaveProperty('activeTab');
      expect(result.current).toHaveProperty('setTabs');
      expect(result.current).toHaveProperty('setActiveTab');
      expect(result.current).toHaveProperty('isDropdown');
      expect(result.current).toHaveProperty('setIsDropdown');
    });

    it('should have correct types for all properties', () => {
      const { result } = renderHook(() => useHeaderNavigation(), {
        wrapper: HeaderNavigationProvider,
      });

      expect(Array.isArray(result.current.tabs)).toBe(true);
      expect(
        result.current.activeTab === null || typeof result.current.activeTab === 'string'
      ).toBe(true);
      expect(typeof result.current.setTabs).toBe('function');
      expect(typeof result.current.setActiveTab).toBe('function');
      expect(typeof result.current.isDropdown).toBe('boolean');
      expect(typeof result.current.setIsDropdown).toBe('function');
    });
  });
});