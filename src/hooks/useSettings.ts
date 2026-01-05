import { useState, useEffect, useCallback } from 'react';
import { useProjects, useProjectsLoading } from '@/stores/projectsStore';
import { useProjectVisibility } from '@/hooks/useProjectVisibility';
import { useAuth } from '@/contexts/AuthContext';
import { useUserInformation } from '@/hooks/useUserInformation';
import { Project } from '@/types/api';

interface ProjectVisibilityState {
  [projectId: string]: boolean;
}

interface UserInformationData {
  fullname: string;
  team: string;
  email: string;
  role: string;
}

export const useSettings = () => {
  const projects = useProjects();
  const isLoading = useProjectsLoading();
  
  const { isProjectVisible, updateProjectVisibility } = useProjectVisibility();
  const { user } = useAuth();
  
  const [hasChanges, setHasChanges] = useState(false);
  const [visibilityState, setVisibilityState] = useState<ProjectVisibilityState>({});

  // Get processed user information using the custom hook
  const processedUserInfo = useUserInformation({ userInfo: {} as UserInformationData });

  // Initialize visibility state when projects change
  useEffect(() => {
    if (projects && projects.length > 0) {
      const initialState: ProjectVisibilityState = {};
      
      projects.forEach((project: Project) => {
        initialState[project.id] = isProjectVisible(project);
      });
      
      setVisibilityState(initialState);
    }
  }, [projects, isProjectVisible]);

  // Check for changes and notify parent
  useEffect(() => {
    if (projects && projects.length > 0) {
      const hasChanges = projects.some((project: Project) => {
        const currentVisibility = isProjectVisible(project);
        const newVisibility = visibilityState[project.id];
        return currentVisibility !== newVisibility;
      });
      setHasChanges(hasChanges);
    }
  }, [visibilityState, projects, isProjectVisible]);

  const handleVisibilityChange = useCallback((projectId: string, visible: boolean) => {
    setVisibilityState(prev => ({
      ...prev,
      [projectId]: visible
    }));
  }, []);

  const handleSelectAll = useCallback(() => {
    if (!projects) return;
    
    const newState: ProjectVisibilityState = {};
    projects.forEach((project: Project) => {
      newState[project.id] = true;
    });
    setVisibilityState(newState);
  }, [projects]);

  const handleDeselectAll = useCallback(() => {
    if (!projects) return;
    
    const newState: ProjectVisibilityState = {};
    projects.forEach((project: Project) => {
      newState[project.id] = false;
    });
    setVisibilityState(newState);
  }, [projects]);

  const handleSave = useCallback(() => {
    updateProjectVisibility(visibilityState);
    setHasChanges(false);
  }, [updateProjectVisibility, visibilityState]);

  const handleCancel = useCallback(() => {
    // Reset to original state
    if (projects && projects.length > 0) {
      const originalState: ProjectVisibilityState = {};
      projects.forEach((project: Project) => {
        originalState[project.id] = isProjectVisible(project);
      });
      setVisibilityState(originalState);
    }
    setHasChanges(false);
  }, [projects, isProjectVisible]);

  const resetChanges = useCallback(() => {
    handleCancel();
  }, [handleCancel]);

  return {
    // State
    hasChanges,
    visibilityState,
    processedUserInfo,
    isLoading,
    
    // Handlers
    handleVisibilityChange,
    handleSelectAll,
    handleDeselectAll,
    handleSave,
    handleCancel,
    resetChanges,
  };
};