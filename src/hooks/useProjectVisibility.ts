import { useState, useCallback } from 'react';
import { useProjects } from '@/stores/projectsStore';
import { Project } from '@/types/api';

const STORAGE_KEY = 'developer-portal-project-visibility';
const DEFAULT_VISIBLE_PROJECTS = ['cis20', 'usrv', 'ca'];

interface ProjectVisibilitySettings {
  [projectId: string]: boolean;
}

export const useProjectVisibility = () => {
  const projects = useProjects();

  // Load visibility settings from localStorage
  const loadVisibilitySettings = useCallback((): ProjectVisibilitySettings => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to load project visibility settings:', error);
      return {};
    }
  }, []);

  // Save visibility settings to localStorage
  const saveVisibilitySettings = useCallback((settings: ProjectVisibilitySettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save project visibility settings:', error);
    }
  }, []);

  // Get the current visibility state for a project
  const isProjectVisible = useCallback((project: Project): boolean => {
    const settings = loadVisibilitySettings();
    
    // If we have a stored setting for this project, use it
    if (project.id in settings) {
      return settings[project.id];
    }
    
    // Otherwise, use the default logic
    if (DEFAULT_VISIBLE_PROJECTS.includes(project.name)) {
      return project.isVisible !== false; // Show unless explicitly set to false
    }
    
    // For other projects, only show if explicitly set to true
    return project.isVisible === true;
  }, [loadVisibilitySettings]);

  // Update visibility for multiple projects
  const updateProjectVisibility = useCallback((visibilitySettings: ProjectVisibilitySettings) => {
    saveVisibilitySettings(visibilitySettings);
    
    // Trigger a re-render by updating the projects context if needed
    // This could be enhanced to trigger a context update
    window.dispatchEvent(new CustomEvent('projectVisibilityChanged'));
  }, [saveVisibilitySettings]);

  // Get all visible projects
  const getVisibleProjects = useCallback((): Project[] => {
    if (!projects) return [];
    
    return projects.filter(project => isProjectVisible(project));
  }, [projects, isProjectVisible]);

  // Reset to default visibility settings
  const resetToDefaults = useCallback(() => {
    const defaultSettings: ProjectVisibilitySettings = {};
    
    if (projects) {
      projects.forEach(project => {
        defaultSettings[project.id] = DEFAULT_VISIBLE_PROJECTS.includes(project.name);
      });
    }
    
    saveVisibilitySettings(defaultSettings);
    window.dispatchEvent(new CustomEvent('projectVisibilityChanged'));
  }, [projects, saveVisibilitySettings]);

  return {
    isProjectVisible,
    updateProjectVisibility,
    getVisibleProjects,
    resetToDefaults,
    loadVisibilitySettings,
  };
};