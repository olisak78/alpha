# Dynamic Project Loading Architecture

## Overview

The dynamic project loading system provides a flexible, metadata-driven approach to displaying project pages in the Developer Portal. This architecture allows projects to be configured dynamically based on their metadata without requiring code changes for each new project.

## Architecture Components

### 1. Core Components

#### `DynamicProjectPage.tsx`
The main entry point for dynamic project pages. Responsible for:
- Loading project data from API endpoint (`http://localhost:7008/api/v1/projects`)
- Generating dynamic configuration based on project metadata
- Rendering the `ProjectLayout` component with computed configuration

#### `ProjectLayout.tsx`
A flexible, reusable layout component that:
- Manages tab navigation and routing
- Handles landscape selection and filtering
- Renders different tab content based on configuration
- Integrates with various hooks for data management

### 2. Data Layer

#### Project Data Structure
**File: `src/types/api.ts`**
```typescript
interface Project {
  id: string; // UUID
  name: string;
  title: string;
  description: string;
  alerts?: {
    repo?: string;
  };
  health?: {
    endpoint?: string;
  };
}
```

#### Direct Property Configuration
Projects use direct properties to define their behavior instead of a generic metadata object:

**API Response from: `/projects`** (Example project structure)
```json
{
  "id": "uuid-here",
  "name": "cis20",
  "title": "CIS@2.0",
  "description": "Project description",
  "alerts": {
    "repo": "https://github.tools.sap/..."
  },
  "health": {
    "endpoint": "https://health-endpoint.com"
  }
}
```

### 3. Dynamic Configuration System

#### Tab Configuration
The system dynamically determines which tabs to display based on direct project properties:

**File: `src/pages/DynamicProjectPage.tsx`**
```typescript
const getProjectConfig = (project: Project) => {
  const tabs = ['components'];
  
  // Check direct properties for additional tabs
  if (project.health) {
    // Add health tab if health property exists
    tabs.push('health');
  }
  
  // Add alerts tab if alerts property exists
  if (project.alerts) {
    tabs.push('alerts');
  }

  const defaultConfig = {
    tabs: tabs,
    hiddenLandscapeButtons: getHiddenLandscapeButtons(project),
    system: project.name,
    showLandscapeFilter: true,
  };

  return defaultConfig;
};
```

### 4. API Integration

#### Projects API
**API Endpoint: `/projects`**
The system fetches project data from this REST API endpoint, which returns an array of Project objects with their metadata configurations.

#### Components API
**File: `src/components/ProjectLayout.tsx`**
```typescript
// Fetch components for a specific project
const { data: componentsData } = useComponentsByProject(projectId);
```

### 5. State Management

The system uses multiple context providers and hooks for state management:

#### Portal State Management
- `usePortalState()` - Manages landscape selection and UI state
- `useLandscapeManagement()` - Handles landscape filtering and grouping
- `useComponentManagement()` - Manages component filtering and search
- `useFeatureToggles()` - Controls feature toggle functionality

#### Tab Routing
- `useTabRouting()` - Synchronizes URL with active tab state
- `useHeaderNavigation()` - Manages header tab display and navigation

### 6. Tab System

#### Supported Tab Types
1. **Components Tab** - Default tab showing project components
2. **Health Tab** - Displays health dashboard (if metadata includes health config)
3. **Alerts Tab** - Shows alerts configuration (if metadata includes alerts config)

#### Tab Rendering Logic
**File: `src/components/ProjectLayout.tsx`**
```typescript
const renderGenericTabContent = () => {
  switch (activeTab) {
    case "components":
      return (
        <>
          <LandscapeLinksSection {...landscapeProps} />
          <ComponentsTabContent {...componentProps} />
        </>
      );
    case "health":
      return <HealthDashboard {...healthProps} />;
    case "alerts":
      return <AlertsPage {...alertsProps} />;
    default:
      return null;
  }
};
```

## Current Projects Configuration

### Project Examples

1. **NEO** (`neo`)
   - Basic configuration with components tab only
   - No additional metadata

2. **CIS@2.0** (`cis20`)
   - Components, Health, and Alerts tabs
   - Includes alerts repository configuration

3. **Cloud Automation** (`ca`)
   - Basic configuration with components tab only
   - No additional metadata

4. **Unified Services** (`usrv`)
   - Basic configuration with components tab only
   - No additional metadata

5. **Internal Projects** (`internal`)
   - Basic configuration with components tab only
   - No additional metadata

## Extension Points

### Adding New Tab Types
1. Add tab logic to `getProjectConfig()` function in `src/pages/DynamicProjectPage.tsx`
2. Add tab label mapping in `getTabLabel()` function in `src/components/ProjectLayout.tsx`
3. Add rendering case in `renderGenericTabContent()` switch statement in `src/components/ProjectLayout.tsx`
4. Create the corresponding React component

### Custom Project Behaviors
Projects can implement custom behaviors by:
1. Adding metadata fields to define the behavior via the API endpoint `http://localhost:7008/api/v1/projects`
2. Reading metadata in `getProjectConfig()` function in `src/pages/DynamicProjectPage.tsx` or component logic
3. Conditionally applying the behavior based on metadata values

## Benefits

1. **Flexibility** - New projects can be added without code changes
2. **Consistency** - All projects use the same layout and navigation patterns
3. **Maintainability** - Configuration is centralized and declarative
4. **Scalability** - Easy to add new features and tab types
5. **Type Safety** - Full TypeScript support with proper interfaces

## Future Enhancements

1. **Admin Interface** - UI for managing project configurations via the API
2. **Plugin System** - Allow projects to define custom tab components
3. **Validation** - Schema validation for project metadata
4. **Caching** - Implement intelligent caching for project configurations
5. **Permissions** - Role-based access control for project features
6. **Real-time Updates** - WebSocket integration for live project configuration updates

## Migration Guide

### From Static to Dynamic
When migrating existing static project pages:

1. Extract project-specific configuration into direct project properties
2. Replace static components with `DynamicProjectPage`
3. Update routing to use the dynamic system
4. Test tab functionality and landscape integration
5. Verify API integration works correctly
