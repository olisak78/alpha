# Analytics Events Tracking Guide

Complete guide for tracking user interactions and events in the Developer Portal using Umami analytics.

## Table of Contents

1. [Overview](#overview)
2. [Event Naming Conventions](#event-naming-conventions)
3. [Automatic Events](#automatic-events)
4. [User Authentication Events](#user-authentication-events)
5. [Navigation Events](#navigation-events)
6. [Team Management Events](#team-management-events)
7. [Component Management Events](#component-management-events)
8. [Plugin System Events](#plugin-system-events)
9. [Links & Quick Links Events](#links--quick-links-events)
10. [Search & Filter Events](#search--filter-events)
11. [AI Arena Events](#ai-arena-events)
12. [Documentation Events](#documentation-events)
13. [Self-Service Events](#self-service-events)
14. [Job Management Events](#job-management-events)
15. [Landscape & Environment Events](#landscape--environment-events)
16. [Settings & Preferences Events](#settings--preferences-events)
17. [Error Tracking Events](#error-tracking-events)
18. [Performance Monitoring Events](#performance-monitoring-events)
19. [Integration Events](#integration-events)
20. [Implementation Examples](#implementation-examples)

---

## Overview

This guide provides a comprehensive catalog of all analytics events that should be tracked in the Developer Portal. Each event follows a consistent structure and naming convention to ensure data quality and ease of analysis.

**📍 File Locations**: Throughout this guide, specific file paths are provided for each event, showing you exactly where in your codebase to add the tracking code. These paths correspond to your actual project structure in the Developer Portal repository.

### Payload Structure

All events use the following payload structure:

```typescript
{
  type: 'event',
  payload: {
    hostname: string,
    url: string,
    name: string,          // Event name (for custom events)
    data: {                // Event-specific data
      // Custom properties here
    }
  }
}
```

---

## Event Naming Conventions

### Rules

1. **Use snake_case**: All event names use lowercase with underscores
   - ✅ `team_created`, `plugin_installed`, `deploy_initiated`
   - ❌ `teamCreated`, `PluginInstalled`, `DEPLOY-INITIATED`

2. **Follow verb_noun pattern**: Action first, subject second
   - ✅ `create_team`, `view_component`, `deploy_service`
   - ❌ `team_create`, `component_view`, `service_deploy`

3. **Be specific and descriptive**
   - ✅ `deploy_to_production_clicked`, `team_member_added`
   - ❌ `button_clicked`, `user_action`

4. **Include outcome for critical operations**
   - ✅ `deployment_success`, `deployment_failed`
   - ❌ `deployment` (ambiguous)

5. **Group related events with prefixes**
   - Team events: `team_*`
   - Plugin events: `plugin_*`
   - Deploy events: `deploy_*`

---

## Automatic Events

These events are tracked automatically by the `AnalyticsTracker` component.

### Page View

**Event Type**: Automatic  
**Tracked By**: `AnalyticsTracker` component in App.tsx

```typescript
// Automatically tracked on every route change
// No manual implementation needed
```

**Payload**:
```typescript
{
  type: 'event',
  payload: {
    hostname: 'developer-portal.example.com',
    url: '/teams/platform-engineering',
    referrer: 'https://previous-page.com',
    screen: '1920x1080',
    language: 'en-US',
    title: 'Platform Engineering - Developer Portal'
  }
}
```

---

## User Authentication Events

Track user authentication and session management.

### 1. Login Success

**Event**: `login_success`  
**When**: User successfully logs in via GitHub Tools or GitHub WDF  
**File**: `src/services/authService.ts`

```typescript
import { trackEvent } from '@/utils/analytics';

// In src/services/authService.ts - createAuthService function
const createAuthService = (provider: AuthProvider) => {
  return async (options: AuthServiceOptions = {}): Promise<void> => {
    // ... popup handling code ...
    
    return new Promise<void>((resolve, reject) => {
      const checkClosed = setInterval(async () => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);

          try {
            await tokenManager.ensureValidToken(60);
            
            // ✅ Track successful login
            trackEvent('login_success', {
              provider,
              timestamp: new Date().toISOString(),
            });
            
            resolve();
          } catch (error) {
            reject(new Error(`Authentication failed for ${provider} after popup closed`));
          }
        }
      }, 1000);
      
      // ... message listener code ...
    });
  };
};
```

**Alternative Location**: `src/pages/LoginPage.tsx` - in `handleGithubToolsLogin` or `handleGithubWdfLogin`

```typescript
// In src/pages/LoginPage.tsx
const handleGithubToolsLogin = async () => {
  try {
    setGithubToolsLoading(true);
    setGithubToolsError(null);
    sessionStorage.removeItem('justLoggedOut');
    
    await authService({
      returnUrl: undefined,
      storeReturnUrl: false,
    });
    
    setGithubToolsAuthenticated(true);
    
    // ✅ Track successful login
    trackEvent('login_success', {
      provider: 'githubtools',
      timestamp: new Date().toISOString(),
    });
    
    await fetchUserOrganization();
  } catch (error) {
    // ... error handling
  } finally {
    setGithubToolsLoading(false);
  }
};
```

**Event Data**:
- `provider`: Authentication provider ('githubtools' | 'githubwdf')
- `timestamp`: ISO timestamp of login

---

### 2. Login Failed

**Event**: `login_failed`  
**When**: Login attempt fails  
**File**: `src/pages/LoginPage.tsx`

```typescript
import { trackEvent } from '@/utils/analytics';

// In src/pages/LoginPage.tsx - handleGithubToolsLogin or handleGithubWdfLogin
const handleGithubToolsLogin = async () => {
  try {
    setGithubToolsLoading(true);
    setGithubToolsError(null);
    sessionStorage.removeItem('justLoggedOut');
    
    await authService({
      returnUrl: undefined,
      storeReturnUrl: false,
    });
    
    setGithubToolsAuthenticated(true);
    await fetchUserOrganization();
  } catch (error) {
    console.error('SAP GitHub Tools login failed:', error);
    
    // ✅ Track failed login
    trackEvent('login_failed', {
      provider: 'githubtools',
      error: error instanceof Error ? error.message : 'Authentication failed',
      timestamp: new Date().toISOString(),
    });
    
    setGithubToolsError(error instanceof Error ? error.message : 'Authentication failed');
  } finally {
    setGithubToolsLoading(false);
  }
};

// Similar implementation for handleGithubWdfLogin
const handleGithubWdfLogin = async () => {
  try {
    // ... authentication logic ...
  } catch (error) {
    console.error('SAP GitHub WDF login failed:', error);
    
    // ✅ Track failed login
    trackEvent('login_failed', {
      provider: 'githubwdf',
      error: error instanceof Error ? error.message : 'Authentication failed',
      timestamp: new Date().toISOString(),
    });
    
    setGithubWdfError(error instanceof Error ? error.message : 'Authentication failed');
  }
};
```

**Event Data**:
- `provider`: Authentication provider ('githubtools' | 'githubwdf')
- `error`: Error message
- `timestamp`: ISO timestamp

---

### 3. Logout

**Event**: `user_logout`  
**When**: User logs out  
**File**: `src/services/authService.ts`

```typescript
import { trackEvent } from '@/utils/analytics';

// In src/services/authService.ts - logoutUser function
export const logoutUser = async (): Promise<void> => {
  try {
    // ✅ Track logout BEFORE clearing session
    trackEvent('user_logout', {
      timestamp: new Date().toISOString(),
    });
    
    await fetch(`${backendUrl}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    // Clear centralized token manager
    tokenManager.clearToken();

    // Clear session and authentication-related data
    try {
      sessionStorage.clear();
      
      const keysToRemove = [
        'quick-links',
        'auth-token',
        'user-data',
        'auth-state',
      ];

      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (err) {
          console.error(`Failed to remove localStorage key "${key}":`, err);
        }
      });
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }

    // Set flag to prevent auth check after redirect
    sessionStorage.setItem('justLoggedOut', 'true');

    // Redirect to login page
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout error:', error);
    tokenManager.clearToken();
    // ... error handling
  }
};
```

**Event Data**:
- `timestamp`: ISO timestamp of logout

---

### 4. Session Expired

**Event**: `session_expired`  
**When**: User session expires and they're redirected to login

```typescript
import { trackEvent } from '@/utils/analytics';

// In your auth error handler
const handleSessionExpiry = () => {
  trackEvent('session_expired', {
    lastPage: window.location.pathname,
    timestamp: new Date().toISOString(),
  });
};
```

**Event Data**:
- `lastPage`: Page where session expired
- `timestamp`: ISO timestamp

---

## Navigation Events

Track navigation patterns within the portal.

### 1. Project Changed

**Event**: `project_changed`  
**When**: User switches between projects in sidebar  
**File**: `src/components/PortalContainer.tsx`

```typescript
import { trackEvent } from '@/utils/analytics';

// In src/components/PortalContainer.tsx
export const PortalContainer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeProject, setActiveProject] = useState<string>("");

  const handleProjectChange = (project: string) => {
    // ✅ Track project change
    trackEvent('project_changed', {
      from: activeProject,
      to: project,
      timestamp: new Date().toISOString(),
    });

    // Handle pinned plugin navigation (format: "plugins/{slug}")
    if (project.startsWith('plugins/')) {
      navigate(`/${project}`);
      setActiveProject(`/${project}`);
      return;
    }

    // Handle regular project navigation
    const route = projectToRouteMap[project] || "/";
    navigate(route);
    setActiveProject(project);
  };

  return (
    <PortalProviders>
      <PortalContent
        activeProject={activeProject}
        projects={sidebarItems}
        onProjectChange={handleProjectChange}
      />
    </PortalProviders>
  );
};
```

**Event Data**:
- `from`: Previous project name
- `to`: New project name
- `timestamp`: ISO timestamp

---

### 2. Tab Changed

**Event**: `tab_changed`  
**When**: User switches tabs within a page

```typescript
import { trackEvent } from '@/utils/analytics';

// In any component with tabs
const handleTabChange = (newTab: string) => {
  trackEvent('tab_changed', {
    page: window.location.pathname,
    from: currentTab,
    to: newTab,
    timestamp: new Date().toISOString(),
  });
  
  setCurrentTab(newTab);
};
```

**Event Data**:
- `page`: Current page path
- `from`: Previous tab ID
- `to`: New tab ID
- `timestamp`: ISO timestamp

---

### 3. Breadcrumb Navigation

**Event**: `breadcrumb_clicked`  
**When**: User clicks a breadcrumb link

```typescript
import { trackEvent } from '@/utils/analytics';

// In BreadcrumbPage component
const handleBreadcrumbClick = (breadcrumbLabel: string, path: string) => {
  trackEvent('breadcrumb_clicked', {
    label: breadcrumbLabel,
    targetPath: path,
    currentPage: window.location.pathname,
  });
};
```

**Event Data**:
- `label`: Breadcrumb text
- `targetPath`: Navigation destination
- `currentPage`: Current page path

---

## Team Management Events

Track team-related operations.

### 1. Team Viewed

**Event**: `team_viewed`  
**When**: User views a team's detail page  
**File**: `src/pages/TeamsPage.tsx`

```typescript
import { trackComponentView } from '@/utils/analytics';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

// In src/pages/TeamsPage.tsx
const TeamsPage = () => {
  const { teamName } = useParams<{ teamName?: string }>();

  useEffect(() => {
    if (teamName) {
      trackComponentView('team_detail', {
        teamName,
        timestamp: new Date().toISOString(),
      });
    }
  }, [teamName]);

  return (
    <div>
      <TeamHeader />
      <TeamOverview />
      <TeamMembers />
      {/* Other team components */}
    </div>
  );
};

export default TeamsPage;
```

**Event Data**:
- `component`: 'team_detail'
- `teamName`: Name of the team
- `timestamp`: ISO timestamp

---

### 2. Team Created

**Event**: `team_created`  
**When**: New team is created  
**File**: Component using `useCreateTeam` hook from `src/hooks/api/mutations/useTeamMutations.ts`

```typescript
import { trackEvent } from '@/utils/analytics';
import { useCreateTeam } from '@/hooks/api/mutations/useTeamMutations';

// In any component that creates teams (e.g., CreateTeamDialog, TeamsPage, etc.)
const CreateTeamForm = () => {
  const createTeamMutation = useCreateTeam({
    onSuccess: (team, variables) => {
      // ✅ Track successful team creation
      trackEvent('team_created', {
        teamId: team.id,
        teamName: team.name,
        memberCount: variables.members?.length || 0,
        hasDescription: !!variables.description,
        timestamp: new Date().toISOString(),
      });
      
      toast.success('Team created successfully');
    },
  });

  const handleSubmit = async (teamData: CreateTeamRequest) => {
    createTeamMutation.mutate(teamData);
  };

  return <form onSubmit={handleSubmit}>...</form>;
};
```

**Event Data**:
- `teamId`: ID of created team
- `teamName`: Name of team
- `memberCount`: Number of initial members
- `hasDescription`: Whether description was provided
- `timestamp`: ISO timestamp

---

### 3. Team Updated

**Event**: `team_updated`  
**When**: Team information is updated

```typescript
import { trackEvent } from '@/utils/analytics';

const updateTeamMutation = useMutation({
  mutationFn: async (data: UpdateTeamInput) => {
    const updatedTeam = await apiClient.put(`/teams/${data.teamId}`, data);
    
    trackEvent('team_updated', {
      teamId: data.teamId,
      teamName: updatedTeam.name,
      fieldsUpdated: Object.keys(data.changes),
      timestamp: new Date().toISOString(),
    });
    
    return updatedTeam;
  },
});
```

**Event Data**:
- `teamId`: ID of team
- `teamName`: Team name
- `fieldsUpdated`: Array of field names that were changed
- `timestamp`: ISO timestamp

---

### 4. Team Member Added

**Event**: `team_member_added`  
**When**: New member is added to a team

```typescript
import { trackEvent } from '@/utils/analytics';

const handleAddMember = async (teamId: string, memberData: MemberInput) => {
  const member = await apiClient.post(`/teams/${teamId}/members`, memberData);
  
  trackEvent('team_member_added', {
    teamId,
    memberId: member.id,
    memberRole: memberData.role,
    timestamp: new Date().toISOString(),
  });
  
  return member;
};
```

**Event Data**:
- `teamId`: Team ID
- `memberId`: New member ID
- `memberRole`: Member's role
- `timestamp`: ISO timestamp

---

### 5. Team Member Removed

**Event**: `team_member_removed`  
**When**: Member is removed from a team

```typescript
import { trackEvent } from '@/utils/analytics';

const handleRemoveMember = async (teamId: string, memberId: string) => {
  await apiClient.delete(`/teams/${teamId}/members/${memberId}`);
  
  trackEvent('team_member_removed', {
    teamId,
    memberId,
    timestamp: new Date().toISOString(),
  });
};
```

**Event Data**:
- `teamId`: Team ID
- `memberId`: Removed member ID
- `timestamp`: ISO timestamp

---

### 6. Team Deleted

**Event**: `team_deleted`  
**When**: Team is deleted

```typescript
import { trackEvent } from '@/utils/analytics';

const deleteTeamMutation = useMutation({
  mutationFn: async (teamId: string) => {
    trackEvent('team_deleted', {
      teamId,
      timestamp: new Date().toISOString(),
    });
    
    return await apiClient.delete(`/teams/${teamId}`);
  },
});
```

**Event Data**:
- `teamId`: ID of deleted team
- `timestamp`: ISO timestamp

---

## Component Management Events

Track component-related operations and deployments.

### 1. Component Viewed

**Event**: `component_viewed`  
**When**: User views a component's detail page  
**File**: `src/pages/ComponentViewPage.tsx`

```typescript
import { trackComponentView } from '@/utils/analytics';
import { useEffect } from 'react';

// In src/pages/ComponentViewPage.tsx
export function ComponentViewPage() {
  const params = useParams<{ projectName?: string; componentName?: string }>();
  
  useEffect(() => {
    if (params.componentName && params.projectName) {
      trackComponentView('component_detail', {
        componentName: params.componentName,
        projectName: params.projectName,
        timestamp: new Date().toISOString(),
      });
    }
  }, [params.componentName, params.projectName]);

  return (
    <div>
      <ComponentViewOverview />
      <ComponentViewApi />
      {/* Other component view tabs */}
    </div>
  );
}
```

**Event Data**:
- `component`: 'component_detail'
- `componentName`: Name of component
- `projectName`: Parent project
- `timestamp`: ISO timestamp

---

### 2. Component Health Check

**Event**: `component_health_checked`  
**When**: User manually triggers health check

```typescript
import { trackEvent } from '@/utils/analytics';

const handleHealthCheck = async (componentId: string, landscape: string) => {
  trackEvent('component_health_checked', {
    componentId,
    landscape,
    timestamp: new Date().toISOString(),
  });
  
  const health = await apiClient.get(`/components/${componentId}/health`, {
    params: { landscape },
  });
  
  return health;
};
```

**Event Data**:
- `componentId`: Component ID
- `landscape`: Target landscape
- `timestamp`: ISO timestamp

---

### 3. Deployment Initiated

**Event**: `deployment_initiated`  
**When**: User starts a deployment

```typescript
import { trackEvent } from '@/utils/analytics';

const handleDeploy = async (deploymentData: DeploymentInput) => {
  trackEvent('deployment_initiated', {
    componentId: deploymentData.componentId,
    componentName: deploymentData.componentName,
    environment: deploymentData.environment,
    landscape: deploymentData.landscape,
    deployType: deploymentData.deployType, // 'standard' | 'rollback' | 'hotfix'
    initiatedBy: user.id,
    timestamp: new Date().toISOString(),
  });
  
  // Start deployment
  const job = await startDeployment(deploymentData);
  return job;
};
```

**Event Data**:
- `componentId`: Component ID
- `componentName`: Component name
- `environment`: Target environment
- `landscape`: Target landscape
- `deployType`: Type of deployment
- `initiatedBy`: User ID
- `timestamp`: ISO timestamp

---

### 4. Deployment Success

**Event**: `deployment_success`  
**When**: Deployment completes successfully

```typescript
import { trackEvent } from '@/utils/analytics';

// In your deployment monitoring/polling logic
const handleDeploymentComplete = (deployment: Deployment) => {
  if (deployment.status === 'success') {
    trackEvent('deployment_success', {
      deploymentId: deployment.id,
      componentId: deployment.componentId,
      componentName: deployment.componentName,
      environment: deployment.environment,
      landscape: deployment.landscape,
      duration: deployment.duration, // in seconds
      timestamp: new Date().toISOString(),
    });
  }
};
```

**Event Data**:
- `deploymentId`: Deployment job ID
- `componentId`: Component ID
- `componentName`: Component name
- `environment`: Environment
- `landscape`: Landscape
- `duration`: Deployment duration in seconds
- `timestamp`: ISO timestamp

---

### 5. Deployment Failed

**Event**: `deployment_failed`  
**When**: Deployment fails

```typescript
import { trackEvent } from '@/utils/analytics';

const handleDeploymentFailure = (deployment: Deployment, error: string) => {
  trackEvent('deployment_failed', {
    deploymentId: deployment.id,
    componentId: deployment.componentId,
    componentName: deployment.componentName,
    environment: deployment.environment,
    landscape: deployment.landscape,
    error,
    duration: deployment.duration,
    timestamp: new Date().toISOString(),
  });
};
```

**Event Data**:
- `deploymentId`: Deployment job ID
- `componentId`: Component ID
- `componentName`: Component name
- `environment`: Environment
- `landscape`: Landscape
- `error`: Error message
- `duration`: Duration before failure
- `timestamp`: ISO timestamp

---

### 6. Component API Documentation Viewed

**Event**: `api_documentation_viewed`  
**When**: User views Swagger/API documentation for a component

```typescript
import { trackEvent } from '@/utils/analytics';
import { useEffect } from 'react';

// In ComponentViewApi.tsx
const ComponentViewApi = ({ componentName }: { componentName: string }) => {
  useEffect(() => {
    trackEvent('api_documentation_viewed', {
      componentName,
      landscape: selectedLandscape,
      timestamp: new Date().toISOString(),
    });
  }, [componentName, selectedLandscape]);

  return <SwaggerUI />;
};
```

**Event Data**:
- `componentName`: Component name
- `landscape`: Selected landscape
- `timestamp`: ISO timestamp

---

### 7. Component Logs Viewed

**Event**: `component_logs_viewed`  
**When**: User views component logs

```typescript
import { trackEvent } from '@/utils/analytics';

const handleViewLogs = (componentId: string, landscape: string, logType: string) => {
  trackEvent('component_logs_viewed', {
    componentId,
    landscape,
    logType, // 'application' | 'access' | 'error'
    timestamp: new Date().toISOString(),
  });
  
  // Open logs viewer
  openLogsViewer(componentId, landscape, logType);
};
```

**Event Data**:
- `componentId`: Component ID
- `landscape`: Landscape
- `logType`: Type of logs
- `timestamp`: ISO timestamp

---

### 8. Component Version Badge Clicked

**Event**: `version_badge_clicked`  
**When**: User clicks on a version badge to see details

```typescript
import { trackEvent } from '@/utils/analytics';

const handleVersionClick = (componentId: string, version: string) => {
  trackEvent('version_badge_clicked', {
    componentId,
    version,
    timestamp: new Date().toISOString(),
  });
};
```

**Event Data**:
- `componentId`: Component ID
- `version`: Version number
- `timestamp`: ISO timestamp

---

## Plugin System Events

Track plugin marketplace and plugin-related activities.

### 1. Plugin Marketplace Viewed

**Event**: `plugin_marketplace_viewed`  
**When**: User opens the plugin marketplace  
**File**: `src/pages/PluginMarketplacePage.tsx`

```typescript
import { trackComponentView } from '@/utils/analytics';
import { useEffect } from 'react';

// In src/pages/PluginMarketplacePage.tsx
const PluginMarketplacePage = () => {
  useEffect(() => {
    trackComponentView('plugin_marketplace', {
      timestamp: new Date().toISOString(),
    });
  }, []);

  return (
    <div>
      <PluginMarketplaceHeader />
      <PluginGrid />
      {/* Other marketplace components */}
    </div>
  );
};

export default PluginMarketplacePage;
```

**Event Data**:
- `component`: 'plugin_marketplace'
- `timestamp`: ISO timestamp

---

### 2. Plugin Viewed

**Event**: `plugin_viewed`  
**When**: User views plugin details  
**File**: `src/pages/PluginViewPage.tsx`

```typescript
import { trackComponentView } from '@/utils/analytics';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

// In src/pages/PluginViewPage.tsx
const PluginViewPage = ({ isSapCfs }: { isSapCfs: boolean }) => {
  const { pluginSlug } = useParams<{ pluginSlug: string }>();
  
  useEffect(() => {
    if (pluginSlug) {
      trackComponentView('plugin_detail', {
        pluginSlug,
        timestamp: new Date().toISOString(),
      });
    }
  }, [pluginSlug]);

  return (
    <div>
      <PluginHeader />
      <PluginDescription />
      <PluginInstallButton />
    </div>
  );
};

export default PluginViewPage;
```

**Event Data**:
- `component`: 'plugin_detail'
- `pluginSlug`: Plugin identifier
- `timestamp`: ISO timestamp

---

### 3. Plugin Installed

**Event**: `plugin_installed`  
**When**: User installs a plugin

```typescript
import { trackEvent } from '@/utils/analytics';

const handlePluginInstall = async (plugin: Plugin) => {
  try {
    await installPlugin(plugin.id);
    
    trackEvent('plugin_installed', {
      pluginId: plugin.id,
      pluginSlug: plugin.slug,
      pluginName: plugin.name,
      pluginVersion: plugin.version,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    trackEvent('plugin_install_failed', {
      pluginId: plugin.id,
      pluginSlug: plugin.slug,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};
```

**Event Data** (Success):
- `pluginId`: Plugin ID
- `pluginSlug`: Plugin slug
- `pluginName`: Plugin name
- `pluginVersion`: Plugin version
- `timestamp`: ISO timestamp

**Event Data** (Failure):
- `pluginId`: Plugin ID
- `pluginSlug`: Plugin slug
- `error`: Error message
- `timestamp`: ISO timestamp

---

### 4. Plugin Uninstalled

**Event**: `plugin_uninstalled`  
**When**: User uninstalls a plugin

```typescript
import { trackEvent } from '@/utils/analytics';

const handlePluginUninstall = async (pluginId: string) => {
  trackEvent('plugin_uninstalled', {
    pluginId,
    timestamp: new Date().toISOString(),
  });
  
  await uninstallPlugin(pluginId);
};
```

**Event Data**:
- `pluginId`: Plugin ID
- `timestamp`: ISO timestamp

---

### 5. Plugin Configured

**Event**: `plugin_configured`  
**When**: User updates plugin settings

```typescript
import { trackEvent } from '@/utils/analytics';

const handlePluginConfigure = async (pluginId: string, settings: any) => {
  await updatePluginSettings(pluginId, settings);
  
  trackEvent('plugin_configured', {
    pluginId,
    settingsChanged: Object.keys(settings),
    timestamp: new Date().toISOString(),
  });
};
```

**Event Data**:
- `pluginId`: Plugin ID
- `settingsChanged`: Array of setting keys that were changed
- `timestamp`: ISO timestamp

---

### 6. Plugin Search

**Event**: `plugin_searched`  
**When**: User searches for plugins in marketplace

```typescript
import { trackEvent } from '@/utils/analytics';
import { useMemo } from 'react';
import { debounce } from 'lodash';

// In PluginMarketplacePage
const debouncedTrackSearch = useMemo(
  () => debounce((query: string) => {
    if (query.length >= 3) { // Only track meaningful searches
      trackEvent('plugin_searched', {
        query,
        queryLength: query.length,
        timestamp: new Date().toISOString(),
      });
    }
  }, 1000), // Debounce for 1 second
  []
);

const handleSearchChange = (query: string) => {
  setSearchQuery(query);
  debouncedTrackSearch(query);
};
```

**Event Data**:
- `query`: Search query
- `queryLength`: Length of query
- `timestamp`: ISO timestamp

---

### 7. Plugin Filtered

**Event**: `plugin_filtered`  
**When**: User filters plugins by category/tag

```typescript
import { trackEvent } from '@/utils/analytics';

const handleFilterChange = (filterType: string, filterValue: string) => {
  trackEvent('plugin_filtered', {
    filterType, // 'category' | 'tag' | 'status'
    filterValue,
    timestamp: new Date().toISOString(),
  });
  
  applyFilter(filterType, filterValue);
};
```

**Event Data**:
- `filterType`: Type of filter applied
- `filterValue`: Filter value
- `timestamp`: ISO timestamp

---

## Links & Quick Links Events

Track link management and quick access features.

### 1. Quick Link Added

**Event**: `quick_link_added`  
**When**: User adds a new quick link

```typescript
import { trackEvent } from '@/utils/analytics';

const createLinkMutation = useMutation({
  mutationFn: async (linkData: CreateLinkInput) => {
    const link = await apiClient.post('/links', linkData);
    
    trackEvent('quick_link_added', {
      linkId: link.id,
      linkTitle: link.title,
      categoryId: linkData.categoryId,
      hasDescription: !!linkData.description,
      hasTags: linkData.tags && linkData.tags.length > 0,
      timestamp: new Date().toISOString(),
    });
    
    return link;
  },
});
```

**Event Data**:
- `linkId`: Link ID
- `linkTitle`: Link title
- `categoryId`: Category ID
- `hasDescription`: Whether description was provided
- `hasTags`: Whether tags were added
- `timestamp`: ISO timestamp

---

### 2. Quick Link Edited

**Event**: `quick_link_edited`  
**When**: User updates a quick link

```typescript
import { trackEvent } from '@/utils/analytics';

const updateLinkMutation = useMutation({
  mutationFn: async (data: UpdateLinkInput) => {
    const updatedLink = await apiClient.put(`/links/${data.linkId}`, data);
    
    trackEvent('quick_link_edited', {
      linkId: data.linkId,
      fieldsChanged: Object.keys(data.changes),
      timestamp: new Date().toISOString(),
    });
    
    return updatedLink;
  },
});
```

**Event Data**:
- `linkId`: Link ID
- `fieldsChanged`: Array of changed fields
- `timestamp`: ISO timestamp

---

### 3. Quick Link Deleted

**Event**: `quick_link_deleted`  
**When**: User deletes a quick link

```typescript
import { trackEvent } from '@/utils/analytics';

const deleteLinkMutation = useMutation({
  mutationFn: async (linkId: string) => {
    trackEvent('quick_link_deleted', {
      linkId,
      timestamp: new Date().toISOString(),
    });
    
    return await apiClient.delete(`/links/${linkId}`);
  },
});
```

**Event Data**:
- `linkId`: Link ID
- `timestamp`: ISO timestamp

---

### 4. Quick Link Clicked

**Event**: `quick_link_clicked`  
**When**: User clicks on a quick link

```typescript
import { trackEvent } from '@/utils/analytics';

const handleLinkClick = (link: QuickLink) => {
  trackEvent('quick_link_clicked', {
    linkId: link.id,
    linkTitle: link.title,
    categoryId: link.categoryId,
    url: link.url,
    timestamp: new Date().toISOString(),
  });
  
  // Open link
  window.open(link.url, '_blank');
};
```

**Event Data**:
- `linkId`: Link ID
- `linkTitle`: Link title
- `categoryId`: Category ID
- `url`: Link URL
- `timestamp`: ISO timestamp

---

### 5. Link Favorited

**Event**: `link_favorited`  
**When**: User marks a link as favorite

```typescript
import { trackEvent } from '@/utils/analytics';

const addFavoriteMutation = useMutation({
  mutationFn: async (linkId: string) => {
    await apiClient.post(`/links/${linkId}/favorite`);
    
    trackEvent('link_favorited', {
      linkId,
      timestamp: new Date().toISOString(),
    });
  },
});
```

**Event Data**:
- `linkId`: Link ID
- `timestamp`: ISO timestamp

---

### 6. Link Unfavorited

**Event**: `link_unfavorited`  
**When**: User removes a link from favorites

```typescript
import { trackEvent } from '@/utils/analytics';

const removeFavoriteMutation = useMutation({
  mutationFn: async (linkId: string) => {
    await apiClient.delete(`/links/${linkId}/favorite`);
    
    trackEvent('link_unfavorited', {
      linkId,
      timestamp: new Date().toISOString(),
    });
  },
});
```

**Event Data**:
- `linkId`: Link ID
- `timestamp`: ISO timestamp

---

### 7. Link View Mode Changed

**Event**: `link_view_mode_changed`  
**When**: User switches between grid/list view

```typescript
import { trackEvent } from '@/utils/analytics';

const handleViewModeChange = (newMode: 'grid' | 'list') => {
  trackEvent('link_view_mode_changed', {
    from: viewMode,
    to: newMode,
    page: window.location.pathname,
    timestamp: new Date().toISOString(),
  });
  
  setViewMode(newMode);
};
```

**Event Data**:
- `from`: Previous view mode
- `to`: New view mode
- `page`: Current page
- `timestamp`: ISO timestamp

---

## Search & Filter Events

Track search and filtering behavior.

### 1. Component Search

**Event**: `component_searched`  
**When**: User searches for components

```typescript
import { trackEvent } from '@/utils/analytics';
import { useMemo } from 'react';
import { debounce } from 'lodash';

const debouncedTrackSearch = useMemo(
  () => debounce((query: string) => {
    if (query.length >= 3) {
      trackEvent('component_searched', {
        query,
        queryLength: query.length,
        projectName: params.projectName,
        timestamp: new Date().toISOString(),
      });
    }
  }, 1000),
  []
);
```

**Event Data**:
- `query`: Search query
- `queryLength`: Length of query
- `projectName`: Current project context
- `timestamp`: ISO timestamp

---

### 2. Team Search

**Event**: `team_searched`  
**When**: User searches for teams

```typescript
import { trackEvent } from '@/utils/analytics';

const handleTeamSearch = debounce((query: string) => {
  if (query.length >= 3) {
    trackEvent('team_searched', {
      query,
      queryLength: query.length,
      timestamp: new Date().toISOString(),
    });
  }
}, 1000);
```

**Event Data**:
- `query`: Search query
- `queryLength`: Length of query
- `timestamp`: ISO timestamp

---

### 3. Filter Applied

**Event**: `filter_applied`  
**When**: User applies a filter

```typescript
import { trackEvent } from '@/utils/analytics';

const handleFilterApply = (filterType: string, filterValue: any) => {
  trackEvent('filter_applied', {
    filterType,
    filterValue: String(filterValue),
    page: window.location.pathname,
    timestamp: new Date().toISOString(),
  });
  
  applyFilter(filterType, filterValue);
};
```

**Event Data**:
- `filterType`: Type of filter
- `filterValue`: Filter value
- `page`: Current page
- `timestamp`: ISO timestamp

---

### 4. Sort Order Changed

**Event**: `sort_order_changed`  
**When**: User changes sort order

```typescript
import { trackEvent } from '@/utils/analytics';

const handleSortChange = (sortField: string, sortOrder: 'asc' | 'desc') => {
  trackEvent('sort_order_changed', {
    sortField,
    sortOrder,
    page: window.location.pathname,
    timestamp: new Date().toISOString(),
  });
  
  setSortField(sortField);
  setSortOrder(sortOrder);
};
```

**Event Data**:
- `sortField`: Field being sorted
- `sortOrder`: Sort direction
- `page`: Current page
- `timestamp`: ISO timestamp

---

## AI Arena Events

Track AI Arena interactions and usage.

### 1. AI Arena Opened

**Event**: `ai_arena_opened`  
**When**: User opens the AI Arena page  
**File**: `src/pages/AIArenaPage.tsx`

```typescript
import { trackComponentView } from '@/utils/analytics';
import { useEffect } from 'react';

// In src/pages/AIArenaPage.tsx
const AIArenaPage = () => {
  useEffect(() => {
    trackComponentView('ai_arena', {
      timestamp: new Date().toISOString(),
    });
  }, []);

  return (
    <div>
      <AIArenaHeader />
      <AIPromptInput />
      <AIResponseDisplay />
    </div>
  );
};

export default AIArenaPage;
```

**Event Data**:
- `component`: 'ai_arena'
- `timestamp`: ISO timestamp

---

### 2. AI Prompt Submitted

**Event**: `ai_prompt_submitted`  
**When**: User submits a prompt to AI

```typescript
import { trackEvent } from '@/utils/analytics';

const handlePromptSubmit = async (prompt: string, context: any) => {
  trackEvent('ai_prompt_submitted', {
    promptLength: prompt.length,
    hasContext: !!context,
    timestamp: new Date().toISOString(),
  });
  
  const response = await submitAIPrompt(prompt, context);
  return response;
};
```

**Event Data**:
- `promptLength`: Length of prompt
- `hasContext`: Whether additional context was provided
- `timestamp`: ISO timestamp

---

### 3. AI Response Received

**Event**: `ai_response_received`  
**When**: AI responds to user prompt

```typescript
import { trackEvent } from '@/utils/analytics';

const handleAIResponse = (response: AIResponse, duration: number) => {
  trackEvent('ai_response_received', {
    responseLength: response.text.length,
    duration, // in milliseconds
    successful: !response.error,
    timestamp: new Date().toISOString(),
  });
};
```

**Event Data**:
- `responseLength`: Length of AI response
- `duration`: Response time in milliseconds
- `successful`: Whether response was successful
- `timestamp`: ISO timestamp

---

### 4. AI Response Copied

**Event**: `ai_response_copied`  
**When**: User copies AI response to clipboard

```typescript
import { trackEvent } from '@/utils/analytics';

const handleCopyResponse = (responseId: string) => {
  trackEvent('ai_response_copied', {
    responseId,
    timestamp: new Date().toISOString(),
  });
  
  // Copy to clipboard
  navigator.clipboard.writeText(responseText);
};
```

**Event Data**:
- `responseId`: ID of the response
- `timestamp`: ISO timestamp

---

## Documentation Events

Track documentation access and engagement.

### 1. Documentation Page Viewed

**Event**: `documentation_viewed`  
**When**: User views a documentation page

```typescript
import { trackComponentView } from '@/utils/analytics';
import { useEffect } from 'react';

// In documentation viewer component
const DocumentationViewer = ({ docPath }: { docPath: string }) => {
  useEffect(() => {
    trackComponentView('documentation', {
      docPath,
      timestamp: new Date().toISOString(),
    });
  }, [docPath]);

  return <div>Documentation Content</div>;
};
```

**Event Data**:
- `component`: 'documentation'
- `docPath`: Path to document
- `timestamp`: ISO timestamp

---

### 2. Documentation Search

**Event**: `documentation_searched`  
**When**: User searches documentation

```typescript
import { trackEvent } from '@/utils/analytics';

const handleDocSearch = debounce((query: string) => {
  if (query.length >= 3) {
    trackEvent('documentation_searched', {
      query,
      queryLength: query.length,
      timestamp: new Date().toISOString(),
    });
  }
}, 1000);
```

**Event Data**:
- `query`: Search query
- `queryLength`: Length of query
- `timestamp`: ISO timestamp

---

### 3. Documentation Link Clicked

**Event**: `documentation_link_clicked`  
**When**: User clicks internal documentation link

```typescript
import { trackEvent } from '@/utils/analytics';

const handleDocLinkClick = (linkPath: string) => {
  trackEvent('documentation_link_clicked', {
    from: currentDocPath,
    to: linkPath,
    timestamp: new Date().toISOString(),
  });
};
```

**Event Data**:
- `from`: Current document path
- `to`: Target document path
- `timestamp`: ISO timestamp

---

## Self-Service Events

Track self-service portal usage.

### 1. Self-Service Page Viewed

**Event**: `self_service_viewed`  
**When**: User opens self-service page  
**File**: `src/pages/SelfServicePage.tsx`

```typescript
import { trackComponentView } from '@/utils/analytics';
import { useEffect } from 'react';

// In src/pages/SelfServicePage.tsx
const SelfServicePage = () => {
  useEffect(() => {
    trackComponentView('self_service', {
      timestamp: new Date().toISOString(),
    });
  }, []);

  return (
    <div>
      <SelfServiceHeader />
      <SelfServiceActions />
      <SelfServiceHistory />
    </div>
  );
};

export default SelfServicePage;
```

**Event Data**:
- `component`: 'self_service'
- `timestamp`: ISO timestamp

---

### 2. Self-Service Action Triggered

**Event**: `self_service_action_triggered`  
**When**: User initiates a self-service action

```typescript
import { trackEvent } from '@/utils/analytics';

const handleSelfServiceAction = (actionType: string, actionData: any) => {
  trackEvent('self_service_action_triggered', {
    actionType,
    hasParameters: Object.keys(actionData).length > 0,
    timestamp: new Date().toISOString(),
  });
  
  // Execute action
  executeSelfServiceAction(actionType, actionData);
};
```

**Event Data**:
- `actionType`: Type of action
- `hasParameters`: Whether parameters were provided
- `timestamp`: ISO timestamp

---

### 3. Self-Service Action Completed

**Event**: `self_service_action_completed`  
**When**: Self-service action completes

```typescript
import { trackEvent } from '@/utils/analytics';

const handleActionComplete = (actionId: string, duration: number, success: boolean) => {
  trackEvent('self_service_action_completed', {
    actionId,
    duration,
    success,
    timestamp: new Date().toISOString(),
  });
};
```

**Event Data**:
- `actionId`: Action ID
- `duration`: Duration in milliseconds
- `success`: Whether action succeeded
- `timestamp`: ISO timestamp

---

## Job Management Events

Track Jenkins job and CI/CD operations.

### 1. Job Triggered

**Event**: `job_triggered`  
**When**: User manually triggers a Jenkins job

```typescript
import { trackEvent } from '@/utils/analytics';

const handleJobTrigger = async (jobData: JobTriggerInput) => {
  trackEvent('job_triggered', {
    jobName: jobData.jobName,
    componentId: jobData.componentId,
    landscape: jobData.landscape,
    hasParameters: Object.keys(jobData.parameters || {}).length > 0,
    timestamp: new Date().toISOString(),
  });
  
  const job = await triggerJob(jobData);
  return job;
};
```

**Event Data**:
- `jobName`: Name of job
- `componentId`: Associated component
- `landscape`: Target landscape
- `hasParameters`: Whether parameters were provided
- `timestamp`: ISO timestamp

---

### 2. Job History Viewed

**Event**: `job_history_viewed`  
**When**: User views job history

```typescript
import { trackEvent } from '@/utils/analytics';

const handleViewJobHistory = (componentId: string, dateRange?: DateRange) => {
  trackEvent('job_history_viewed', {
    componentId,
    hasDateFilter: !!dateRange,
    timestamp: new Date().toISOString(),
  });
  
  // Load history
  loadJobHistory(componentId, dateRange);
};
```

**Event Data**:
- `componentId`: Component ID
- `hasDateFilter`: Whether date filter was applied
- `timestamp`: ISO timestamp

---

### 3. Job Logs Opened

**Event**: `job_logs_opened`  
**When**: User opens job execution logs

```typescript
import { trackEvent } from '@/utils/analytics';

const handleOpenJobLogs = (jobId: string, buildNumber: number) => {
  trackEvent('job_logs_opened', {
    jobId,
    buildNumber,
    timestamp: new Date().toISOString(),
  });
  
  // Open logs viewer
  openJobLogs(jobId, buildNumber);
};
```

**Event Data**:
- `jobId`: Job ID
- `buildNumber`: Build number
- `timestamp`: ISO timestamp

---

## Landscape & Environment Events

Track landscape switching and environment selection.

### 1. Landscape Changed

**Event**: `landscape_changed`  
**When**: User switches to a different landscape

```typescript
import { trackEvent } from '@/utils/analytics';

const handleLandscapeChange = (newLandscape: string) => {
  trackEvent('landscape_changed', {
    from: selectedLandscape,
    to: newLandscape,
    page: window.location.pathname,
    timestamp: new Date().toISOString(),
  });
  
  setSelectedLandscape(newLandscape);
};
```

**Event Data**:
- `from`: Previous landscape
- `to`: New landscape
- `page`: Current page
- `timestamp`: ISO timestamp

---

### 2. Environment Filter Applied

**Event**: `environment_filter_applied`  
**When**: User filters by environment

```typescript
import { trackEvent } from '@/utils/analytics';

const handleEnvironmentFilter = (environments: string[]) => {
  trackEvent('environment_filter_applied', {
    environments,
    count: environments.length,
    timestamp: new Date().toISOString(),
  });
  
  applyEnvironmentFilter(environments);
};
```

**Event Data**:
- `environments`: Array of selected environments
- `count`: Number of environments
- `timestamp`: ISO timestamp

---

## Settings & Preferences Events

Track user preferences and settings changes.

### 1. Theme Changed

**Event**: `theme_changed`  
**When**: User changes theme (light/dark/system)

```typescript
import { trackEvent } from '@/utils/analytics';

const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
  trackEvent('theme_changed', {
    from: currentTheme,
    to: newTheme,
    timestamp: new Date().toISOString(),
  });
  
  setTheme(newTheme);
};
```

**Event Data**:
- `from`: Previous theme
- `to`: New theme
- `timestamp`: ISO timestamp

---

### 2. User Preferences Updated

**Event**: `user_preferences_updated`  
**When**: User updates their preferences

```typescript
import { trackEvent } from '@/utils/analytics';

const handlePreferencesUpdate = (preferences: UserPreferences) => {
  trackEvent('user_preferences_updated', {
    settingsChanged: Object.keys(preferences),
    timestamp: new Date().toISOString(),
  });
  
  savePreferences(preferences);
};
```

**Event Data**:
- `settingsChanged`: Array of preference keys changed
- `timestamp`: ISO timestamp

---

### 3. Notification Settings Changed

**Event**: `notification_settings_changed`  
**When**: User updates notification preferences

```typescript
import { trackEvent } from '@/utils/analytics';

const handleNotificationSettingsChange = (settings: NotificationSettings) => {
  trackEvent('notification_settings_changed', {
    emailEnabled: settings.email,
    slackEnabled: settings.slack,
    timestamp: new Date().toISOString(),
  });
  
  updateNotificationSettings(settings);
};
```

**Event Data**:
- `emailEnabled`: Email notifications on/off
- `slackEnabled`: Slack notifications on/off
- `timestamp`: ISO timestamp

---

## Error Tracking Events

Track client-side errors for monitoring.

### 1. API Error

**Event**: `api_error`  
**When**: API request fails

```typescript
import { trackError } from '@/utils/analytics';

// In your API client error handler
const handleAPIError = (error: Error, endpoint: string, method: string) => {
  trackError(error, {
    errorType: 'api_error',
    endpoint,
    method,
    statusCode: error.status,
    timestamp: new Date().toISOString(),
  });
};
```

**Event Data**:
- `error`: Error message
- `stack`: Error stack trace (if available)
- `errorType`: 'api_error'
- `endpoint`: API endpoint
- `method`: HTTP method
- `statusCode`: HTTP status code
- `timestamp`: ISO timestamp

---

### 2. Component Error

**Event**: `component_error`  
**When**: React component encounters an error

```typescript
import { trackError } from '@/utils/analytics';
import { Component, ErrorInfo } from 'react';

class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    trackError(error, {
      errorType: 'component_error',
      componentStack: errorInfo.componentStack,
      page: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
  }
}
```

**Event Data**:
- `error`: Error message
- `stack`: Error stack trace
- `errorType`: 'component_error'
- `componentStack`: React component stack
- `page`: Current page
- `timestamp`: ISO timestamp

---

### 3. Network Error

**Event**: `network_error`  
**When**: Network request fails

```typescript
import { trackError } from '@/utils/analytics';

const handleNetworkError = (error: Error, url: string) => {
  trackError(error, {
    errorType: 'network_error',
    url,
    timestamp: new Date().toISOString(),
  });
};
```

**Event Data**:
- `error`: Error message
- `errorType`: 'network_error'
- `url`: URL that failed
- `timestamp`: ISO timestamp

---

### 4. Authentication Error

**Event**: `authentication_error`  
**When**: Authentication fails

```typescript
import { trackError } from '@/utils/analytics';

const handleAuthError = (error: Error, provider: string) => {
  trackError(error, {
    errorType: 'authentication_error',
    provider,
    timestamp: new Date().toISOString(),
  });
};
```

**Event Data**:
- `error`: Error message
- `errorType`: 'authentication_error'
- `provider`: Auth provider
- `timestamp`: ISO timestamp

---

## Performance Monitoring Events

Track performance metrics.

### 1. Page Load Performance

**Event**: `page_load_performance`  
**When**: Page finishes loading

```typescript
import { trackEvent } from '@/utils/analytics';
import { useEffect } from 'react';

// In your root component or App.tsx
useEffect(() => {
  // Wait for page to fully load
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (perfData) {
      trackEvent('page_load_performance', {
        page: window.location.pathname,
        loadTime: perfData.loadEventEnd - perfData.fetchStart,
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
        timestamp: new Date().toISOString(),
      });
    }
  });
}, []);
```

**Event Data**:
- `page`: Page path
- `loadTime`: Total load time in milliseconds
- `domContentLoaded`: DOM ready time in milliseconds
- `timestamp`: ISO timestamp

---

### 2. API Response Time

**Event**: `api_response_time`  
**When**: API request completes (optional, use sparingly)

```typescript
import { trackEvent } from '@/utils/analytics';

const measureAPIPerformance = async (endpoint: string) => {
  const startTime = performance.now();
  
  try {
    const response = await apiClient.get(endpoint);
    const endTime = performance.now();
    
    // Only track slow requests (>2 seconds)
    if (endTime - startTime > 2000) {
      trackEvent('api_response_time', {
        endpoint,
        duration: Math.round(endTime - startTime),
        slow: true,
        timestamp: new Date().toISOString(),
      });
    }
    
    return response;
  } catch (error) {
    const endTime = performance.now();
    
    trackEvent('api_response_time', {
      endpoint,
      duration: Math.round(endTime - startTime),
      failed: true,
      timestamp: new Date().toISOString(),
    });
    
    throw error;
  }
};
```

**Event Data**:
- `endpoint`: API endpoint
- `duration`: Duration in milliseconds
- `slow`: Whether request was slow
- `failed`: Whether request failed
- `timestamp`: ISO timestamp

---

## Integration Events

Track external integration usage.

### 1. GitHub Link Opened

**Event**: `github_link_opened`  
**When**: User opens GitHub repository

```typescript
import { trackEvent } from '@/utils/analytics';

const handleGitHubOpen = (componentId: string, repoUrl: string) => {
  trackEvent('github_link_opened', {
    componentId,
    repoUrl,
    timestamp: new Date().toISOString(),
  });
  
  window.open(repoUrl, '_blank');
};
```

**Event Data**:
- `componentId`: Component ID
- `repoUrl`: GitHub repository URL
- `timestamp`: ISO timestamp

---

### 2. SonarQube Link Opened

**Event**: `sonarqube_link_opened`  
**When**: User opens SonarQube analysis

```typescript
import { trackEvent } from '@/utils/analytics';

const handleSonarOpen = (componentId: string, sonarUrl: string) => {
  trackEvent('sonarqube_link_opened', {
    componentId,
    sonarUrl,
    timestamp: new Date().toISOString(),
  });
  
  window.open(sonarUrl, '_blank');
};
```

**Event Data**:
- `componentId`: Component ID
- `sonarUrl`: SonarQube URL
- `timestamp`: ISO timestamp

---

### 3. Dynatrace Link Opened

**Event**: `dynatrace_link_opened`  
**When**: User opens Dynatrace monitoring

```typescript
import { trackEvent } from '@/utils/analytics';

const handleDynatraceOpen = (componentId: string) => {
  trackEvent('dynatrace_link_opened', {
    componentId,
    landscape: selectedLandscape,
    timestamp: new Date().toISOString(),
  });
  
  openDynatraceMonitoring(componentId);
};
```

**Event Data**:
- `componentId`: Component ID
- `landscape`: Current landscape
- `timestamp`: ISO timestamp

---

### 4. Kibana Logs Opened

**Event**: `kibana_logs_opened`  
**When**: User opens Kibana logs

```typescript
import { trackEvent } from '@/utils/analytics';

const handleKibanaOpen = (componentId: string) => {
  trackEvent('kibana_logs_opened', {
    componentId,
    landscape: selectedLandscape,
    timestamp: new Date().toISOString(),
  });
  
  openKibanaLogs(componentId);
};
```

**Event Data**:
- `componentId`: Component ID
- `landscape`: Current landscape
- `timestamp`: ISO timestamp

---

## Implementation Examples

### Complete Component Example

Here's a complete example showing analytics integration in a component:

```typescript
import { useEffect, useMemo } from 'react';
import { trackEvent, trackComponentView, trackError } from '@/utils/analytics';
import { debounce } from 'lodash';

const TeamManagementPage = ({ teamId }: { teamId: string }) => {
  // Track component view on mount
  useEffect(() => {
    trackComponentView('team_management', {
      teamId,
      timestamp: new Date().toISOString(),
    });
  }, [teamId]);

  // Track search with debouncing
  const debouncedTrackSearch = useMemo(
    () => debounce((query: string) => {
      if (query.length >= 3) {
        trackEvent('team_member_searched', {
          query,
          queryLength: query.length,
          teamId,
          timestamp: new Date().toISOString(),
        });
      }
    }, 1000),
    [teamId]
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    debouncedTrackSearch(query);
  };

  // Track member addition
  const handleAddMember = async (memberData: MemberInput) => {
    try {
      const member = await addTeamMember(teamId, memberData);
      
      trackEvent('team_member_added', {
        teamId,
        memberId: member.id,
        memberRole: memberData.role,
        timestamp: new Date().toISOString(),
      });
      
      toast.success('Member added successfully');
    } catch (error) {
      trackError(error as Error, {
        operation: 'add_team_member',
        teamId,
        timestamp: new Date().toISOString(),
      });
      
      toast.error('Failed to add member');
    }
  };

  // Track filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    trackEvent('team_filter_applied', {
      filterType,
      filterValue: value,
      teamId,
      timestamp: new Date().toISOString(),
    });
    
    applyFilter(filterType, value);
  };

  return (
    <div>
      <SearchInput onChange={handleSearch} />
      <FilterDropdown onChange={handleFilterChange} />
      <AddMemberButton onClick={handleAddMember} />
    </div>
  );
};
```

---

### Complete Form Submission Example

```typescript
import { trackEvent, trackError } from '@/utils/analytics';
import { useForm } from 'react-hook-form';

const CreateTeamForm = () => {
  const { handleSubmit, formState } = useForm();

  const onSubmit = async (data: TeamFormData) => {
    // Track form submission start
    trackEvent('team_creation_submitted', {
      hasDescription: !!data.description,
      memberCount: data.members?.length || 0,
      hasLogo: !!data.logo,
      timestamp: new Date().toISOString(),
    });

    const startTime = performance.now();

    try {
      const team = await createTeam(data);
      const duration = performance.now() - startTime;

      // Track success
      trackEvent('team_created', {
        teamId: team.id,
        teamName: team.name,
        memberCount: data.members?.length || 0,
        duration: Math.round(duration),
        timestamp: new Date().toISOString(),
      });

      toast.success('Team created successfully');
      navigate(`/teams/${team.name}`);
    } catch (error) {
      const duration = performance.now() - startTime;

      // Track failure
      trackError(error as Error, {
        operation: 'create_team',
        duration: Math.round(duration),
        formData: {
          hasDescription: !!data.description,
          memberCount: data.members?.length || 0,
        },
        timestamp: new Date().toISOString(),
      });

      toast.error('Failed to create team');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
};
```

---

### Complete Deployment Flow Example

```typescript
import { trackEvent, trackError } from '@/utils/analytics';

const DeploymentButton = ({ component, environment }: Props) => {
  const handleDeploy = async () => {
    // Track deployment initiation
    trackEvent('deployment_initiated', {
      componentId: component.id,
      componentName: component.name,
      environment,
      landscape: selectedLandscape,
      initiatedBy: user.id,
      timestamp: new Date().toISOString(),
    });

    const startTime = Date.now();

    try {
      const job = await startDeployment({
        componentId: component.id,
        environment,
        landscape: selectedLandscape,
      });

      // Poll for deployment status
      const result = await pollDeploymentStatus(job.id);
      const duration = (Date.now() - startTime) / 1000; // Convert to seconds

      if (result.status === 'success') {
        // Track success
        trackEvent('deployment_success', {
          deploymentId: job.id,
          componentId: component.id,
          componentName: component.name,
          environment,
          landscape: selectedLandscape,
          duration,
          timestamp: new Date().toISOString(),
        });

        toast.success('Deployment completed successfully');
      } else {
        // Track failure
        trackEvent('deployment_failed', {
          deploymentId: job.id,
          componentId: component.id,
          componentName: component.name,
          environment,
          landscape: selectedLandscape,
          error: result.error,
          duration,
          timestamp: new Date().toISOString(),
        });

        toast.error(`Deployment failed: ${result.error}`);
      }
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;

      // Track error
      trackError(error as Error, {
        operation: 'deployment',
        componentId: component.id,
        environment,
        landscape: selectedLandscape,
        duration,
        timestamp: new Date().toISOString(),
      });

      toast.error('Deployment error occurred');
    }
  };

  return (
    <button onClick={handleDeploy}>
      Deploy to {environment}
    </button>
  );
};
```

---

## Best Practices Summary

### 1. Event Naming
- ✅ Use snake_case consistently
- ✅ Follow verb_noun pattern
- ✅ Be specific and descriptive
- ✅ Group related events with prefixes

### 2. Event Data
- ✅ Always include `timestamp`
- ✅ Include relevant context (IDs, names, states)
- ✅ Track both success and failure outcomes
- ❌ Never track sensitive data (passwords, tokens, PII)

### 3. Performance
- ✅ Debounce high-frequency events (search, input)
- ✅ Track errors in try-catch blocks
- ✅ Use `trackComponentView` for page/component views
- ❌ Don't track every single user interaction

### 4. Testing
- ✅ Analytics automatically disabled in test environment
- ✅ Check console for debug logs in development
- ✅ Verify events appear in Umami dashboard
- ✅ Test that analytics failures don't break app

### 5. Maintenance
- ✅ Document custom events in this guide
- ✅ Review analytics data regularly
- ✅ Remove unused events
- ✅ Keep event names consistent across features

---

## Summary

This guide covers **100+ event types** across all major features of the Developer Portal:

- ✅ Automatic page view tracking
- ✅ User authentication and sessions
- ✅ Navigation and UI interactions
- ✅ Team and component management
- ✅ Plugin system usage
- ✅ Links and quick access
- ✅ Search and filtering
- ✅ AI Arena interactions
- ✅ Documentation access
- ✅ Self-service actions
- ✅ Job management
- ✅ Settings and preferences
- ✅ Error tracking
- ✅ Performance monitoring
- ✅ External integrations

All events follow the correct payload structure and use the centralized `analytics.ts` utility for consistent, authenticated tracking through your backend proxy.