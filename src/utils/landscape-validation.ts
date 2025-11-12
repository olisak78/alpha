import { getCurrentProjectLandscapes } from '@/utils/developer-portal-helpers';

export const isValidLandscapeForProject = (
  landscapeId: string | null, 
  activeProject: string
): boolean => {
  if (!landscapeId || !activeProject) return false;
  
  const projectLandscapes = getCurrentProjectLandscapes(activeProject);
  return projectLandscapes.some(landscape => landscape.id === landscapeId);
};

export const getProjectFromBasePath = (basePath: string | null): string => {
  switch (basePath) {
    case '/cis':
      return 'CIS@2.0';
    case '/cloud-automation':
      return 'Cloud Automation';
    case '/unified-services':
      return 'Unified Services';
    case '/teams':
      return 'Teams';
    default:
      return '';
  }
};


export const validateLandscapeForProject = (
  selectedLandscape: string | null,
  activeProject: string,
  setSelectedLandscape: (landscape: string | null) => void
): void => {
  if (selectedLandscape && activeProject) {
    const isValid = isValidLandscapeForProject(selectedLandscape, activeProject);
    if (!isValid) {
      // Clear invalid landscape selection for this project
      setSelectedLandscape(null);
    }
  }
};