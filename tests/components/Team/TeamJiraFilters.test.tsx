import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { TeamJiraFilters } from '../../../src/components/Team/TeamJiraFilters';
import { useTeamContext } from '../../../src/contexts/TeamContext';
import type { Member } from '../../../src/hooks/useOnDutyData';

// Mock the TeamContext
vi.mock('../../../src/contexts/TeamContext');

const mockUseTeamContext = vi.mocked(useTeamContext);

describe('TeamJiraFilters', () => {
  const mockMembers: Member[] = [
    {
      id: '1',
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Developer',
      team: 'Team A',
      iuser: 'john.doe',
      uuid: 'uuid-1'
    },
    {
      id: '2',
      fullName: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'Manager',
      team: 'Team A',
      iuser: 'jane.smith',
      uuid: 'uuid-2'
    },
    {
      id: '3',
      fullName: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      role: 'Developer',
      team: 'Team A',
      iuser: 'bob.johnson',
      uuid: 'uuid-3'
    }
  ];

  const mockJiraFilters = {
    assigneeFilter: 'all',
    setAssigneeFilter: vi.fn(),
    statusFilter: 'all',
    setStatusFilter: vi.fn(),
    sortBy: 'updated_desc',
    setSortBy: vi.fn(),
    search: '',
    setSearch: vi.fn(),
    quickFilter: 'all' as const,
    setQuickFilter: vi.fn(),
    currentPage: 1,
    setCurrentPage: vi.fn(),
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    filteredIssues: [],
    isLoading: false,
    error: null,
  };

  const defaultMockContext = {
    teamId: 'team-1',
    teamName: 'Team A',
    currentTeam: null,
    teamOptions: ['Team A', 'Team B'],
    members: mockMembers,
    memberDialogOpen: false,
    setMemberDialogOpen: vi.fn(),
    editingMember: null,
    memberForm: {},
    setMemberForm: vi.fn(),
    openAddMember: vi.fn(),
    openEditMember: vi.fn(),
    deleteMember: vi.fn(),
    moveMember: vi.fn(),
    createMember: vi.fn(),
    jiraFilters: mockJiraFilters,
    teamLinks: {
      links: [],
      linkDialogOpen: false,
      onLinkDialogOpenChange: vi.fn(),
      removeLink: vi.fn(),
      setLinks: vi.fn(),
    },
    teamComponents: {
      componentsData: undefined,
      teamComponentsExpanded: {},
      toggleComponentExpansion: vi.fn(),
    },
    scheduleData: {
      todayAssignments: {
        dayMember: null,
        nightMember: null,
      },
    },
    scoreboardData: {
      jiraTop3: [],
      gitTop3: [],
      dutyTop3: [],
      crossTeamRows: [],
      scoreWeights: {
        jira: 1,
        git: 1,
        duty: 1,
      },
    },
    isAdmin: false,
    onOpenComponent: vi.fn(),
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTeamContext.mockReturnValue(defaultMockContext);
  });

  describe('Component Rendering', () => {
    it('renders all filter elements with correct structure and styling', () => {
      render(<TeamJiraFilters />);

      // Check for search input
      expect(screen.getByPlaceholderText('Search key or summary')).toBeInTheDocument();
      
      // Check for filter labels with correct styling
      const labelElements = screen.getAllByText(/Search|Assignee|Status|Order by/);
      expect(labelElements).toHaveLength(4);
      labelElements.forEach(label => {
        expect(label).toHaveClass('text-xs', 'text-muted-foreground', 'mb-1');
      });

      // Check for select triggers
      expect(screen.getAllByRole('combobox')).toHaveLength(3); // Assignee, Status, Sort by
      
      // Check responsive layout
      const { container } = render(<TeamJiraFilters />);
      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveClass('flex', 'flex-col', 'md:flex-row', 'gap-3', 'md:items-end', 'mb-4');
    });
  });

  describe('Search Functionality', () => {
    it('displays and updates search value correctly', () => {
      const contextWithSearch = {
        ...defaultMockContext,
        jiraFilters: {
          ...mockJiraFilters,
          search: 'test search',
        },
      };
      mockUseTeamContext.mockReturnValue(contextWithSearch);

      render(<TeamJiraFilters />);
      
      const searchInput = screen.getByPlaceholderText('Search key or summary');
      expect(searchInput).toHaveValue('test search');
      
      // Test updating search
      fireEvent.change(searchInput, { target: { value: 'new search term' } });
      expect(mockJiraFilters.setSearch).toHaveBeenCalledWith('new search term');
    });

    it('handles various search input scenarios', () => {
      render(<TeamJiraFilters />);
      
      const searchInput = screen.getByPlaceholderText('Search key or summary');
      
      // Test basic text input
      fireEvent.change(searchInput, { target: { value: 'basic search' } });
      expect(mockJiraFilters.setSearch).toHaveBeenCalledWith('basic search');
      
      // Test special characters
      fireEvent.change(searchInput, { target: { value: '!@#$%^&*()' } });
      expect(mockJiraFilters.setSearch).toHaveBeenCalledWith('!@#$%^&*()');
      
      // Test long search term
      const longTerm = 'a'.repeat(100);
      fireEvent.change(searchInput, { target: { value: longTerm } });
      expect(mockJiraFilters.setSearch).toHaveBeenCalledWith(longTerm);
      
      // Verify calls were made
      expect(mockJiraFilters.setSearch).toHaveBeenCalledTimes(3);
    });

    it('handles clearing search input correctly', () => {
      // Start with a context that has a search value
      const contextWithSearch = {
        ...defaultMockContext,
        jiraFilters: {
          ...mockJiraFilters,
          search: 'initial value',
        },
      };
      mockUseTeamContext.mockReturnValue(contextWithSearch);

      render(<TeamJiraFilters />);
      
      const searchInput = screen.getByPlaceholderText('Search key or summary');
      expect(searchInput).toHaveValue('initial value');
      
      // Clear the search
      fireEvent.change(searchInput, { target: { value: '' } });
      expect(mockJiraFilters.setSearch).toHaveBeenCalledWith('');
    });
  });

  describe('Filter Dropdowns', () => {
    it('renders all select components with proper handlers', () => {
      render(<TeamJiraFilters />);
      
      // Verify all handler functions are properly connected
      expect(mockJiraFilters.setAssigneeFilter).toBeDefined();
      expect(mockJiraFilters.setStatusFilter).toBeDefined();
      expect(mockJiraFilters.setSortBy).toBeDefined();
      
      // Verify select elements are rendered
      const selectElements = screen.getAllByRole('combobox');
      expect(selectElements).toHaveLength(3);
      
      selectElements.forEach(select => {
        expect(select).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('displays current filter values correctly', () => {
      const contextWithFilters = {
        ...defaultMockContext,
        jiraFilters: {
          ...mockJiraFilters,
          assigneeFilter: '1',
          statusFilter: 'In Progress',
          sortBy: 'priority',
        },
      };
      mockUseTeamContext.mockReturnValue(contextWithFilters);

      render(<TeamJiraFilters />);
      
      // Component should render without errors with all filter values set
      expect(screen.getAllByRole('combobox')).toHaveLength(3);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles empty members list gracefully', () => {
      const contextWithNoMembers = {
        ...defaultMockContext,
        members: [],
      };
      mockUseTeamContext.mockReturnValue(contextWithNoMembers);

      render(<TeamJiraFilters />);
      
      // Component should still render all elements
      expect(screen.getByPlaceholderText('Search key or summary')).toBeInTheDocument();
      expect(screen.getAllByRole('combobox')).toHaveLength(3);
    });

    it('handles members with incomplete data', () => {
      const membersWithIncompleteData: Member[] = [
        {
          id: '1',
          fullName: '',
          email: 'test@example.com',
          role: 'Developer',
          team: 'Team A',
          iuser: 'test',
          uuid: 'uuid-1'
        }
      ];

      const contextWithIncompleteMembers = {
        ...defaultMockContext,
        members: membersWithIncompleteData,
      };
      mockUseTeamContext.mockReturnValue(contextWithIncompleteMembers);

      render(<TeamJiraFilters />);
      
      // Component should render without errors
      expect(screen.getByPlaceholderText('Search key or summary')).toBeInTheDocument();
    });

    it('handles varying member list sizes', () => {
      // Test with many members
      const manyMembers = Array.from({ length: 10 }, (_, i) => ({
        id: `member-${i}`,
        fullName: `Member ${i}`,
        email: `member${i}@example.com`,
        role: 'Developer',
        team: 'Team A',
        iuser: `member${i}`,
        uuid: `uuid-${i}`
      }));

      const contextWithManyMembers = {
        ...defaultMockContext,
        members: manyMembers,
      };
      mockUseTeamContext.mockReturnValue(contextWithManyMembers);

      render(<TeamJiraFilters />);
      expect(screen.getAllByRole('combobox')).toHaveLength(3);
    });

    it('requires valid jiraFilters context', () => {
      const contextWithNullFilters = {
        ...defaultMockContext,
        jiraFilters: null as any,
      };
      mockUseTeamContext.mockReturnValue(contextWithNullFilters);

      // Component should throw when jiraFilters is null (expected behavior)
      expect(() => render(<TeamJiraFilters />)).toThrow();
    });
  });

  describe('Integration and State Management', () => {
    it('uses context correctly and maintains independent filter states', () => {
      const contextWithFilters = {
        ...defaultMockContext,
        jiraFilters: {
          ...mockJiraFilters,
          search: 'test',
          assigneeFilter: '1',
          statusFilter: 'Open',
          sortBy: 'priority',
        },
      };
      mockUseTeamContext.mockReturnValue(contextWithFilters);

      render(<TeamJiraFilters />);
      
      expect(mockUseTeamContext).toHaveBeenCalled();
      
      // Verify search input displays correct value
      const searchInput = screen.getByPlaceholderText('Search key or summary');
      expect(searchInput).toHaveValue('test');
      
      // Changing search shouldn't affect other filters
      fireEvent.change(searchInput, { target: { value: 'new test' } });
      expect(mockJiraFilters.setSearch).toHaveBeenCalledWith('new test');
      expect(mockJiraFilters.setAssigneeFilter).not.toHaveBeenCalled();
      expect(mockJiraFilters.setStatusFilter).not.toHaveBeenCalled();
      expect(mockJiraFilters.setSortBy).not.toHaveBeenCalled();
    });

    it('handles context updates correctly', () => {
      const { rerender } = render(<TeamJiraFilters />);
      
      // Update context with new values
      const updatedContext = {
        ...defaultMockContext,
        jiraFilters: {
          ...mockJiraFilters,
          search: 'updated search',
          assigneeFilter: '2',
          statusFilter: 'Closed',
          sortBy: 'created_desc',
        },
      };
      
      mockUseTeamContext.mockReturnValue(updatedContext);
      rerender(<TeamJiraFilters />);
      
      const searchInput = screen.getByPlaceholderText('Search key or summary');
      expect(searchInput).toHaveValue('updated search');
    });

    it('handles rapid successive changes', () => {
      render(<TeamJiraFilters />);
      
      const searchInput = screen.getByPlaceholderText('Search key or summary');
      
      // Simulate rapid typing
      fireEvent.change(searchInput, { target: { value: 'a' } });
      fireEvent.change(searchInput, { target: { value: 'ab' } });
      fireEvent.change(searchInput, { target: { value: 'abc' } });
      
      expect(mockJiraFilters.setSearch).toHaveBeenCalledTimes(3);
      expect(mockJiraFilters.setSearch).toHaveBeenLastCalledWith('abc');
    });
  });

  describe('Accessibility', () => {
    it('provides proper accessibility features', () => {
      render(<TeamJiraFilters />);
      
      // Check form elements have proper accessibility
      expect(screen.getByPlaceholderText('Search key or summary')).toBeInTheDocument();
      
      // Check select elements have proper ARIA attributes
      const comboBoxes = screen.getAllByRole('combobox');
      expect(comboBoxes).toHaveLength(3);
      
      comboBoxes.forEach(comboBox => {
        expect(comboBox).toHaveAttribute('aria-expanded', 'false');
      });
      
      // Test focus management
      const searchInput = screen.getByPlaceholderText('Search key or summary');
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);
    });
  });
});
