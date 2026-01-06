import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import TeamsPage from '../../../src/pages/TeamsPage';
import { useTeamsPage } from '../../../src/hooks/useTeamsPage';

// Mock the useTeamsPage hook
vi.mock('../../../src/hooks/useTeamsPage');

// Mock the BreadcrumbPage component
vi.mock('../../../src/components/BreadcrumbPage', () => ({
  BreadcrumbPage: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="breadcrumb-page">{children}</div>
  ),
}));

// Mock the TeamContainer component
vi.mock('../../../src/components/Team/TeamContainer', () => ({
  default: ({ teamName, onCommonTabChange, onMembersChange, onMoveMember, onOpenComponent, getTeamIdFromName, getTeamNameFromId, ...props }: any) => (
    <div data-testid="team-container">
      <div data-testid="team-name">{teamName}</div>
      <button 
        data-testid="common-tab-button" 
        onClick={() => onCommonTabChange && onCommonTabChange('test-tab')}
      >
        Change Tab
      </button>
      <div data-testid="team-props">{JSON.stringify({
        ...props,
        onMembersChange: typeof onMembersChange === 'function' ? 'function' : onMembersChange,
        onMoveMember: typeof onMoveMember === 'function' ? 'function' : onMoveMember,
        onOpenComponent: typeof onOpenComponent === 'function' ? 'function' : onOpenComponent,
        onCommonTabChange: typeof onCommonTabChange === 'function' ? 'function' : onCommonTabChange,
        getTeamIdFromName: typeof getTeamIdFromName === 'function' ? 'function' : getTeamIdFromName,
        getTeamNameFromId: typeof getTeamNameFromId === 'function' ? 'function' : getTeamNameFromId,
      }, null, 2)}</div>
    </div>
  ),
}));

const mockUseTeamsPage = vi.mocked(useTeamsPage);

// Default mock values for useTeamsPage hook
const defaultMockValues = {
  // State
  groups: {},
  setGroups: vi.fn(),
  selectedTab: 'Engineering Team',
  activeCommonTab: 'overview',
  selectedTeamId: 'team-123',
  currentTeam: {
    id: 'team-123',
    name: 'engineering-team',
    title: 'Engineering Team',
  },
  teamNames: ['Engineering Team', 'Product Team', 'Design Team'],

  // Data fetching
  teamsResponse: {
    teams: [
      {
        id: 'team-123',
        name: 'engineering-team',
        title: 'Engineering Team',
      },
      {
        id: 'team-456',
        name: 'product-team',
        title: 'Product Team',
      },
    ],
    total: 2,
  },
  teamsLoading: false,
  teamsError: null,
  refetchTeams: vi.fn(),

  // Handlers
  handleMembersChange: vi.fn(),
  handleMoveMember: vi.fn(),
  onOpenComponent: vi.fn(),
  handleCommonTabChange: vi.fn(),
  getTeamIdFromName: vi.fn((name: string) => `team-${name.toLowerCase().replace(' ', '-')}`),
  getTeamNameFromId: vi.fn((id: string) => id.replace('team-', '').replace('-', ' ')),
};

describe('TeamsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTeamsPage.mockReturnValue(defaultMockValues);
  });

  // =========================================
  // LOADING STATE TESTS
  // =========================================

  describe('Loading States', () => {
    it('displays loading spinner when teams are loading', () => {
      mockUseTeamsPage.mockReturnValue({
        ...defaultMockValues,
        teamsLoading: true,
        selectedTab: '',
        teamNames: [],
      });

      render(
        <MemoryRouter>
          <TeamsPage />
        </MemoryRouter>
      );

      expect(screen.getByText('Loading teams...')).toBeInTheDocument();
      expect(screen.getByTestId('breadcrumb-page')).toBeInTheDocument();
      
      // Check for loading spinner
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('displays loading team message when selectedTab is null', () => {
      mockUseTeamsPage.mockReturnValue({
        ...defaultMockValues,
        teamsLoading: false,
        selectedTab: '',
        teamNames: ['Team A', 'Team B'],
      });

      render(
        <MemoryRouter>
          <TeamsPage />
        </MemoryRouter>
      );

      expect(screen.getByText('Loading team...')).toBeInTheDocument();
      expect(screen.getByTestId('breadcrumb-page')).toBeInTheDocument();
    });
  });

  // =========================================
  // ERROR STATE TESTS
  // =========================================

  describe('Error States', () => {
    it('displays error message when teams fail to load', () => {
      const mockError = new Error('Failed to fetch teams');
      mockUseTeamsPage.mockReturnValue({
        ...defaultMockValues,
        teamsLoading: false,
        teamsError: mockError,
        selectedTab: '',
        teamNames: [],
      });

      render(
        <MemoryRouter>
          <TeamsPage />
        </MemoryRouter>
      );

      expect(screen.getByText('Error loading teams: Failed to fetch teams')).toBeInTheDocument();
      
      // Check for retry button
      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveClass('px-4', 'py-2', 'bg-primary', 'text-primary-foreground', 'rounded', 'hover:bg-primary/90');
    });

    it('calls refetchTeams when retry button is clicked', () => {
      const mockError = new Error('Network error');
      const mockRefetchTeams = vi.fn();
      mockUseTeamsPage.mockReturnValue({
        ...defaultMockValues,
        teamsLoading: false,
        teamsError: mockError,
        selectedTab: '',
        teamNames: [],
        refetchTeams: mockRefetchTeams,
      });

      render(
        <MemoryRouter>
          <TeamsPage />
        </MemoryRouter>
      );

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(mockRefetchTeams).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================
  // EMPTY STATE TESTS
  // =========================================

  describe('Empty State', () => {
    it('displays no teams found message when teamNames is empty', () => {
      mockUseTeamsPage.mockReturnValue({
        ...defaultMockValues,
        teamsLoading: false,
        teamsError: null,
        selectedTab: '',
        teamNames: [],
      });

      render(
        <MemoryRouter>
          <TeamsPage />
        </MemoryRouter>
      );

      expect(screen.getByText('No teams found')).toBeInTheDocument();
      expect(screen.getByTestId('breadcrumb-page')).toBeInTheDocument();
    });
  });

  // =========================================
  // SUCCESSFUL RENDERING TESTS
  // =========================================

  describe('Successful Rendering', () => {
    it('renders TeamContainer with correct props and handler functions', () => {
      render(
        <MemoryRouter>
          <TeamsPage />
        </MemoryRouter>
      );

      // Verify component structure
      expect(screen.getByTestId('team-container')).toBeInTheDocument();
      expect(screen.getByTestId('team-name')).toHaveTextContent('Engineering Team');
      expect(screen.getByTestId('breadcrumb-page')).toBeInTheDocument();

      // Verify props are passed correctly
      const teamPropsElement = screen.getByTestId('team-props');
      const teamProps = JSON.parse(teamPropsElement.textContent || '{}');

      expect(teamProps).toMatchObject({
        selectedTeamId: 'team-123',
        currentTeam: {
          id: 'team-123',
          name: 'engineering-team',
          title: 'Engineering Team',
        },
        teamNames: ['Engineering Team', 'Product Team', 'Design Team'],
        activeCommonTab: 'overview',
      });

      // Verify handler functions are passed
      expect(teamProps.onMembersChange).toBe('function');
      expect(teamProps.onMoveMember).toBe('function');
      expect(teamProps.onOpenComponent).toBe('function');
      expect(teamProps.getTeamIdFromName).toBe('function');

      // Test that handlers work (button click test removed since onCommonTabChange is not passed to TeamContainer)
    });

    it('renders with different team data', () => {
      const customMockValues = {
        ...defaultMockValues,
        selectedTab: 'Product Team',
        selectedTeamId: 'team-product',
        currentTeam: {
          id: 'team-product',
          name: 'product-team',
          title: 'Product Team',
        },
        teamNames: ['Product Team', 'Engineering Team'],
        activeCommonTab: 'members',
      };

      mockUseTeamsPage.mockReturnValue(customMockValues);

      render(
        <MemoryRouter>
          <TeamsPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('team-name')).toHaveTextContent('Product Team');
      
      const teamPropsElement = screen.getByTestId('team-props');
      const teamProps = JSON.parse(teamPropsElement.textContent || '{}');
      
      expect(teamProps.selectedTeamId).toBe('team-product');
      expect(teamProps.activeCommonTab).toBe('members');
    });

    it('handles edge cases with minimal data', () => {
      mockUseTeamsPage.mockReturnValue({
        ...defaultMockValues,
        groups: {},
        currentTeam: null,
        selectedTeamId: null,
        selectedTab: '',
        teamNames: ['Team A', 'Team B'],
      });

      render(
        <MemoryRouter>
          <TeamsPage />
        </MemoryRouter>
      );

      expect(screen.getByText('Loading team...')).toBeInTheDocument();
    });
  });
});
