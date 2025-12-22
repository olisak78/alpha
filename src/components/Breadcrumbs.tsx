import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { VALID_COMMON_TABS } from '@/constants/developer-portal';
import { useTeams } from '@/hooks/api/useTeams';

interface BreadcrumbItem {
  label: string;
  path: string;
  isActive?: boolean;
}

interface RouteConfig {
  label: string;
  path: string;
  parent?: string;
}

// Route configuration - easily maintainable and extensible
const routeConfigs: RouteConfig[] = [
  { label: 'Home', path: '/' },
  { label: 'Teams', path: '/teams', parent: '/' },
  { label: 'CIS@2.0', path: '/cis', parent: '/' },
  { label: 'Component View', path: '/cis/component', parent: '/cis' },
  { label: 'Unified Services', path: '/unified-services', parent: '/' },
  { label: 'Component View', path: '/unified-services/component', parent: '/unified-services' },
  { label: 'Cloud Automation', path: '/cloud-automation', parent: '/' },
  { label: 'Component View', path: '/cloud-automation/component', parent: '/cloud-automation' },
  { label: 'Self Service', path: '/self-service', parent: '/' },
  { label: 'Backstage Services', path: '/backstage-services', parent: '/' },
  { label: 'AI Arena', path: '/ai-arena', parent: '/' },
];

// Create a map for quick lookups
const routeConfigMap = new Map<string, RouteConfig>();
routeConfigs.forEach(config => {
  routeConfigMap.set(config.path, config);
});

// Helper function to format entity names from URL segments
const formatEntityName = (entityName: string): string => {
  return entityName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper function to format tab names
const formatTabName = (tabName: string): string => {
  const tabLabels: Record<string, string> = {
    'overview': 'Overview',
    'api': 'API',
    'components': 'Components',
    'jira': 'Jira Issues',
    'schedule': 'On-Call Schedule'
  };

  return tabLabels[tabName] || formatEntityName(tabName);
};

// Helper function to create breadcrumb items - eliminates code duplication
const createBreadcrumbItem = (label: string, path: string, isActive: boolean): BreadcrumbItem => ({
  label,
  path,
  isActive
});

// Dynamic breadcrumb generation based on URL segments
const generateBreadcrumbs = (pathname: string, teamsData?: { teams: Array<{ id: string; name: string; title?: string }> }): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  if (segments.length === 0) {
    return breadcrumbs;
  }

  let currentPath = '';

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;
    const isLast = i === segments.length - 1;

    // Check if this is a configured route
    const routeConfig = routeConfigMap.get(currentPath);

    if (routeConfig) {
      // Use configured label for known routes
      breadcrumbs.push(createBreadcrumbItem(routeConfig.label, currentPath, isLast));
    } else {
      // Handle dynamic routes (like /cis/:entityName or /cis/component/:componentId)
      const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
      const parentConfig = routeConfigMap.get(parentPath);

      let label: string;

      if (parentConfig?.path === '/teams' && teamsData) {
        // This is a team name - look it up from API data
        const team = teamsData.teams.find(t => t.name === segment);
        if (team) {
          label = team.title || team.name;
        } else {
          // Fallback to formatted name if team not found
          label = formatEntityName(segment);
        }
      } else if (parentConfig && parentPath.endsWith('/component')) {
        // This is a component ID in /system/component/:componentId route
        label = formatEntityName(segment);
      } else if (parentConfig) {
        // This is likely a dynamic route parameter or tab
        if (segments[i - 2] === 'component' && ['overview', 'api'].includes(segment)) {
          // This is a tab in component view
          label = formatTabName(segment);
        } else {
          label = formatEntityName(segment);
        }
      } else if (segments[0] === 'teams' && i === 2 && VALID_COMMON_TABS.includes(segment)) {
        // Check if this is a team tab (third segment in teams route)
        label = formatTabName(segment);
      } else {
        // Fallback: use formatted segment name
        label = formatEntityName(segment);
      }

      breadcrumbs.push(createBreadcrumbItem(label, currentPath, isLast));
    }
  }

  return breadcrumbs;
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();

  // Fetch teams data for accurate team name display
  const { data: teamsResponse } = useTeams({
    page: 1,
    page_size: 100,
  });

  // Hide breadcrumbs on home page
  if (location.pathname === '/') {
    return null;
  }

  const breadcrumbs = generateBreadcrumbs(location.pathname, teamsResponse);
  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav aria-label="breadcrumb" className="flex items-center space-x-1 text-sm text-gray-300">
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((item, index) => (
          <li key={item.path} className="flex items-center">
            {index > 0 && (
              <ChevronRight
                className="h-3 w-3 text-muted-foreground dark:text-gray-400 mx-1"
                aria-hidden="true"
              />
            )}
            <span
              className={`flex items-center space-x-1 ${item.isActive
                  ? 'text-foreground dark:text-gray-100 font-medium'
                  : 'text-muted-foreground dark:text-gray-300'
                }`}
              aria-current={item.isActive ? 'page' : undefined}
              aria-label={item.isActive ? `Current page: ${item.label}` : item.label}
            >
              <span>{item.label}</span>
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
};

// Export utility functions for potential use elsewhere
export { generateBreadcrumbs, formatEntityName, routeConfigs };