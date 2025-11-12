import { FeatureToggle, Landscape, User } from "@/types/developer-portal";
import { projectComponents } from "@/constants/developer-portal";

// Status color helper
export const getStatusColor = (status: string) => {
  switch (status) {
    case "healthy":
    case "active":
    case "deployed":
      return "bg-success text-white";
    case "warning":
    case "deploying":
      return "bg-warning text-white";
    case "error":
    case "inactive":
    case "failed":
      return "bg-destructive text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
};

// Get available components for feature toggles
export const getAvailableComponents = (activeProject: string, featureToggles: FeatureToggle[]) => {
  const currentProjectComponents = projectComponents[activeProject as keyof typeof projectComponents] || [];
  const toggleComponents = featureToggles
    .filter(toggle => currentProjectComponents.some(c => c.id === toggle.component))
    .map(toggle => toggle.component);

  return [...new Set(toggleComponents)].sort();
};

// Get group status for feature toggles
export const getGroupStatus = (toggle: FeatureToggle, group: string, landscapeGroups: Record<string, Landscape[]>) => {
  const groupLandscapes = landscapeGroups[group as keyof typeof landscapeGroups];
  const enabledCount = groupLandscapes.filter(l => toggle.landscapes[l.id]).length;
  const totalCount = groupLandscapes.length;

  if (enabledCount === 0) return { status: 'none', color: 'bg-muted' };
  if (enabledCount === totalCount) return { status: 'all', color: 'bg-success' };
  return { status: 'partial', color: 'bg-warning' };
};

// Log level helpers
export const getLogLevelColor = (level: string) => {
  switch (level) {
    case "ERROR": return "text-destructive";
    case "WARN": return "text-yellow-500";
    case "INFO": return "text-blue-500";
    case "DEBUG": return "text-purple-500";
    case "TRACE": return "text-green-500";
    default: return "text-muted-foreground";
  }
};

export const getLogLevelIcon = (level: string) => {
  switch (level) {
    case "ERROR": return "🔴";
    case "WARN": return "🟡";
    case "INFO": return "🔵";
    case "DEBUG": return "🟣";
    case "TRACE": return "🟢";
    default: return "⚪";
  }
};

// Component version helper
export const getDeployedVersion = (
  compId: string | null,
  landscape: string | null,
  componentVersions: Record<string, any[]>
): string | null => {
  if (!compId || !landscape) return null;
  const data = componentVersions[compId];
  const match = data?.find((d) => d.landscape === landscape);
  return match?.buildProperties?.version ?? null;
};

// Helper function to get base path from current path
export const getBasePath = (pathname: string): string | null => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  // Handle pages with tab support
  if (segments[0] === 'cis') return '/cis';
  if (segments[0] === 'cloud-automation') return '/cloud-automation';
  if (segments[0] === 'unified-services') return '/unified-services';
  if (segments[0] === 'teams') return '/teams';
  if (segments[0] === 'ai-arena') return '/ai-arena';

  return null;
}

// Helper function to determine if we should navigate to a tab route
export const shouldNavigateToTab = (basePath: string): boolean => {
  // Only navigate if we're on the base path or already on a tab path
  const currentPath = window.location.pathname;
  return currentPath === basePath || currentPath.startsWith(`${basePath}/`);
}

// Helper function to create URL-friendly team slugs
export const createTeamSlug = (teamName: string): string => {
  return teamName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Helper function to create team name from URL slug
export const getTeamNameFromSlug = (slug: string, teamNames: string[]): string | null => {
  // Find the team name that matches this slug
  return teamNames.find(teamName => createTeamSlug(teamName) === slug) || null;
}

// Validation helper functions
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const isValidUrl = (url: string): boolean => {
  if (!url.trim()) return true; 
  try {
    new URL(url.trim());
    return true;
  } catch {
    return false;
  }
};


// Helper functions for localStorage operations
export const safeLocalStorageGet = (key: string, fallback: any = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

export const safeLocalStorageSet = (key: string, value: any) => {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Silently fail if localStorage is not available
  }
};

// Helper function to generate stable IDs for team links
export const generateStableLinkId = (key: string, url: string, title: string): string => {
  const stableData = `${key}-${url}-${title}`;
  return `${key}-${btoa(stableData).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)}`;
};

// Helper function to build User object from auth data
export const buildUserFromAuthData = (userData: any): User => {
  const baseUser: User = {
    id: userData.profile.sub || userData.profile.id || userData.profile.login,
    name: userData.profile.name || userData.profile.displayName || userData.profile.login,
    email: userData.profile.email,
    picture: userData.profile.avatar_url || userData.profile.picture,
    provider: 'githubtools',
    memberId: userData.profile.memberId
  };
  return baseUser;
};

// Color mapping for dynamic Tailwind classes
export const getCategoryBgColor = (colorClass: string): string => {
  const colorMap: Record<string, string> = {
    'bg-blue-500': 'bg-blue-500',
    'bg-red-500': 'bg-red-500',
    'bg-green-500': 'bg-green-500',
    'bg-purple-500': 'bg-purple-500',
    'bg-amber-500': 'bg-amber-500',
    'bg-indigo-500': 'bg-indigo-500',
    'bg-cyan-500': 'bg-cyan-500',
    'bg-emerald-500': 'bg-emerald-500',
    'bg-orange-500': 'bg-orange-500',
  };
  return colorMap[colorClass] || 'bg-gray-500';
};
