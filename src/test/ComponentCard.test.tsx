import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ComponentCard from '@/components/ComponentCard';
import { Component, ComponentStatus } from '@/types/api';
import * as useSonarMeasuresHook from '@/hooks/api/useSonarMeasures';

// Mock the useSonarMeasures hook
const mockUseSonarMeasures = vi.spyOn(useSonarMeasuresHook, 'useSonarMeasures');

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  writable: true,
  value: mockWindowOpen,
});

// Test component data
const mockComponent: Component = {
  id: 'test-component-id',
  name: 'test-component',
  title: 'Test Component Title',
  description: 'Test component description',
  github: 'https://github.com/test/repo',
  sonar: 'https://sonar.example.com/component/test',
  project_id: 'project-123',
  owner_id: 'owner-123',
  project_title: 'Test Project',
  metadata: {
    tags: ['frontend', 'react'],
    domain: 'platform',
  }
};

const defaultProps = {
  component: mockComponent,
  selectedLandscape: 'production',
  selectedLandscapeName: 'Production',
  expandedComponents: { 'test-component-id': true },
  onToggleExpanded: vi.fn(),
  getComponentHealth: vi.fn().mockReturnValue('healthy'),
  getComponentAlerts: vi.fn().mockReturnValue(false),
  system: 'unified-services',
};

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('ComponentCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock for useSonarMeasures - use as any to avoid strict typing issues
    mockUseSonarMeasures.mockReturnValue({
      data: {
        coverage: 85,
        codeSmells: 12,
        vulnerabilities: 2,
        qualityGate: 'Passed',
      },
      isLoading: false,
      isError: false,
      error: null,
      hasAlias: true,
      refetch: vi.fn(),
    } as any);
  });

  describe('Basic Rendering', () => {
    it('renders component title and name', () => {
      render(
        <TestWrapper>
          <ComponentCard {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Component Title')).toBeInTheDocument();
      expect(screen.getByText('Test Component Title')).toBeInTheDocument();
    });

    it('renders component name when title is not provided', () => {
      const componentWithoutTitle = { ...mockComponent, title: '' };
      render(
        <TestWrapper>
          <ComponentCard {...defaultProps} component={componentWithoutTitle} />
        </TestWrapper>
      );

      // Use getAllByText since the component name appears in both h3 and p elements
      expect(screen.getByText('test-component')).toBeInTheDocument();
    });

    it('renders external link buttons (GitHub, Sonar)', () => {
      render(
        <TestWrapper>
          <ComponentCard {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /github/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sonar/i })).toBeInTheDocument();
    });
  });

  describe('External Link Buttons', () => {
    it('renders GitHub button when github URL is provided', () => {
      render(
        <TestWrapper>
          <ComponentCard {...defaultProps} />
        </TestWrapper>
      );

      const githubButton = screen.getByRole('button', { name: /github/i });
      expect(githubButton).toBeInTheDocument();
    });

    it('renders Sonar button when sonar URL is provided', () => {
      render(
        <TestWrapper>
          <ComponentCard {...defaultProps} />
        </TestWrapper>
      );

      const sonarButton = screen.getByRole('button', { name: /sonar/i });
      expect(sonarButton).toBeInTheDocument();
    });

    it('does not render GitHub button when github URL is empty', () => {
      const propsWithoutGithub = {
        ...defaultProps,
        component: { ...mockComponent, github: '' },
      };

      render(
        <TestWrapper>
          <ComponentCard {...propsWithoutGithub} />
        </TestWrapper>
      );

      expect(screen.queryByRole('button', { name: /github/i })).not.toBeInTheDocument();
    });

    it('opens link in new window when button is clicked', () => {
      render(
        <TestWrapper>
          <ComponentCard {...defaultProps} />
        </TestWrapper>
      );

      const githubButton = screen.getByRole('button', { name: /github/i });
      fireEvent.click(githubButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://github.com/test/repo',
        '_blank',
        'noopener,noreferrer'
      );
    });
  });

  describe('Quality Metrics Display', () => {
    it('renders quality metrics grid with all metrics', () => {
      render(
        <TestWrapper>
          <ComponentCard {...defaultProps} />
        </TestWrapper>
      );

      // Check for metric labels
      expect(screen.getByText('Coverage')).toBeInTheDocument();
      expect(screen.getByText('Vulns')).toBeInTheDocument();
      expect(screen.getByText('Smells')).toBeInTheDocument();
      expect(screen.getByText('Gate')).toBeInTheDocument();
    });

    it('displays coverage metric value correctly', () => {
      render(
        <TestWrapper>
          <ComponentCard {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('displays vulnerabilities count correctly', () => {
      render(
        <TestWrapper>
          <ComponentCard {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('displays code smells count correctly', () => {
      render(
        <TestWrapper>
          <ComponentCard {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('displays quality gate status correctly', () => {
      render(
        <TestWrapper>
          <ComponentCard {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Passed')).toBeInTheDocument();
    });
  });

  describe('SonarQube Integration', () => {
    it('displays loading state for sonar metrics', () => {
      mockUseSonarMeasures.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        hasAlias: true,
        refetch: vi.fn(),
      } as any);

      render(
        <TestWrapper>
          <ComponentCard {...defaultProps} />
        </TestWrapper>
      );

      // Should show '...' for loading state in all metrics
      expect(screen.getAllByText('...').length).toBeGreaterThan(0);
    });

    it('displays N/A for missing sonar data', () => {
      mockUseSonarMeasures.mockReturnValue({
        data: {
          coverage: null,
          codeSmells: null,
          vulnerabilities: null,
          qualityGate: null,
        },
        isLoading: false,
        isError: false,
        error: null,
        hasAlias: false,
        refetch: vi.fn(),
      } as any);

      render(
        <TestWrapper>
          <ComponentCard {...defaultProps} />
        </TestWrapper>
      );

      // Should show 'N/A' for all null metrics
      expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
    });

    it('applies correct quality gate styling for passed state', () => {
      render(
        <TestWrapper>
          <ComponentCard {...defaultProps} />
        </TestWrapper>
      );

      // Quality gate icon should have green color for passed
      const qualityGateSection = screen.getByText('Passed').closest('div');
      const icon = qualityGateSection?.querySelector('svg');
      expect(icon).toHaveClass('text-green-600');
    });

    it('applies correct quality gate styling for failed state', () => {
      mockUseSonarMeasures.mockReturnValue({
        data: {
          coverage: 85,
          codeSmells: 12,
          vulnerabilities: 2,
          qualityGate: 'Failed',
        },
        isLoading: false,
        isError: false,
        error: null,
        hasAlias: true,
        refetch: vi.fn(),
      } as any);

      render(
        <TestWrapper>
          <ComponentCard {...defaultProps} />
        </TestWrapper>
      );

      // Quality gate icon should have red color for failed
      const qualityGateSection = screen.getByText('Failed').closest('div');
      const icon = qualityGateSection?.querySelector('svg');
      expect(icon).toHaveClass('text-red-500');
    });

    it('fetches sonar data when component is rendered', () => {
      render(
        <TestWrapper>
          <ComponentCard {...defaultProps} />
        </TestWrapper>
      );

      // Sonar data is always fetched (true parameter means always fetch)
      expect(mockUseSonarMeasures).toHaveBeenCalledWith(
        mockComponent.sonar,
        true
      );
    });
  });

  describe('External Links', () => {
    it('opens GitHub link in new tab when clicked', () => {
      render(
        <TestWrapper>
          <ComponentCard {...defaultProps} />
        </TestWrapper>
      );

      const githubButton = screen.getByRole('button', { name: /github/i });
      fireEvent.click(githubButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://github.com/test/repo',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('opens Sonar link in new tab when clicked', () => {
      render(
        <TestWrapper>
          <ComponentCard {...defaultProps} />
        </TestWrapper>
      );

      const sonarButton = screen.getByRole('button', { name: /sonar/i });
      fireEvent.click(sonarButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://sonar.example.com/component/test',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('prevents event propagation when external links are clicked', () => {
      const cardClickHandler = vi.fn();

      render(
        <TestWrapper>
          <div onClick={cardClickHandler}>
            <ComponentCard {...defaultProps} />
          </div>
        </TestWrapper>
      );

      const githubButton = screen.getByRole('button', { name: /github/i });
      fireEvent.click(githubButton);

      expect(mockWindowOpen).toHaveBeenCalled();
      expect(cardClickHandler).not.toHaveBeenCalled();
    });

    it('does not render GitHub button when github URL is empty or null', () => {
      const componentWithoutGithub = { ...mockComponent, github: '' };
      render(
        <TestWrapper>
          <ComponentCard {...defaultProps} component={componentWithoutGithub} />
        </TestWrapper>
      );

      expect(screen.queryByRole('button', { name: /github/i })).not.toBeInTheDocument();
    });

    it('does not render Sonar button when sonar URL is empty or null', () => {
      const componentWithoutSonar = { ...mockComponent, sonar: '' };
      render(
        <TestWrapper>
          <ComponentCard {...defaultProps} component={componentWithoutSonar} />
        </TestWrapper>
      );

      expect(screen.queryByRole('button', { name: /sonar/i })).not.toBeInTheDocument();
    });

    it('does not open link when URL is "#"', () => {
      const componentWithHashUrl = { ...mockComponent, github: '#' };
      render(
        <TestWrapper>
          <ComponentCard {...defaultProps} component={componentWithHashUrl} />
        </TestWrapper>
      );

      const githubButton = screen.getByRole('button', { name: /github/i });
      fireEvent.click(githubButton);

      expect(mockWindowOpen).not.toHaveBeenCalled();
    });
  });

  describe('Navigation Behavior', () => {
    it('renders correctly for different system types', () => {
      const systems = ['unified-services', 'cis', 'custom-system'];
      
      systems.forEach(system => {
        const { unmount } = render(
          <TestWrapper>
            <ComponentCard {...defaultProps} system={system} />
          </TestWrapper>
        );
        
        expect(screen.getByText('Test Component Title')).toBeInTheDocument();
        
        // Clean up after each render to avoid DOM conflicts
        unmount();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('renders component card when expandedComponents is empty', () => {
      const propsWithoutExpandedState = {
        ...defaultProps,
        expandedComponents: {}, // Empty object
      };

      render(
        <TestWrapper>
          <ComponentCard {...propsWithoutExpandedState} />
        </TestWrapper>
      );

      // Component should render normally with quality metrics always visible
      expect(screen.getByText('Coverage')).toBeInTheDocument();
      expect(screen.getByText('Gate')).toBeInTheDocument();
    });

    it('handles component with minimal data', () => {
      const minimalComponent: Component = {
        id: 'minimal-id',
        name: 'minimal-component',
        title: '',
        description: '',
        project_id: 'project-123',
        owner_id: 'owner-123',
      };

      render(
        <TestWrapper>
          <ComponentCard {...defaultProps} component={minimalComponent} />
        </TestWrapper>
      );

      // Use getAllByText since the component name appears in both h3 and p elements
      expect(screen.getAllByText('minimal-component')[0]).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /github/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /sonar/i })).not.toBeInTheDocument();
    });

    it('handles undefined sonar field gracefully', () => {
      const componentWithoutSonar = { ...mockComponent };
      delete componentWithoutSonar.sonar;

      mockUseSonarMeasures.mockReturnValue({
        data: {
          coverage: null,
          codeSmells: null,
          vulnerabilities: null,
          qualityGate: null,
        },
        isLoading: false,
        isError: false,
        error: null,
        hasAlias: false,
        refetch: vi.fn(),
      } as any);

      render(
        <TestWrapper>
          <ComponentCard {...defaultProps} component={componentWithoutSonar} />
        </TestWrapper>
      );

      // Should show N/A for metrics when sonar data is not available
      expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('has accessible button labels for external links', () => {
      render(
        <TestWrapper>
          <ComponentCard {...defaultProps} />
        </TestWrapper>
      );

      const githubButton = screen.getByRole('button', { name: /github/i });
      const sonarButton = screen.getByRole('button', { name: /sonar/i });

      expect(githubButton).toBeVisible();
      expect(sonarButton).toBeVisible();
    });

    it('renders component with proper semantic structure', () => {
      render(
        <TestWrapper>
          <ComponentCard {...defaultProps} />
        </TestWrapper>
      );

      // Component title should be in an h3 heading
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Test Component Title');

      // Buttons should be accessible
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
