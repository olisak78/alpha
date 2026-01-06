import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useParams } from 'react-router-dom';
import App from '@/App';

// Mock stores
vi.mock('@/stores/projectsStore', () => ({
  useProjects: vi.fn(),
  useProjectsLoading: vi.fn(),
  useProjectsError: vi.fn(),
}));

// Mock react-router-dom with useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
  };
});

// Mock hooks
vi.mock('@/hooks/useProjectSync', () => ({
  useProjectsSync: vi.fn(),
}));

// Mock providers
vi.mock('@/providers/QueryProvider', () => ({
  QueryProvider: vi.fn(({ children }) => <div data-testid="query-provider">{children}</div>),
}));

vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: vi.fn(({ children }) => <div data-testid="auth-provider">{children}</div>),
  useAuth: vi.fn(),
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(() => ({})),
  };
});

// Mock UI components
vi.mock('@/components/ui/toaster', () => ({
  Toaster: vi.fn(() => <div data-testid="toaster">Toaster</div>),
}));

vi.mock('@/components/ui/sonner', () => ({
  Toaster: vi.fn(() => <div data-testid="sonner">Sonner</div>),
}));

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: vi.fn(({ children }) => <div data-testid="tooltip-provider">{children}</div>),
}));

// Mock components
vi.mock('@/components/PortalContainer', async () => {
  const { Outlet } = await vi.importActual('react-router-dom');
  return {
    PortalContainer: vi.fn(() => (
      <div data-testid="portal-container">
        Portal Container
        <Outlet />
      </div>
    )),
  };
});

vi.mock('@/components/ProtectedRoute', () => ({
  default: vi.fn(({ children }) => <div data-testid="protected-route">{children}</div>),
}));

// Mock pages
vi.mock('@/pages/LoginPage', () => ({
  default: vi.fn(() => <div data-testid="login-page">Login Page</div>),
}));

vi.mock('@/pages/HomePage', () => ({
  default: vi.fn(() => <div data-testid="home-page">Home Page</div>),
}));

vi.mock('@/pages/TeamsPage', () => ({
  default: vi.fn(() => <div data-testid="teams-page">Teams Page</div>),
}));

vi.mock('@/pages/SelfServicePage', () => ({
  default: vi.fn(() => <div data-testid="self-service-page">Self Service Page</div>),
}));

vi.mock('@/pages/LinksPage', () => ({
  default: vi.fn(() => <div data-testid="links-page">Links Page</div>),
}));

vi.mock('@/pages/AIArenaPage', () => ({
  default: vi.fn(() => <div data-testid="ai-arena-page">AI Arena Page</div>),
}));

vi.mock('@/pages/DynamicProjectPage', () => ({
  DynamicProjectPage: vi.fn(({ projectName }) => (
    <div data-testid="dynamic-project-page">Dynamic Project: {projectName}</div>
  )),
}));

vi.mock('@/pages/ComponentViewPage', () => ({
  default: vi.fn(() => <div data-testid="component-view-page">Component View Page</div>),
}));

vi.mock('@/pages/PluginMarketplacePage', () => ({
  default: vi.fn(() => <div data-testid="plugin-marketplace-page">Plugin Marketplace Page</div>),
}));

vi.mock('@/pages/PluginViewPage', () => ({
  default: vi.fn(() => <div data-testid="plugin-view-page">Plugin View Page</div>),
}));

vi.mock('@/pages/NotFound', () => ({
  default: vi.fn(() => <div data-testid="not-found-page">Not Found</div>),
}));

import { useProjects, useProjectsLoading, useProjectsError } from '@/stores/projectsStore';
import { useProjectsSync } from '@/hooks/useProjectSync';

describe('App', () => {
  const mockProjects = [
    {
      id: 'proj-1',
      name: 'cis20',
      title: 'CIS 2.0',
      description: 'CIS Project',
    },
    {
      id: 'proj-2',
      name: 'platform',
      title: 'Platform Services',
      description: 'Platform Project',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useProjects).mockReturnValue(mockProjects);
    vi.mocked(useProjectsLoading).mockReturnValue(false);
    vi.mocked(useProjectsError).mockReturnValue(null);
    vi.mocked(useProjectsSync).mockReturnValue(undefined);
  });

  describe('Providers', () => {
    it('should render QueryProvider', () => {
      render(<App />);

      expect(screen.getByTestId('query-provider')).toBeInTheDocument();
    });

    it('should render AuthProvider inside QueryProvider', () => {
      render(<App />);

      expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
    });

    it('should render TooltipProvider', () => {
      render(<App />);

      expect(screen.getByTestId('tooltip-provider')).toBeInTheDocument();
    });

    it('should render Toaster', () => {
      render(<App />);

      expect(screen.getByTestId('toaster')).toBeInTheDocument();
    });

    it('should render Sonner', () => {
      render(<App />);

      expect(screen.getByTestId('sonner')).toBeInTheDocument();
    });
  });

  describe('Public Routes', () => {
    it('should render LoginPage at /login', () => {
      window.history.pushState({}, '', '/login');
      render(<App />);

      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    it('should redirect /me to /', async () => {
      window.history.pushState({}, '', '/me');
      render(<App />);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/');
      });
    });
  });

  describe('Protected Routes - Static Pages', () => {
    it('should render HomePage at root path', () => {
      window.history.pushState({}, '', '/');
      render(<App />);

      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });

    it('should render TeamsPage at /teams', () => {
      window.history.pushState({}, '', '/teams');
      render(<App />);

      expect(screen.getByTestId('teams-page')).toBeInTheDocument();
    });

    it('should render SelfServicePage at /self-service', () => {
      window.history.pushState({}, '', '/self-service');
      render(<App />);

      expect(screen.getByTestId('self-service-page')).toBeInTheDocument();
    });

    it('should render LinksPage at /links', () => {
      window.history.pushState({}, '', '/links');
      render(<App />);

      expect(screen.getByTestId('links-page')).toBeInTheDocument();
    });

    it('should render AIArenaPage at /ai-arena', () => {
      window.history.pushState({}, '', '/ai-arena');
      render(<App />);

      expect(screen.getByTestId('ai-arena-page')).toBeInTheDocument();
    });

    it('should render PluginMarketplacePage at /plugin-marketplace', () => {
      window.history.pushState({}, '', '/plugin-marketplace');
      render(<App />);

      expect(screen.getByTestId('plugin-marketplace-page')).toBeInTheDocument();
    });
  });

  describe('Protected Routes - With Params', () => {
    it('should render TeamsPage with team name param', () => {
      window.history.pushState({}, '', '/teams/team-alpha/overview');
      render(<App />);

      expect(screen.getByTestId('teams-page')).toBeInTheDocument();
    });

    it('should render AIArenaPage with tab param', () => {
      window.history.pushState({}, '', '/ai-arena/chat');
      render(<App />);

      expect(screen.getByTestId('ai-arena-page')).toBeInTheDocument();
    });

    it('should render PluginViewPage with plugin slug', () => {
      window.history.pushState({}, '', '/plugins/test-plugin');
      render(<App />);

      expect(screen.getByTestId('plugin-view-page')).toBeInTheDocument();
    });
  });

  describe('Dynamic Project Routes', () => {
   it('should render DynamicProjectPage for project index', () => {
  vi.mocked(useParams).mockReturnValue({ projectName: 'cis20' });

  window.history.pushState({}, '', '/cis20');
  render(<App />);

  expect(screen.getByTestId('dynamic-project-page')).toBeInTheDocument();
  expect(screen.getByText('Dynamic Project: cis20')).toBeInTheDocument();
});

   it('should render DynamicProjectPage with tab param', () => {
  vi.mocked(useParams).mockReturnValue({ 
    projectName: 'cis20',
    tabId: 'components'
  });

  window.history.pushState({}, '', '/cis20/components');
  render(<App />);

  expect(screen.getByTestId('dynamic-project-page')).toBeInTheDocument();
});

    it('should render ComponentViewPage for component route', () => {
  vi.mocked(useParams).mockReturnValue({ 
    projectName: 'cis20',
    componentName: 'api-service'
  });

  window.history.pushState({}, '', '/cis20/component/api-service');
  render(<App />);

  expect(screen.getByTestId('component-view-page')).toBeInTheDocument();
});

    it('should render ComponentViewPage with tab param', () => {
  vi.mocked(useParams).mockReturnValue({ 
    projectName: 'cis20',
    componentName: 'api-service',
    tabId: 'overview'
  });

  window.history.pushState({}, '', '/cis20/component/api-service/overview');
  render(<App />);

  expect(screen.getByTestId('component-view-page')).toBeInTheDocument();
});


  });

  describe('Dynamic Project Loading States', () => {
    it('should show loading state when projects are loading', () => {
      vi.mocked(useProjectsLoading).mockReturnValue(true);

      window.history.pushState({}, '', '/cis20');
      render(<App />);

      expect(screen.getByText('Loading project...')).toBeInTheDocument();
    });

    it('should show error state when projects fail to load', () => {
      vi.mocked(useProjectsError).mockReturnValue(new Error('Failed to load'));

      window.history.pushState({}, '', '/cis20');
      render(<App />);

      expect(screen.getByText('Error loading projects')).toBeInTheDocument();
    });

    it('should show not found when project does not exist', () => {
  vi.mocked(useProjects).mockReturnValue(mockProjects);
  vi.mocked(useParams).mockReturnValue({ projectName: 'nonexistent-project' });

  window.history.pushState({}, '', '/nonexistent-project');
  render(<App />);

  expect(screen.getByText(/project not found/i)).toBeInTheDocument();
});
  });

  describe('Component View Loading States', () => {
    it('should show loading state for component view when projects are loading', () => {
      vi.mocked(useProjectsLoading).mockReturnValue(true);

      window.history.pushState({}, '', '/cis20/component/api-service');
      render(<App />);

      expect(screen.getByText('Loading project...')).toBeInTheDocument();
    });

    it('should show error state for component view when projects fail to load', () => {
      vi.mocked(useProjectsError).mockReturnValue(new Error('Failed to load'));

      window.history.pushState({}, '', '/cis20/component/api-service');
      render(<App />);

      expect(screen.getByText('Error loading projects')).toBeInTheDocument();
    });

    it('should show not found for component view when project does not exist', () => {
  // Use a project name that exists in mockProjects to trigger the wrapper
  // but then verify it shows "Project not found" when project doesn't match
  vi.mocked(useProjects).mockReturnValue([]);
  
  vi.mocked(useParams).mockReturnValue({ 
    projectName: 'cis20',
    componentName: 'test'
  });

  window.history.pushState({}, '', '/cis20/component/test');
  render(<App />);

  expect(screen.getByText('Project not found')).toBeInTheDocument();
});
  });

  describe('404 Not Found', () => {
    it('should render NotFound for deeply nested unknown routes', () => {
  window.history.pushState({}, '', '/some/unknown/deep/route');
  render(<App />);

  expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
});

    it('should render NotFound for deeply nested unknown routes', () => {
      window.history.pushState({}, '', '/some/unknown/deep/route');
      render(<App />);

      expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
    });
  });

  describe('Protected Route Wrapper', () => {
    it('should wrap protected routes with ProtectedRoute component', () => {
      window.history.pushState({}, '', '/');
      render(<App />);

      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    });

    it('should render PortalContainer inside ProtectedRoute', () => {
      window.history.pushState({}, '', '/');
      render(<App />);

      expect(screen.getByTestId('portal-container')).toBeInTheDocument();
    });

    it('should not wrap login page with ProtectedRoute', () => {
      window.history.pushState({}, '', '/login');
      render(<App />);

      expect(screen.queryByTestId('portal-container')).not.toBeInTheDocument();
    });
  });

  describe('Hooks Integration', () => {
    it('should call useProjectsSync', () => {
      render(<App />);

      expect(useProjectsSync).toHaveBeenCalled();
    });

    it('should call useProjects in dynamic project wrapper', () => {
      window.history.pushState({}, '', '/cis20');
      render(<App />);

      expect(useProjects).toHaveBeenCalled();
    });

    it('should call useProjectsLoading in dynamic project wrapper', () => {
      window.history.pushState({}, '', '/cis20');
      render(<App />);

      expect(useProjectsLoading).toHaveBeenCalled();
    });

    it('should call useProjectsError in dynamic project wrapper', () => {
      window.history.pushState({}, '', '/cis20');
      render(<App />);

      expect(useProjectsError).toHaveBeenCalled();
    });
  });

  describe('Plugin View Key Prop', () => {
    it('should render PluginViewPage with key based on pathname', () => {
      window.history.pushState({}, '', '/plugins/plugin-1');
      const { rerender } = render(<App />);

      expect(screen.getByTestId('plugin-view-page')).toBeInTheDocument();

      // Navigate to different plugin
      window.history.pushState({}, '', '/plugins/plugin-2');
      rerender(<App />);

      // Should still render plugin view page
      expect(screen.getByTestId('plugin-view-page')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty projects array', () => {
      vi.mocked(useProjects).mockReturnValue([]);

      window.history.pushState({}, '', '/cis20');
      render(<App />);

      expect(screen.getByText('Project not found')).toBeInTheDocument();
    });


    it('should handle route with query parameters', () => {
      window.history.pushState({}, '', '/teams?tab=overview');
      render(<App />);

      expect(screen.getByTestId('teams-page')).toBeInTheDocument();
    });

    it('should handle route with hash', () => {
      window.history.pushState({}, '', '/links#section-1');
      render(<App />);

      expect(screen.getByTestId('links-page')).toBeInTheDocument();
    });

    it('should handle route with trailing slash', () => {
      window.history.pushState({}, '', '/teams/');
      render(<App />);

      expect(screen.getByTestId('teams-page')).toBeInTheDocument();
    });
  });

  describe('Route Nesting', () => {
    it('should render nested routes within PortalContainer', () => {
      window.history.pushState({}, '', '/');
      render(<App />);

      expect(screen.getByTestId('portal-container')).toBeInTheDocument();
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });

    it('should support multiple levels of nesting', () => {
      window.history.pushState({}, '', '/teams/team-alpha/overview');
      render(<App />);

      expect(screen.getByTestId('portal-container')).toBeInTheDocument();
      expect(screen.getByTestId('teams-page')).toBeInTheDocument();
    });

  });

  describe('Provider Hierarchy', () => {
    it('should have correct provider nesting order', () => {
      const { container } = render(<App />);

      // QueryProvider should be outermost
      const queryProvider = screen.getByTestId('query-provider');
      expect(queryProvider).toBeInTheDocument();

      // TooltipProvider should be inside
      const tooltipProvider = screen.getByTestId('tooltip-provider');
      expect(tooltipProvider).toBeInTheDocument();
      expect(queryProvider).toContainElement(tooltipProvider);

      // AuthProvider should be inside TooltipProvider
      const authProvider = screen.getByTestId('auth-provider');
      expect(authProvider).toBeInTheDocument();
      expect(tooltipProvider).toContainElement(authProvider);
    });
  });
});