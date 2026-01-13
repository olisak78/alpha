import { FeatureToggle, Landscape, User } from "@/types/developer-portal";
import { LANDSCAPE_GROUP_ORDER, projectComponents } from "@/constants/developer-portal";
import { UserMeResponse } from "@/types/api";

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
export const getBasePath = (projects: string[], pathname: string): string | null => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  // Handle pages with tab support
  if (segments[0] === 'teams') return '/teams';
  if (segments[0] === 'ai-arena') return '/ai-arena';

  // Handle component view pages - these should have their own tab management
  if (projects.includes(segments[0]) && segments[1] === 'component' && segments[2]) {
    return `/${segments[0]}/component/${segments[2]}`;
  }

  // Handle dynamic project pages
  if (projects.includes(segments[0])) {
    return `/${segments[0]}`;
  }

  return null;
}

// Helper function to determine if we should navigate to a tab route
export const shouldNavigateToTab = (basePath: string): boolean => {
  // Only navigate if we're on the base path or already on a tab path
  const currentPath = window.location.pathname;
  return currentPath === basePath || currentPath.startsWith(`${basePath}/`);
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


export const buildUserFromMe = (me: UserMeResponse): User => {
  const fullName = `${me.first_name || ''} ${me.last_name || ''}`.trim();
  const baseUser: User = {
    id: me.id || me.uuid,
    name: fullName || me.email,
    email: me.email,
    provider: 'githubtools',
    team_role: me.team_role,
    portal_admin: me.portal_admin,
  };
  return baseUser;
};

// Tailwind CSS safelist - ensures these color classes are not purged during build
// These classes are used dynamically in category data and need to be preserved.
// DO NOT REMOVE even though they appear unused.
const CATEGORY_COLOR_SAFELIST = [
  'bg-blue-500',
  'bg-red-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-indigo-500',
  'bg-cyan-500',
  'bg-emerald-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-orange-700'
];

// Helper function to sort landscape groups in the desired order
export const sortLandscapeGroups = (groups: Record<string, Landscape[]>): [string, Landscape[]][] => {
  const entries = Object.entries(groups);

  return entries.sort((a, b) => {
    const [groupA] = a;
    const [groupB] = b;

    // Special case: 'Frequently Visited' should always be first
    if (groupA === 'Frequently Visited') return -1;
    if (groupB === 'Frequently Visited') return 1;

    // Get the index in the desired order
    const indexA = LANDSCAPE_GROUP_ORDER.indexOf(groupA.toLowerCase());
    const indexB = LANDSCAPE_GROUP_ORDER.indexOf(groupB.toLowerCase());

    // If both are in the order array, sort by their position
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    // If only A is in the order array, it comes first
    if (indexA !== -1) return -1;

    // If only B is in the order array, it comes first
    if (indexB !== -1) return 1;

    // If neither is in the order array, sort alphabetically
    return groupA.localeCompare(groupB);
  });
};
