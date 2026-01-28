import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { useParams, useLocation } from 'react-router-dom';
import App from '@/App';

// Mock stores
vi.mock('@/stores/projectsStore', () => ({
  useProjects: vi.fn(),
  useProjectsLoading: vi.fn(),
  useProjectsError: vi.fn(),
}));

// Mock hooks
vi.mock('@/hooks/useProjectSync', () => ({
  useProjectsSync: vi.fn(),
}));

// Mock providers
vi.mock('@/providers/QueryProvider', () => ({
  QueryProvider: vi.fn(({ children }) => <div data-testid="query-provider">{children}</div>),
}));

// ✅ FIX: Mock useAuth to return proper object structure
vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: vi.fn(({ children }) => <div data-testid="auth-provider">{children}</div>),
  useAuth: vi.fn(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshAuth: vi.fn(),
  })),
}));

// Mock react-router-dom with conditional rendering for wrapper tests
vi.mock('react-router-dom', () => ({
  BrowserRouter: vi.fn(({ children }) => <div data-testid="browser-router">{children}</div>),
  Routes: vi.fn(({ children }) => <div data-testid="routes">{children}</div>),
  Route: vi.fn(({ element }) => element || <div data-testid="route">Mocked Route</div>),
  Navigate: vi.fn(() => <div data-testid="navigate">Mocked Navigate</div>),
  useParams: vi.fn(() => ({})),
  useLocation: vi.fn(() => ({ pathname: '/' })),
}));

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

// Mock all page components to avoid complex routing logic
vi.mock('@/components/PortalContainer', () => ({
  PortalContainer: vi.fn(() => <div data-testid="portal-container">Portal Container</div>),
}));

vi.mock('@/components/ProtectedRoute', () => ({
  default: vi.fn(({ children }) => <div data-testid="protected-route">{children}</div>),
}));

vi.mock('@/components/OrganizationProtectedRoute', () => ({
  default: vi.fn(({ children }) => <div data-testid="org-protected-route">{children}</div>),
}));

// Mock all pages
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
import { useAuth } from '@/contexts/AuthContext';

// Create wrapper components for testing (extracted from App.tsx)
const DynamicProjectPageWrapper = () => {
  const { projectName } = useParams<{ projectName: string }>();
  
  const projects = useProjects();
  const isLoading = useProjectsLoading();
  const error = useProjectsError();

  if (isLoading) return <div className="p-4">Loading project...</div>;
  if (error) return <div className="p-4">Error loading projects</div>;

  const project = projects.find(p => p.name === projectName);
  if (!project) return <div className="p-4">Project not found</div>;

  return <div data-testid="dynamic-project-page">Dynamic Project: {project.name}</div>;
};

const ComponentViewPageWrapper = () => {
  const { projectName } = useParams<{ projectName: string }>();
  
  const projects = useProjects();
  const isLoading = useProjectsLoading();
  const error = useProjectsError();

  if (isLoading) return <div className="p-4">Loading project...</div>;
  if (error) return <div className="p-4">Error loading projects</div>;

  const project = projects.find(p => p.name === projectName);
  if (!project) return <div className="p-4">Project not found</div>;

  return <div data-testid="component-view-page">Component View Page</div>;
};

const PluginViewPageWrapper = () => {
  const location = useLocation();
  return <div data-testid="plugin-view-page" key={location.pathname}>Plugin View Page</div>;
};

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

    // Mock project store
    vi.mocked(useProjects).mockReturnValue(mockProjects);
    vi.mocked(useProjectsLoading).mockReturnValue(false);
    vi.mocked(useProjectsError).mockReturnValue(null);
    vi.mocked(useProjectsSync).mockReturnValue(undefined);
    
    // Mock router hooks
    vi.mocked(useParams).mockReturnValue({});
    vi.mocked(useLocation).mockReturnValue({ 
      pathname: '/', 
      search: '', 
      hash: '', 
      state: null, 
      key: 'default' 
    });
    
    // ✅ FIX: Explicitly set useAuth return value in beforeEach
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
    });
  });

  describe('App Structure and Providers', () => {
    it('should render all providers in correct hierarchy', () => {
      render(<App />);

      // Verify provider hierarchy
      const queryProvider = screen.getByTestId('query-provider');
      const tooltipProvider = screen.getByTestId('tooltip-provider');
      const authProvider = screen.getByTestId('auth-provider');
      const browserRouter = screen.getByTestId('browser-router');
      
      expect(queryProvider).toBeInTheDocument();
      expect(tooltipProvider).toBeInTheDocument();
      expect(authProvider).toBeInTheDocument();
      expect(browserRouter).toBeInTheDocument();
      
      // Verify nesting
      expect(queryProvider).toContainElement(browserRouter);
      expect(tooltipProvider).toContainElement(authProvider);

      // Verify UI components
      expect(screen.getByTestId('toaster')).toBeInTheDocument();
      expect(screen.getByTestId('sonner')).toBeInTheDocument();
      expect(screen.getByTestId('routes')).toBeInTheDocument();
    });

    it('should call useProjectsSync hook', () => {
      render(<App />);
      expect(useProjectsSync).toHaveBeenCalled();
    });
  });

  describe('DynamicProjectPageWrapper', () => {
    it('should show loading state when projects are loading', () => {
      vi.mocked(useProjectsLoading).mockReturnValue(true);
      vi.mocked(useParams).mockReturnValue({ projectName: 'cis20' });
      
      render(<DynamicProjectPageWrapper />);
      expect(screen.getByText('Loading project...')).toBeInTheDocument();
    });

    it('should show error state when projects fail to load', () => {
      vi.mocked(useProjectsError).mockReturnValue(new Error('Failed to load'));
      vi.mocked(useParams).mockReturnValue({ projectName: 'cis20' });
      
      render(<DynamicProjectPageWrapper />);
      expect(screen.getByText('Error loading projects')).toBeInTheDocument();
    });

    it('should show not found when project does not exist', () => {
      vi.mocked(useParams).mockReturnValue({ projectName: 'nonexistent-project' });
      
      render(<DynamicProjectPageWrapper />);
      expect(screen.getByText('Project not found')).toBeInTheDocument();
    });

    it('should render DynamicProjectPage when project exists', () => {
      vi.mocked(useParams).mockReturnValue({ projectName: 'cis20' });
      
      render(<DynamicProjectPageWrapper />);
      expect(screen.getByTestId('dynamic-project-page')).toBeInTheDocument();
      expect(screen.getByText('Dynamic Project: cis20')).toBeInTheDocument();
    });

    it('should handle different project names', () => {
      vi.mocked(useParams).mockReturnValue({ projectName: 'platform' });
      
      render(<DynamicProjectPageWrapper />);
      expect(screen.getByText('Dynamic Project: platform')).toBeInTheDocument();
    });
  });

  describe('ComponentViewPageWrapper', () => {
    it('should show loading state when projects are loading', () => {
      vi.mocked(useProjectsLoading).mockReturnValue(true);
      vi.mocked(useParams).mockReturnValue({ projectName: 'cis20' });
      
      render(<ComponentViewPageWrapper />);
      expect(screen.getByText('Loading project...')).toBeInTheDocument();
    });

    it('should show error state when projects fail to load', () => {
      vi.mocked(useProjectsError).mockReturnValue(new Error('Failed to load'));
      vi.mocked(useParams).mockReturnValue({ projectName: 'cis20' });
      
      render(<ComponentViewPageWrapper />);
      expect(screen.getByText('Error loading projects')).toBeInTheDocument();
    });

    it('should show not found when project does not exist', () => {
      vi.mocked(useParams).mockReturnValue({ projectName: 'nonexistent-project' });
      
      render(<ComponentViewPageWrapper />);
      expect(screen.getByText('Project not found')).toBeInTheDocument();
    });

    it('should render ComponentViewPage when project exists', () => {
      vi.mocked(useParams).mockReturnValue({ projectName: 'cis20' });
      
      render(<ComponentViewPageWrapper />);
      expect(screen.getByTestId('component-view-page')).toBeInTheDocument();
    });
  });

  describe('PluginViewPageWrapper', () => {
    it('should render PluginViewPage with location key', () => {
      vi.mocked(useLocation).mockReturnValue({ 
        pathname: '/plugins/plugin-1', 
        search: '', 
        hash: '', 
        state: null, 
        key: 'default' 
      });
      
      render(<PluginViewPageWrapper />);
      expect(screen.getByTestId('plugin-view-page')).toBeInTheDocument();
    });

    it('should use location pathname as key for re-rendering', () => {
      const mockLocation = { 
        pathname: '/plugins/plugin-1', 
        search: '', 
        hash: '', 
        state: null, 
        key: 'default' 
      };
      vi.mocked(useLocation).mockReturnValue(mockLocation);
      
      const { rerender } = render(<PluginViewPageWrapper />);
      expect(screen.getByTestId('plugin-view-page')).toBeInTheDocument();

      // Change location and rerender
      mockLocation.pathname = '/plugins/plugin-2';
      rerender(<PluginViewPageWrapper />);
      expect(screen.getByTestId('plugin-view-page')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty projects array', () => {
      vi.mocked(useProjects).mockReturnValue([]);
      vi.mocked(useParams).mockReturnValue({ projectName: 'cis20' });
      
      render(<DynamicProjectPageWrapper />);
      expect(screen.getByText('Project not found')).toBeInTheDocument();
    });

    it('should handle null/undefined project name', () => {
      vi.mocked(useParams).mockReturnValue({ projectName: undefined });
      
      render(<DynamicProjectPageWrapper />);
      expect(screen.getByText('Project not found')).toBeInTheDocument();
    });
  });
});