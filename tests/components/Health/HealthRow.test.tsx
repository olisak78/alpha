import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HealthRow } from '../../../src/components/Health/HealthRow';
import { ComponentDisplayProvider } from '../../../src/contexts/ComponentDisplayContext';
import type { ComponentHealthCheck } from '../../../src/types/health';
import type { Component } from '../../../src/types/api';
import '@testing-library/jest-dom/vitest';

// Mock components
vi.mock('../../../src/components/ComponentCard/HealthStatusBadge', () => ({
  HealthStatusBadge: ({ component }: { component: Component }) => (
    <span data-testid="health-status-badge">{component.name}</span>
  ),
}));

vi.mock('../../../src/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <span data-testid="badge" className={className}>{children}</span>
  ),
}));

vi.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, onClick }: any) => (
    <button data-testid="button" onClick={onClick}>{children}</button>
  ),
}));

// Mock the fetchSystemInformation function
vi.mock('../../../src/services/healthApi', () => ({
  fetchSystemInformation: vi.fn().mockResolvedValue({ status: 'success', data: null }),
}));

// Mock QueryClient for HealthStatusBadge
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock ComponentDisplayProvider to use provided props directly
vi.mock('../../../src/contexts/ComponentDisplayContext', () => {
  const React = require('react');
  const ComponentDisplayContext = React.createContext(undefined);
  
  return {
    ComponentDisplayProvider: ({ children, ...props }: any) => {
      return React.createElement(ComponentDisplayContext.Provider, { value: props }, children);
    },
    useComponentDisplay: () => {
      const context = React.useContext(ComponentDisplayContext);
      return context;
    },
  };
});

describe('HealthRow', () => {
  const mockComponent: Component = {
    id: 'accounts-service',
    name: 'accounts-service',
    title: 'Accounts Service',
    description: 'Service for managing accounts',
    owner_id: 'owner-123',
    health: true,
  };

  const mockHealthCheck: ComponentHealthCheck = {
    componentId: 'accounts-service',
    componentName: 'Accounts Service',
    landscape: 'eu10-canary',
    healthUrl: 'https://accounts-service.cfapps.sap.hana.ondemand.com/health',
    status: 'UP',
    responseTime: 150,
    lastChecked: new Date('2023-12-01T10:00:00Z'),
  };

  const defaultProps = {
    healthCheck: mockHealthCheck,
    isExpanded: false,
    onToggle: vi.fn(),
    component: mockComponent,
  };

  const mockContextProps = {
    projectId: 'cis20',
    selectedLandscape: 'test-landscape',
    selectedLandscapeData: { id: 'test-id', name: 'Test', route: 'test.example.com' },
    isCentralLandscape: false,
    noCentralLandscapes: false,
    teamNamesMap: { 'owner-123': 'Team Alpha' },
    teamColorsMap: { 'owner-123': '#ff0000' },
    componentHealthMap: {},
    isLoadingHealth: false,
    componentSystemInfoMap: {},
    isLoadingSystemInfo: false,
    expandedComponents: {},
    onToggleExpanded: vi.fn(),
    system: 'test-system',
  };

  const renderWithProvider = (props = {}, contextOverrides = {}) => {
    const contextProps = { ...mockContextProps, ...contextOverrides };
    return render(
      <ComponentDisplayProvider {...contextProps}>
        <table>
          <tbody>
            <HealthRow {...defaultProps} {...props} />
          </tbody>
        </table>
      </ComponentDisplayProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render basic component information correctly', () => {
    renderWithProvider();

    // Component information
    expect(screen.getByText('Accounts Service')).toBeTruthy();
    expect(screen.getAllByText('accounts-service')).toHaveLength(2); // One in component ID, one in health badge
    expect(screen.getByTestId('health-status-badge')).toBeTruthy();
    
    // Response time formatting
    expect(screen.getByText('150ms')).toBeTruthy();
    
    // Team name display
    expect(screen.getByText('Team Alpha')).toBeTruthy();
  });

  it('should handle component click when status is UP', () => {
    const mockOnComponentClick = vi.fn();
    renderWithProvider({
      onComponentClick: mockOnComponentClick
    });

    const row = screen.getByRole('row');
    fireEvent.click(row);
    expect(mockOnComponentClick).toHaveBeenCalledWith('accounts-service');
  });

  it('should render external link buttons', () => {
    const componentWithLinks = {
      ...mockComponent,
      github: "https://github.com/example/repo",
      sonar: "https://sonar.example.com/project"
    };
    
    renderWithProvider({
      component: componentWithLinks
    });

    const buttons = screen.getAllByTestId('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should render central service badge when component is central service', () => {
    const centralServiceComponent = {
      ...mockComponent,
      'central-service': true
    };
    
    renderWithProvider({
      component: centralServiceComponent
    });

    expect(screen.getByText('Central Service')).toBeTruthy();
  });

  it('should apply disabled styling when component is disabled', () => {
    const centralServiceComponent = {
      ...mockComponent,
      'central-service': true
    };
    
    const contextWithNonCentralLandscape = {
      ...mockContextProps,
      isCentralLandscape: false,
      noCentralLandscapes: false
    };
    
    render(
      <ComponentDisplayProvider {...contextWithNonCentralLandscape}>
        <table>
          <tbody>
            <HealthRow {...defaultProps} component={centralServiceComponent} />
          </tbody>
        </table>
      </ComponentDisplayProvider>
    );

    const row = screen.getByRole('row');
    expect(row.className).toContain('opacity-50');
  });

  it('should not be clickable when status is DOWN', () => {
    const mockOnComponentClick = vi.fn();
    const downHealthCheck = { ...mockHealthCheck, status: 'DOWN' as const };
    const componentWithoutHealth = { ...mockComponent, health: false };
    
    renderWithProvider({
      healthCheck: downHealthCheck,
      component: componentWithoutHealth,
      onComponentClick: mockOnComponentClick
    });

    const row = screen.getByRole('row');
    expect(row.className).not.toContain('cursor-pointer');
  });

  it('should not render version badges when no system info is available', () => {
    renderWithProvider();

    // Should only have team badge, no version badges
    expect(screen.queryByText(/App:/)).toBeFalsy();
    expect(screen.queryByText(/UI5:/)).toBeFalsy();
    expect(screen.queryByText('Loading...')).toBeFalsy();
  });

  describe('versionBadges logic', () => {
    const renderWithSystemInfo = (systemInfo: any) => {
      const contextWithSystemInfo = {
        ...mockContextProps,
        componentSystemInfoMap: {
          'accounts-service': systemInfo
        },
        isLoadingSystemInfo: false
      };

      return render(
        <ComponentDisplayProvider {...contextWithSystemInfo}>
          <table>
            <tbody>
              <HealthRow {...defaultProps} />
            </tbody>
          </table>
        </ComponentDisplayProvider>
      );
    };

    it('should render version badges correctly for direct app/sapui5 properties', () => {
      const testCases = [
        {
          systemInfo: { app: '1.2.3', sapui5: '1.108.0' },
          expectedApp: 'App: 1.2.3',
          expectedUI5: 'UI5: 1.108.0',
          description: 'both app and UI5'
        },
        {
          systemInfo: { app: '2.0.1' },
          expectedApp: 'App: 2.0.1',
          expectedUI5: null,
          description: 'only app'
        },
        {
          systemInfo: { sapui5: '1.110.2' },
          expectedApp: null,
          expectedUI5: 'UI5: 1.110.2',
          description: 'only UI5'
        }
      ];

      testCases.forEach(({ systemInfo, expectedApp, expectedUI5, description }) => {
        const { unmount } = renderWithSystemInfo(systemInfo);

        if (expectedApp) {
          expect(screen.getByText(expectedApp)).toBeTruthy();
        } else {
          expect(screen.queryByText(/App:/)).toBeFalsy();
        }

        if (expectedUI5) {
          expect(screen.getByText(expectedUI5)).toBeTruthy();
        } else {
          expect(screen.queryByText(/UI5:/)).toBeFalsy();
        }

        unmount(); // Clean up for next iteration
      });
    });

    it('should render badges from buildProperties version correctly', () => {
      const testCases = [
        {
          version: { app: '3.1.0', sapui5: '1.112.0' },
          expectedApp: 'App: 3.1.0',
          expectedUI5: 'UI5: 1.112.0',
          description: 'both app and UI5 from object'
        },
        {
          version: { app: '4.0.0' },
          expectedApp: 'App: 4.0.0',
          expectedUI5: null,
          description: 'only app from object'
        },
        {
          version: '5.2.1-SNAPSHOT',
          expectedApp: null,
          expectedUI5: null,
          expectedString: '5.2.1-SNAPSHOT',
          description: 'string version'
        }
      ];

      testCases.forEach(({ version, expectedApp, expectedUI5, expectedString, description }) => {
        const { unmount } = renderWithSystemInfo({
          buildProperties: { version }
        });

        if (expectedString) {
          expect(screen.getByText(expectedString)).toBeTruthy();
          expect(screen.queryByText(/App:/)).toBeFalsy();
          expect(screen.queryByText(/UI5:/)).toBeFalsy();
        } else {
          if (expectedApp) {
            expect(screen.getByText(expectedApp)).toBeTruthy();
          } else {
            expect(screen.queryByText(/App:/)).toBeFalsy();
          }

          if (expectedUI5) {
            expect(screen.getByText(expectedUI5)).toBeTruthy();
          } else {
            expect(screen.queryByText(/UI5:/)).toBeFalsy();
          }
        }

        unmount(); // Clean up for next iteration
      });
    });

    it('should prioritize direct app/sapui5 properties over buildProperties version', () => {
      const contextWithSystemInfo = {
        ...mockContextProps,
        componentSystemInfoMap: {
          'accounts-service': {
            app: '1.0.0',
            sapui5: '1.100.0',
            buildProperties: {
              version: {
                app: '2.0.0',
                sapui5: '1.200.0'
              }
            }
          }
        },
        isLoadingSystemInfo: false
      };

      render(
        <ComponentDisplayProvider {...contextWithSystemInfo}>
          <table>
            <tbody>
              <HealthRow {...defaultProps} />
            </tbody>
          </table>
        </ComponentDisplayProvider>
      );

      // Should use direct properties, not buildProperties
      expect(screen.getByText('App: 1.0.0')).toBeTruthy();
      expect(screen.getByText('UI5: 1.100.0')).toBeTruthy();
      expect(screen.queryByText('App: 2.0.0')).toBeFalsy();
      expect(screen.queryByText('UI5: 1.200.0')).toBeFalsy();
    });

    it('should not render version badges when buildProperties version is invalid', () => {
      // Test both null and empty object cases
      const testCases = [
        { version: null, description: 'null' },
        { version: {}, description: 'empty object' }
      ];

      testCases.forEach(({ version, description }) => {
        const contextWithSystemInfo = {
          ...mockContextProps,
          componentSystemInfoMap: {
            'accounts-service': {
              buildProperties: {
                version
              }
            }
          },
          isLoadingSystemInfo: false
        };

        const { unmount } = render(
          <ComponentDisplayProvider {...contextWithSystemInfo}>
            <table>
              <tbody>
                <HealthRow {...defaultProps} />
              </tbody>
            </table>
          </ComponentDisplayProvider>
        );

        expect(screen.queryByText(/App:/)).toBeFalsy();
        expect(screen.queryByText(/UI5:/)).toBeFalsy();
        
        unmount(); // Clean up for next iteration
      });
    });

    it('should show loading badge when system info is loading', () => {
      const contextWithLoadingSystemInfo = {
        ...mockContextProps,
        componentSystemInfoMap: {},
        isLoadingSystemInfo: true
      };

      render(
        <ComponentDisplayProvider {...contextWithLoadingSystemInfo}>
          <table>
            <tbody>
              <HealthRow {...defaultProps} />
            </tbody>
          </table>
        </ComponentDisplayProvider>
      );

      expect(screen.getByText('Loading...')).toBeTruthy();
    });

  });
});
