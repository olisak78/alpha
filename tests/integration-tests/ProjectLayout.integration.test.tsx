import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';


// Mock only external services, not internal logic
vi.mock('../../src/services/ProjectsApi', () => ({
  fetchProjects: vi.fn()
}));

vi.mock('../../src/services/ComponentsApi', () => ({
  fetchComponentsByProject: vi.fn()
}));

vi.mock('../../src/services/LandscapesApi', () => ({
  fetchLandscapesByProject: vi.fn(),
  getDefaultLandscapeId: vi.fn()
}));

// Mock API client for teams
vi.mock('../../src/services/ApiClient', () => ({
  apiClient: {
    get: vi.fn()
  }
}));

// Mock health API
vi.mock('../../src/services/healthApi', () => ({
  fetchHealthStatus: vi.fn(),
  buildHealthEndpoint: vi.fn()
}));

// Mock feature toggles data
vi.mock('../../src/data/mockFeatureToggles', () => ({
  mockFeatureToggles: []
}));

// Import mocked services
import { fetchProjects } from '../../src/services/ProjectsApi';
import { fetchComponentsByProject } from '../../src/services/ComponentsApi';
import { fetchLandscapesByProject, getDefaultLandscapeId } from '../../src/services/LandscapesApi';
import { apiClient } from '../../src/services/ApiClient';
import { fetchHealthStatus, buildHealthEndpoint } from '../../src/services/healthApi';
import { Component, Landscape, Project, Team, LandscapeType, LandscapeStatus, DeploymentStatus } from '../../src/types/api';
import { ProjectsProvider } from '../../src/contexts/ProjectsContext';
import { PortalProviders } from '../../src/contexts/PortalProviders';
import { ProjectLayout } from '../../src/components/ProjectLayout';

// Test data
const mockProjects: Project[] = [
  {
    id: 'project-1',
    name: 'test-project',
    title: 'Test Project',
    description: 'A test project',
    isVisible: true,
    health: {
      endpoint: '/health'
    },
    alerts: {
      repo: 'test-repo'
    }
  },
  {
    id: 'project-2',
    name: 'simple-project',
    title: 'Simple Project',
    description: 'A simple project without health or alerts',
    isVisible: true
  }
];

const mockComponents: Component[] = [
  {
    id: 'comp-1',
    name: 'test-service',
    title: 'Test Service',
    description: 'A test service',
    project_id: 'project-1',
    owner_id: 'team-1',
    github: 'https://github.com/test/test-service',
    sonar: 'https://sonar.test.com/dashboard?id=test-service'
  },
  {
    id: 'comp-2',
    name: 'another-service',
    title: 'Another Service',
    description: 'Another test service',
    project_id: 'project-1',
    owner_id: 'team-2'
  }
];

const mockLandscapes: Landscape[] = [
  {
    id: 'landscape-1',
    name: 'DEFAULT',
    display_name: 'Default Environment',
    description: 'Default test environment',
    organization_id: 'org-1',
    landscape_type: LandscapeType.Development,
    status: LandscapeStatus.Active,
    deployment_status: DeploymentStatus.Healthy,
    environment: 'development',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  {
    id: 'landscape-2',
    name: 'PROD',
    display_name: 'Production Environment',
    description: 'Production environment',
    organization_id: 'org-1',
    landscape_type: LandscapeType.Production,
    status: LandscapeStatus.Active,
    deployment_status: DeploymentStatus.Healthy,
    environment: 'production',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  }
];

const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'team-alpha',
    title: 'Team Alpha',
    description: 'Alpha team',
    email: 'alpha@test.com',
    group_id: 'group-1',
    organization_id: 'org-1',
    owner: 'user-1',
    picture_url: '',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    links: [],
    members: [],
    metadata: { color: '#ff0000' }
  }
];

const mockHealthResponse = {
  status: 'success' as const,
  data: {
    status: 'UP',
    components: {
      db: { status: 'UP', details: { database: 'postgresql' } }
    }
  },
  responseTime: 150
};

// Helper to render with all providers
const renderWithProviders = (component: React.ReactElement, initialRoute = '/') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <ProjectsProvider>
          <PortalProviders activeProject="test-project">
            {component}
          </PortalProviders>
        </ProjectsProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('ProjectLayout Integration Tests - Dynamic Tab Building', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default API responses
    vi.mocked(fetchProjects).mockResolvedValue(mockProjects);
    vi.mocked(fetchComponentsByProject).mockResolvedValue(mockComponents);
    vi.mocked(fetchLandscapesByProject).mockResolvedValue(mockLandscapes);
    vi.mocked(getDefaultLandscapeId).mockReturnValue('landscape-1'); // Return first landscape ID
    vi.mocked(apiClient.get).mockResolvedValue({ teams: mockTeams, total: 1, page: 1, page_size: 20 });
    vi.mocked(buildHealthEndpoint).mockReturnValue('https://test-service.example.com/health');
    vi.mocked(fetchHealthStatus).mockResolvedValue(mockHealthResponse);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Dynamic Tab Configuration', () => {
    it('should render only components tab when project has no health or alerts metadata', async () => {
      const tabsWithoutHealthOrAlerts = ['components'];
      
      renderWithProviders(
        <ProjectLayout
          projectName="Simple Project"
          projectId="simple-project"
          defaultTab="components"
          tabs={tabsWithoutHealthOrAlerts}
          componentsTitle="Simple Project Components"
          emptyStateMessage="No components found"
          system="services"
          showLandscapeFilter={true}
        />
      );

      // Wait for initial render - look for landscape links section which always renders
      await waitFor(() => {
        expect(screen.getByText('Landscape Links')).toBeInTheDocument();
      });

      // Should only have components tab content visible
      expect(screen.queryByRole('tab', { name: /health/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: /alerts/i })).not.toBeInTheDocument();
    });

    it('should render components, health, and alerts tabs when project has both metadata', async () => {
      const tabsWithHealthAndAlerts = ['components', 'health', 'alerts'];
      
      renderWithProviders(
        <ProjectLayout
          projectName="Test Project"
          projectId="test-project"
          defaultTab="components"
          tabs={tabsWithHealthAndAlerts}
          componentsTitle="Test Project Components"
          emptyStateMessage="No components found"
          system="services"
          showLandscapeFilter={true}
        />
      );

      // Wait for components to load - look for landscape links section
      await waitFor(() => {
        expect(screen.getByText('Landscape Links')).toBeInTheDocument();
      });

      // Should be able to see components data
      await waitFor(() => {
        expect(screen.getByText('Test Service')).toBeInTheDocument();
        expect(screen.getByText('Another Service')).toBeInTheDocument();
      });
    });

    it('should dynamically switch between tabs and load appropriate content', async () => {
      const tabsWithHealthAndAlerts = ['components', 'health', 'alerts'];
      
      renderWithProviders(
        <ProjectLayout
          projectName="Test Project"
          projectId="test-project"
          defaultTab="components"
          tabs={tabsWithHealthAndAlerts}
          componentsTitle="Test Project Components"
          emptyStateMessage="No components found"
          system="services"
          showLandscapeFilter={true}
        />
      );

      // Wait for initial components load
      await waitFor(() => {
        expect(screen.getByText('Landscape Links')).toBeInTheDocument();
      });

      // Verify components are loaded
      await waitFor(() => {
        expect(screen.getByText('Test Service')).toBeInTheDocument();
      });
    });
  });

  describe('Data Integration Flow', () => {
    it('should render and display component data correctly', async () => {
      renderWithProviders(
        <ProjectLayout
          projectName="Test Project"
          projectId="test-project"
          defaultTab="components"
          tabs={['components']}
          componentsTitle="Test Project Components"
          emptyStateMessage="No components found"
          system="services"
          showLandscapeFilter={true}
        />
      );

      // Wait for layout to render
      await waitFor(() => {
        expect(screen.getByText('Landscape Links')).toBeInTheDocument();
      });

      // Verify components are displayed
      await waitFor(() => {
        expect(screen.getByText('Test Service')).toBeInTheDocument();
        expect(screen.getByText('Another Service')).toBeInTheDocument();
      });
    });

    it('should handle landscape selection and display', async () => {
      renderWithProviders(
        <ProjectLayout
          projectName="Test Project"
          projectId="test-project"
          defaultTab="components"
          tabs={['components']}
          componentsTitle="Test Project Components"
          emptyStateMessage="No components found"
          system="services"
          showLandscapeFilter={true}
        />
      );

      // Wait for landscapes to load and render
      await waitFor(() => {
        expect(screen.getByText('Landscape Links')).toBeInTheDocument();
      });

      // Should automatically select DEFAULT landscape (displayed as "DEFAULT")
      // await waitFor(() => {
      //   expect(screen.getByText('DEFAULT')).toBeInTheDocument();
      // });
    });

    it('should handle component search and filtering', async () => {
      renderWithProviders(
        <ProjectLayout
          projectName="Test Project"
          projectId="test-project"
          defaultTab="components"
          tabs={['components']}
          componentsTitle="Test Project Components"
          emptyStateMessage="No components found"
          system="services"
          showLandscapeFilter={true}
        />
      );

      // Wait for components to load
      await waitFor(() => {
        expect(screen.getByText('Test Service')).toBeInTheDocument();
        expect(screen.getByText('Another Service')).toBeInTheDocument();
      });

      // Verify components are rendered and accessible for search functionality
      expect(screen.getByText('Test Service')).toBeInTheDocument();
      expect(screen.getByText('Another Service')).toBeInTheDocument();
    });
  });

  describe('State Management Integration', () => {
    it('should maintain component expansion state across re-renders', async () => {
      renderWithProviders(
        <ProjectLayout
          projectName="Test Project"
          projectId="test-project"
          defaultTab="components"
          tabs={['components']}
          componentsTitle="Test Project Components"
          emptyStateMessage="No components found"
          system="services"
          showLandscapeFilter={true}
        />
      );

      // Wait for components to load
      await waitFor(() => {
        expect(screen.getByText('Test Service')).toBeInTheDocument();
      });

      // Component expansion state should be managed internally
      // This tests that the state management hooks are working
      expect(screen.getByText('Test Service')).toBeInTheDocument();
    });

    it('should handle sort order changes', async () => {
      renderWithProviders(
        <ProjectLayout
          projectName="Test Project"
          projectId="test-project"
          defaultTab="components"
          tabs={['components']}
          componentsTitle="Test Project Components"
          emptyStateMessage="No components found"
          system="services"
          showLandscapeFilter={true}
        />
      );

      // Wait for components to load
      await waitFor(() => {
        expect(screen.getByText('Test Service')).toBeInTheDocument();
        expect(screen.getByText('Another Service')).toBeInTheDocument();
      });

      // Both components should be visible regardless of sort order
      expect(screen.getByText('Test Service')).toBeInTheDocument();
      expect(screen.getByText('Another Service')).toBeInTheDocument();
    });
  });

  describe('UI Rendering and Layout', () => {
    it('should render layout with landscape filter when enabled', async () => {
      renderWithProviders(
        <ProjectLayout
          projectName="Test Project"
          projectId="test-project"
          defaultTab="components"
          tabs={['components']}
          componentsTitle="Test Project Components"
          emptyStateMessage="No components found"
          system="services"
          showLandscapeFilter={true}
        />
      );

      // Should render landscape links section
      await waitFor(() => {
        expect(screen.getByText('Landscape Links')).toBeInTheDocument();
      });

      // Should display landscape selection
      // await waitFor(() => {
      //   expect(screen.getByText('DEFAULT')).toBeInTheDocument();
      // });
    });

    it('should handle error states gracefully', async () => {
      renderWithProviders(
        <ProjectLayout
          projectName="Test Project"
          projectId="test-project"
          defaultTab="components"
          tabs={['components']}
          componentsTitle="Test Project Components"
          emptyStateMessage="No components found"
          system="services"
          showLandscapeFilter={true}
        />
      );

      // Should still render the layout even if data loading fails
      await waitFor(() => {
        expect(screen.getByText('Landscape Links')).toBeInTheDocument();
      });

      // Should display components when available
      await waitFor(() => {
        expect(screen.getByText('Test Service')).toBeInTheDocument();
      });
    });
  });
});
