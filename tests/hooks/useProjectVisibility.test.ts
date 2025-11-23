import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { useProjectVisibility } from '../../src/hooks/useProjectVisibility';
import { useProjectsContext } from '../../src/contexts/ProjectsContext';
import { Project } from '../../src/types/api';

// Mock the ProjectsContext
vi.mock('../../src/contexts/ProjectsContext', () => ({
  useProjectsContext: vi.fn()
}));

/**
 * useProjectVisibility Hook Tests
 * 
 * Tests for the useProjectVisibility hook which manages project visibility
 * settings in localStorage and provides utilities for showing/hiding projects
 * in the sidebar.
 * 
 * Hook Location: src/hooks/useProjectVisibility.ts
 * Context Location: src/contexts/ProjectsContext.tsx
 */

// ============================================================================
// TEST UTILITIES
// ============================================================================

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'cis20',
    title: 'CIS@2.0',
    description: 'CIS 2.0 Project',
    isVisible: true
  },
  {
    id: '2',
    name: 'usrv',
    title: 'Unified Services',
    description: 'Unified Services Project',
    isVisible: false
  },
  {
    id: '3',
    name: 'ca',
    title: 'Cloud Automation',
    description: 'Cloud Automation Project',
    isVisible: true
  },
  {
    id: '4',
    name: 'other',
    title: 'Other Project',
    description: 'Other Project',
    isVisible: false
  }
];

const mockUseProjectsContext = useProjectsContext as ReturnType<typeof vi.fn>;

// ============================================================================
// HOOK TESTS
// ============================================================================

describe('useProjectVisibility Hook', () => {
  const STORAGE_KEY = 'developer-portal-project-visibility';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock ProjectsContext with default projects
    mockUseProjectsContext.mockReturnValue({
      projects: mockProjects,
      isLoading: false,
      error: null,
      sidebarItems: []
    });

    // Mock window.dispatchEvent
    vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  // ==========================================================================
  // INITIALIZATION TESTS
  // ==========================================================================

  describe('Initialization', () => {
    it('should initialize with all required functions and handle edge cases', () => {
      const { result } = renderHook(() => useProjectVisibility());

      expect(result.current).toBeDefined();
      expect(typeof result.current.isProjectVisible).toBe('function');
      expect(typeof result.current.updateProjectVisibility).toBe('function');
      expect(typeof result.current.getVisibleProjects).toBe('function');
      expect(typeof result.current.resetToDefaults).toBe('function');
      expect(typeof result.current.loadVisibilitySettings).toBe('function');
      
      // Test with empty projects
      mockUseProjectsContext.mockReturnValue({
        projects: [],
        isLoading: false,
        error: null,
        sidebarItems: []
      });

      const { result: emptyResult } = renderHook(() => useProjectVisibility());
      expect(emptyResult.current.getVisibleProjects()).toEqual([]);
      
      // Test with null projects
      mockUseProjectsContext.mockReturnValue({
        projects: null as any,
        isLoading: false,
        error: null,
        sidebarItems: []
      });

      const { result: nullResult } = renderHook(() => useProjectVisibility());
      expect(nullResult.current.getVisibleProjects()).toEqual([]);
    });
  });

  // ==========================================================================
  // LOCALSTORAGE OPERATIONS TESTS
  // ==========================================================================

  describe('localStorage Operations', () => {
    it('should handle localStorage operations correctly', () => {
      const { result } = renderHook(() => useProjectVisibility());
      
      // Test empty localStorage
      expect(result.current.loadVisibilitySettings()).toEqual({});
      
      // Test loading existing settings
      const testSettings = { '1': true, '2': false };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testSettings));
      expect(result.current.loadVisibilitySettings()).toEqual(testSettings);
      
      // Test saving settings
      const newSettings = { '3': true, '4': false };
      act(() => {
        result.current.updateProjectVisibility(newSettings);
      });
      
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(JSON.parse(stored!)).toEqual(newSettings);
    });

    it('should handle localStorage errors gracefully', () => {
      // Test corrupted data
      localStorage.setItem(STORAGE_KEY, 'invalid-json');
      const { result } = renderHook(() => useProjectVisibility());
      expect(result.current.loadVisibilitySettings()).toEqual({});
      
      // Test that operations don't throw errors
      expect(() => {
        act(() => {
          result.current.updateProjectVisibility({ '1': true });
        });
      }).not.toThrow();
      
      expect(() => {
        result.current.loadVisibilitySettings();
      }).not.toThrow();
    });
  });

  // ==========================================================================
  // PROJECT VISIBILITY LOGIC TESTS
  // ==========================================================================

  describe('Project Visibility Logic', () => {
    it('should handle default visibility logic correctly', () => {
      const { result } = renderHook(() => useProjectVisibility());
      
      const cis20Project = mockProjects.find(p => p.name === 'cis20')!;
      const usrvProject = mockProjects.find(p => p.name === 'usrv')!;
      const caProject = mockProjects.find(p => p.name === 'ca')!;
      const otherProject = mockProjects.find(p => p.name === 'other')!;
      
      // Test default behavior (respects project.isVisible)
      expect(result.current.isProjectVisible(cis20Project)).toBe(true);
      expect(result.current.isProjectVisible(usrvProject)).toBe(false); // isVisible: false in mock
      expect(result.current.isProjectVisible(caProject)).toBe(true);
      expect(result.current.isProjectVisible(otherProject)).toBe(false);
    });

    it('should respect stored settings and project.isVisible property', () => {
      // Test stored settings override defaults
      const settings = { '1': false, '4': true }; // Hide cis20, show other
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

      const { result } = renderHook(() => useProjectVisibility());
      
      const cis20Project = mockProjects.find(p => p.name === 'cis20')!;
      const otherProject = mockProjects.find(p => p.name === 'other')!;
      
      expect(result.current.isProjectVisible(cis20Project)).toBe(false);
      expect(result.current.isProjectVisible(otherProject)).toBe(true);
      
      // Test project.isVisible property handling
      const projectWithVisibleFalse: Project = {
        id: '5',
        name: 'cis20',
        title: 'CIS Test',
        description: 'Test',
        isVisible: false
      };

      const projectWithVisibleTrue: Project = {
        id: '6',
        name: 'non-default',
        title: 'Non Default',
        description: 'Test',
        isVisible: true
      };

      expect(result.current.isProjectVisible(projectWithVisibleFalse)).toBe(false);
      expect(result.current.isProjectVisible(projectWithVisibleTrue)).toBe(true);
    });
  });

  // ==========================================================================
  // GET VISIBLE PROJECTS TESTS
  // ==========================================================================

  describe('getVisibleProjects', () => {
    it('should return visible projects based on logic and handle edge cases', () => {
      const { result } = renderHook(() => useProjectVisibility());
      
      // Test default logic - should include cis20, ca (usrv has isVisible: false)
      const visibleProjects = result.current.getVisibleProjects();
      expect(visibleProjects).toHaveLength(2);
      expect(visibleProjects.map(p => p.name)).toEqual(['cis20', 'ca']);
      
      // Test with stored settings
      const settings = { '1': false, '2': true, '4': true }; // Hide cis20, show usrv and other
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      
      const { result: resultWithSettings } = renderHook(() => useProjectVisibility());
      const visibleWithSettings = resultWithSettings.current.getVisibleProjects();
      expect(visibleWithSettings).toHaveLength(3);
      expect(visibleWithSettings.map(p => p.name)).toEqual(['usrv', 'ca', 'other']);
      
      // Test with no projects
      mockUseProjectsContext.mockReturnValue({
        projects: null,
        isLoading: false,
        error: null,
        sidebarItems: []
      });

      const { result: resultNoProjects } = renderHook(() => useProjectVisibility());
      expect(resultNoProjects.current.getVisibleProjects()).toEqual([]);
    });
  });

  // ==========================================================================
  // UPDATE PROJECT VISIBILITY TESTS
  // ==========================================================================

  describe('updateProjectVisibility', () => {
    it('should save settings, dispatch events, and handle multiple updates', () => {
      const { result } = renderHook(() => useProjectVisibility());
      
      const settings = { '1': true, '2': false };
      
      act(() => {
        result.current.updateProjectVisibility(settings);
      });

      // Check localStorage and event dispatch
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(JSON.parse(stored!)).toEqual(settings);
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'projectVisibilityChanged'
        })
      );
      
      // Test multiple updates
      act(() => {
        result.current.updateProjectVisibility({ '1': false, '2': true });
      });

      const updatedStored = localStorage.getItem(STORAGE_KEY);
      expect(JSON.parse(updatedStored!)).toEqual({ '1': false, '2': true });
      expect(window.dispatchEvent).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================================================
  // RESET TO DEFAULTS TESTS
  // ==========================================================================

  describe('resetToDefaults', () => {
    it('should reset projects to defaults, dispatch events, and handle edge cases', () => {
      const { result } = renderHook(() => useProjectVisibility());
      
      act(() => {
        result.current.resetToDefaults();
      });

      const stored = localStorage.getItem(STORAGE_KEY);
      const settings = JSON.parse(stored!);
      
      // Should set default projects to true, others to false
      expect(settings['1']).toBe(true); // cis20
      expect(settings['2']).toBe(true); // usrv
      expect(settings['3']).toBe(true); // ca
      expect(settings['4']).toBe(false); // other
      
      // Should dispatch event
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'projectVisibilityChanged'
        })
      );
      
      // Test with empty projects
      mockUseProjectsContext.mockReturnValue({
        projects: null,
        isLoading: false,
        error: null,
        sidebarItems: []
      });

      const { result: emptyResult } = renderHook(() => useProjectVisibility());
      
      act(() => {
        emptyResult.current.resetToDefaults();
      });

      const emptyStored = localStorage.getItem(STORAGE_KEY);
      expect(JSON.parse(emptyStored!)).toEqual({});
    });
  });

  // ==========================================================================
  // INTEGRATION TESTS
  // ==========================================================================

  describe('Integration Tests', () => {
    it('should handle complete workflow and maintain consistency', () => {
      const { result } = renderHook(() => useProjectVisibility());
      
      // Initial state - check defaults (only cis20 and ca are visible)
      expect(result.current.getVisibleProjects()).toHaveLength(2);
      
      // Update visibility
      act(() => {
        result.current.updateProjectVisibility({
          '1': false, // Hide cis20
          '2': true,  // Show usrv
          '3': true,  // Show ca
          '4': true   // Show other
        });
      });
      
      // Check updated state
      expect(result.current.getVisibleProjects()).toHaveLength(3);
      expect(result.current.getVisibleProjects().map(p => p.name)).toEqual(['usrv', 'ca', 'other']);
      
      // Reset to defaults
      act(() => {
        result.current.resetToDefaults();
      });
      
      // Check reset state
      expect(result.current.getVisibleProjects()).toHaveLength(3);
      expect(result.current.getVisibleProjects().map(p => p.name)).toEqual(['cis20', 'usrv', 'ca']);
      
      // Test consistency across instances
      const { result: result2 } = renderHook(() => useProjectVisibility());
      expect(result.current.loadVisibilitySettings()).toEqual(result2.current.loadVisibilitySettings());
      
      // Test rapid updates
      act(() => {
        result.current.updateProjectVisibility({ '1': true });
        result.current.updateProjectVisibility({ '1': false });
        result.current.updateProjectVisibility({ '1': true, '2': false });
      });

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(JSON.parse(stored!)).toEqual({ '1': true, '2': false });
    });
  });

  // ==========================================================================
  // EDGE CASES TESTS
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle malformed projects and edge case data gracefully', () => {
      const { result } = renderHook(() => useProjectVisibility());
      
      // Test incomplete project
      const incompleteProject: Partial<Project> = {
        id: '7',
        name: 'incomplete'
        // Missing title, description, isVisible
      };

      expect(() => {
        result.current.isProjectVisible(incompleteProject as Project);
      }).not.toThrow();
      
      // Test project with undefined isVisible
      const projectUndefinedVisible: Project = {
        id: '8',
        name: 'test',
        title: 'Test',
        description: 'Test',
        isVisible: undefined as any
      };

      expect(() => {
        result.current.isProjectVisible(projectUndefinedVisible);
      }).not.toThrow();
      
      // Test empty project arrays
      mockUseProjectsContext.mockReturnValue({
        projects: [],
        isLoading: false,
        error: null,
        sidebarItems: []
      });

      const { result: emptyResult } = renderHook(() => useProjectVisibility());
      expect(emptyResult.current.getVisibleProjects()).toEqual([]);
      
      act(() => {
        emptyResult.current.resetToDefaults();
      });
      
      expect(emptyResult.current.getVisibleProjects()).toEqual([]);
      
      // Test large settings object
      const largeSettings: { [key: string]: boolean } = {};
      for (let i = 0; i < 100; i++) { // Reduced from 1000 to 100 for faster tests
        largeSettings[i.toString()] = i % 2 === 0;
      }

      act(() => {
        result.current.updateProjectVisibility(largeSettings);
      });

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(JSON.parse(stored!)).toEqual(largeSettings);
    });
  });
});
