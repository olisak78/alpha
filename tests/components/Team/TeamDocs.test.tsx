import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TeamDocs } from '../../../src/components/Team/TeamDocs';
import type { Documentation } from '../../../src/types/documentation';

/**
 * TeamDocs Component Tests
 * 
 * Tests for the TeamDocs component which manages team documentation
 * sources, tabs, and provides expand/collapse functionality.
 */

// Mock hooks
vi.mock('../../../src/hooks/api/useDocumentation');
vi.mock('../../../src/hooks/use-toast');

// Import the mocked modules
import { useTeamDocumentations, useDeleteDocumentation } from '../../../src/hooks/api/useDocumentation';
import { useToast } from '../../../src/hooks/use-toast';

const mockUseTeamDocumentations = vi.mocked(useTeamDocumentations);
const mockUseDeleteDocumentation = vi.mocked(useDeleteDocumentation);
const mockUseToast = vi.mocked(useToast);

// Mock UI components
vi.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, variant, size, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('../../../src/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange, className }: any) => (
    <div data-testid="tabs" data-value={value} className={className} onClick={() => onValueChange?.('test-tab')}>
      {children}
    </div>
  ),
  TabsContent: ({ children, value, className }: any) => (
    <div data-testid={`tabs-content-${value}`} className={className}>
      {children}
    </div>
  ),
  TabsList: ({ children, className }: any) => (
    <div data-testid="tabs-list" className={className}>
      {children}
    </div>
  ),
  TabsTrigger: ({ children, value, className }: any) => (
    <div data-testid={`tabs-trigger-${value}`} className={className}>
      {children}
    </div>
  ),
}));

vi.mock('../../../src/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuContent: ({ children, align }: any) => (
    <div data-testid="dropdown-menu-content" data-align={align}>{children}</div>
  ),
  DropdownMenuItem: ({ children, onClick, className }: any) => (
    <div data-testid="dropdown-menu-item" onClick={onClick} className={className}>
      {children}
    </div>
  ),
  DropdownMenuTrigger: ({ children, asChild }: any) => (
    <div data-testid="dropdown-menu-trigger" data-as-child={asChild}>
      {children}
    </div>
  ),
}));

// Mock icons
vi.mock('lucide-react', () => ({
  Plus: () => <span data-testid="plus-icon">+</span>,
  FileText: () => <span data-testid="file-text-icon">📄</span>,
  Trash2: () => <span data-testid="trash-icon">🗑️</span>,
  Loader2: () => <span data-testid="loader-icon">⏳</span>,
  Edit: () => <span data-testid="edit-icon">✏️</span>,
  Maximize2: () => <span data-testid="maximize-icon">⛶</span>,
  Minimize2: () => <span data-testid="minimize-icon">⊟</span>,
  MoreVertical: () => <span data-testid="more-vertical-icon">⋮</span>,
}));

// Mock dialogs
vi.mock('../../../src/components/dialogs/AddDocumentationDialog', () => ({
  AddDocumentationDialog: ({ open, onOpenChange, teamId }: any) => (
    <div data-testid="add-documentation-dialog" data-open={open} data-team-id={teamId}>
      {open && (
        <div>
          <span>Add Documentation Dialog</span>
          <button onClick={() => onOpenChange(false)}>Close</button>
        </div>
      )}
    </div>
  ),
}));

vi.mock('../../../src/components/dialogs/EditDocumentationDialog', () => ({
  EditDocumentationDialog: ({ open, onOpenChange, documentation }: any) => (
    <div data-testid="edit-documentation-dialog" data-open={open}>
      {open && (
        <div>
          <span>Edit Documentation Dialog</span>
          <span>Editing: {documentation?.title}</span>
          <button onClick={() => onOpenChange(false)}>Close</button>
        </div>
      )}
    </div>
  ),
}));

// Mock DocsPage
vi.mock('../../../src/features/docs/DocsPage', () => ({
  default: ({ owner, repo, branch, docsPath }: any) => (
    <div data-testid="docs-page">
      <span>DocsPage</span>
      <span>Owner: {owner}</span>
      <span>Repo: {repo}</span>
      <span>Branch: {branch}</span>
      <span>Path: {docsPath}</span>
    </div>
  ),
}));

describe('TeamDocs Component', () => {
  const mockDocumentations: Documentation[] = [
    {
      id: 'doc-1',
      title: 'API Documentation',
      description: 'API documentation for the team',
      team_id: 'team-1',
      owner: 'example-org',
      repo: 'api-docs',
      branch: 'main',
      docs_path: 'docs/',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      created_by: 'user-1',
      updated_by: 'user-1',
    },
    {
      id: 'doc-2',
      title: 'User Guide',
      description: 'User guide documentation',
      team_id: 'team-1',
      owner: 'example-org',
      repo: 'user-guide',
      branch: 'master',
      docs_path: 'guide/',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      created_by: 'user-2',
      updated_by: 'user-2',
    },
  ];

  const defaultProps = {
    teamId: 'team-1',
    teamName: 'Development Team',
  };

  const createMockQueryResult = (overrides: any = {}) => ({
    data: null,
    isLoading: false,
    isError: false,
    isPending: false,
    isLoadingError: false,
    isRefetchError: false,
    isSuccess: true,
    isStale: false,
    isFetching: false,
    isFetched: true,
    isFetchedAfterMount: true,
    isPlaceholderData: false,
    isPaused: false,
    isRefetching: false,
    isInitialLoading: false,
    error: null,
    status: 'success' as const,
    fetchStatus: 'idle' as const,
    refetch: vi.fn(),
    remove: vi.fn(),
    dataUpdatedAt: Date.now(),
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    ...overrides,
  });

  const createMockMutationResult = (overrides: any = {}) => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    mutate: vi.fn(),
    data: undefined,
    error: null,
    isError: false,
    isIdle: true,
    isPending: false,
    isSuccess: false,
    status: 'idle' as const,
    variables: undefined,
    failureCount: 0,
    failureReason: null,
    reset: vi.fn(),
    submittedAt: 0,
    ...overrides,
  });

  const renderWithQueryClient = (props = defaultProps) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <TeamDocs {...props} />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockUseTeamDocumentations.mockReturnValue(createMockQueryResult({
      data: mockDocumentations,
    }) as any);

    mockUseDeleteDocumentation.mockReturnValue(createMockMutationResult() as any);

    mockUseToast.mockReturnValue({
      toast: vi.fn(),
      dismiss: vi.fn(),
      toasts: [],
    } as any);
  });

  // ============================================================================
  // BASIC RENDERING TESTS
  // ============================================================================

  describe('Basic Rendering', () => {
    it('should render documentation tabs with correct structure and content', () => {
      renderWithQueryClient();

      // Basic structure
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
      expect(screen.getByTestId('tabs-list')).toBeInTheDocument();
      
      // Controls
      expect(screen.getByText('Add Source')).toBeInTheDocument();
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
      expect(screen.getByTestId('maximize-icon')).toBeInTheDocument();

      // Documentation tabs and content
      expect(screen.getByTestId('tabs-trigger-doc-1')).toBeInTheDocument();
      expect(screen.getByTestId('tabs-trigger-doc-2')).toBeInTheDocument();
      expect(screen.getByText('API Documentation')).toBeInTheDocument();
      expect(screen.getByText('User Guide')).toBeInTheDocument();

      // DocsPage components
      const docsPages = screen.getAllByTestId('docs-page');
      expect(docsPages).toHaveLength(2);
      expect(screen.getAllByText('Owner: example-org')).toHaveLength(2);
      expect(screen.getByText('Repo: api-docs')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // LOADING STATE TESTS
  // ============================================================================

  describe('Loading State', () => {
    it('should render loading spinner with correct styling', () => {
      mockUseTeamDocumentations.mockReturnValue(createMockQueryResult({
        data: null,
        isLoading: true,
        isSuccess: false,
        status: 'pending',
      }) as any);

      renderWithQueryClient();

      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('tabs')).not.toBeInTheDocument();

      const loadingContainer = screen.getByTestId('loader-icon').closest('div');
      expect(loadingContainer).toHaveClass('flex items-center justify-center py-12');
    });
  });

  // ============================================================================
  // ERROR STATE TESTS
  // ============================================================================

  describe('Error State', () => {
    it('should render error message with correct styling', () => {
      const mockError = new Error('Failed to load documentations');
      mockUseTeamDocumentations.mockReturnValue(createMockQueryResult({
        data: null,
        isError: true,
        isSuccess: false,
        error: mockError,
        status: 'error',
      }) as any);

      renderWithQueryClient();

      expect(screen.getByText('Error loading documentations: Failed to load documentations')).toBeInTheDocument();
      expect(screen.queryByTestId('tabs')).not.toBeInTheDocument();

      const errorContainer = screen.getByText(/Error loading documentations/).closest('div');
      expect(errorContainer).toHaveClass('flex flex-col items-center justify-center py-12 space-y-4');
    });
  });

  // ============================================================================
  // EMPTY STATE TESTS
  // ============================================================================

  describe('Empty State', () => {
    it('should render empty state with correct styling and content', () => {
      mockUseTeamDocumentations.mockReturnValue(createMockQueryResult({
        data: [],
      }) as any);

      renderWithQueryClient();

      expect(screen.getByTestId('file-text-icon')).toBeInTheDocument();
      expect(screen.getByText('No documentation added yet')).toBeInTheDocument();
      expect(screen.getByText('Add a GitHub documentation endpoint to get started')).toBeInTheDocument();
      expect(screen.getByText('Add Source')).toBeInTheDocument();

      const emptyContainer = screen.getByText('No documentation added yet').closest('div');
      expect(emptyContainer).toHaveClass('flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg');
    });

    it('should handle null documentations data', () => {
      mockUseTeamDocumentations.mockReturnValue(createMockQueryResult({
        data: null,
      }) as any);

      renderWithQueryClient();

      expect(screen.getByText('No documentation added yet')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // ADD DOCUMENTATION FUNCTIONALITY TESTS
  // ============================================================================

  describe('Add Documentation Functionality', () => {
    it('should handle add documentation dialog open/close workflow', async () => {
      const user = userEvent.setup();
      renderWithQueryClient();

      const addButton = screen.getByText('Add Source');
      await user.click(addButton);

      const dialog = screen.getByTestId('add-documentation-dialog');
      expect(dialog).toHaveAttribute('data-open', 'true');
      expect(dialog).toHaveAttribute('data-team-id', 'team-1');

      // Close dialog
      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      expect(dialog).toHaveAttribute('data-open', 'false');
    });
  });

  // ============================================================================
  // EDIT DOCUMENTATION FUNCTIONALITY TESTS
  // ============================================================================

  describe('Edit Documentation Functionality', () => {
    it('should render edit dropdown menus for each documentation', () => {
      renderWithQueryClient();

      const dropdownTriggers = screen.getAllByTestId('dropdown-menu-trigger');
      expect(dropdownTriggers).toHaveLength(2);

      const dropdownMenus = screen.getAllByTestId('dropdown-menu');
      expect(dropdownMenus).toHaveLength(2);

      // Should have edit options
      const editItems = screen.getAllByTestId('dropdown-menu-item');
      const editOptions = editItems.filter(item => item.textContent?.includes('Edit'));
      expect(editOptions).toHaveLength(2);
    });
  });

  // ============================================================================
  // DELETE DOCUMENTATION FUNCTIONALITY TESTS
  // ============================================================================

  describe('Delete Documentation Functionality', () => {
    it('should handle delete confirmation and success', async () => {
      const user = userEvent.setup();
      const mockMutateAsync = vi.fn().mockResolvedValue({});
      const mockToast = vi.fn();

      mockUseDeleteDocumentation.mockReturnValue(createMockMutationResult({
        mutateAsync: mockMutateAsync,
      }) as any);

      mockUseToast.mockReturnValue({
        toast: mockToast,
        dismiss: vi.fn(),
        toasts: [],
      } as any);

      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      renderWithQueryClient();

      const deleteItems = screen.getAllByTestId('dropdown-menu-item');
      const deleteItem = deleteItems.find(item => item.textContent?.includes('Delete'));
      
      if (deleteItem) {
        await user.click(deleteItem);
        
        expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete "API Documentation"?');
        
        await waitFor(() => {
          expect(mockMutateAsync).toHaveBeenCalledWith({
            id: 'doc-1',
            teamId: 'team-1',
          });
        });

        expect(mockToast).toHaveBeenCalledWith({
          title: 'Documentation deleted',
          description: 'API Documentation has been deleted successfully',
        });
      }

      confirmSpy.mockRestore();
    });

    it('should handle delete cancellation and errors', async () => {
      const user = userEvent.setup();
      
      // Test cancellation
      const mockMutateAsync = vi.fn();
      mockUseDeleteDocumentation.mockReturnValue(createMockMutationResult({
        mutateAsync: mockMutateAsync,
      }) as any);

      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      renderWithQueryClient();

      const deleteItems = screen.getAllByTestId('dropdown-menu-item');
      const deleteItem = deleteItems.find(item => item.textContent?.includes('Delete'));
      
      if (deleteItem) {
        await user.click(deleteItem);
        expect(mockMutateAsync).not.toHaveBeenCalled();
      }

      confirmSpy.mockRestore();
    });

    it('should handle delete error gracefully', async () => {
      const user = userEvent.setup();
      const mockError = new Error('Delete failed');
      const mockMutateAsync = vi.fn().mockRejectedValue(mockError);
      const mockToast = vi.fn();

      mockUseDeleteDocumentation.mockReturnValue(createMockMutationResult({
        mutateAsync: mockMutateAsync,
      }) as any);

      mockUseToast.mockReturnValue({
        toast: mockToast,
        dismiss: vi.fn(),
        toasts: [],
      } as any);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      renderWithQueryClient();

      const deleteItems = screen.getAllByTestId('dropdown-menu-item');
      const deleteItem = deleteItems.find(item => item.textContent?.includes('Delete'));
      
      if (deleteItem) {
        await user.click(deleteItem);
        
        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith({
            title: 'Failed to delete documentation',
            description: 'Delete failed',
            variant: 'destructive',
          });
        });
      }

      confirmSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // EXPAND/COLLAPSE FUNCTIONALITY TESTS
  // ============================================================================

  describe('Expand/Collapse Functionality', () => {
    it('should render expand button with correct attributes', () => {
      renderWithQueryClient();

      const expandButton = screen.getByTestId('maximize-icon').closest('button');
      expect(expandButton).toBeInTheDocument();
      expect(expandButton).toHaveAttribute('title', 'Expand');
    });
  });

  // ============================================================================
  // TAB SELECTION TESTS
  // ============================================================================

  describe('Tab Selection', () => {
    it('should handle tab selection and default behavior', async () => {
      const user = userEvent.setup();
      renderWithQueryClient();

      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveAttribute('data-value', 'doc-1');

      await user.click(tabs);
      expect(tabs).toBeInTheDocument();
    });
  });

  // ============================================================================
  // EDGE CASES AND ERROR HANDLING TESTS
  // ============================================================================

  describe('Edge Cases and Error Handling', () => {
    it('should handle documentations with missing fields', () => {
      const incompleteDocumentations = [{
        id: 'doc-incomplete',
        title: '',
        description: '',
        team_id: 'team-1',
        owner: '',
        repo: '',
        branch: '',
        docs_path: '',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: '',
        updated_by: '',
      }];

      mockUseTeamDocumentations.mockReturnValue(createMockQueryResult({
        data: incompleteDocumentations,
      }) as any);

      renderWithQueryClient();

      expect(screen.getByTestId('tabs')).toBeInTheDocument();
      expect(screen.getByTestId('docs-page')).toBeInTheDocument();
    });

    it('should handle edge case titles and props', () => {
      const longTitleDocumentations = [{
        ...mockDocumentations[0],
        title: 'A'.repeat(100),
      }];

      mockUseTeamDocumentations.mockReturnValue(createMockQueryResult({
        data: longTitleDocumentations,
      }) as any);

      renderWithQueryClient();
      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument();

      // Test special characters
      const specialCharDocumentations = [{
        ...mockDocumentations[0],
        title: "API Docs & User Guide (v2.0) - O'Brien's Team",
      }];

      mockUseTeamDocumentations.mockReturnValue(createMockQueryResult({
        data: specialCharDocumentations,
      }) as any);

      const { rerender } = renderWithQueryClient();
      
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      rerender(
        <QueryClientProvider client={queryClient}>
          <TeamDocs {...defaultProps} />
        </QueryClientProvider>
      );

      expect(screen.getByText("API Docs & User Guide (v2.0) - O'Brien's Team")).toBeInTheDocument();
    });

    it('should handle invalid props gracefully', () => {
      renderWithQueryClient({ teamId: '', teamName: 'Test Team' });
      expect(screen.getByTestId('add-documentation-dialog')).toHaveAttribute('data-team-id', '');
    });
  });

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA attributes and roles', () => {
      renderWithQueryClient();

      const tabs = screen.getByTestId('tabs');
      expect(tabs).toBeInTheDocument();

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderWithQueryClient();

      const addButton = screen.getByText('Add Source');
      
      // Focus the button
      addButton.focus();
      expect(addButton).toHaveFocus();

      // Should be able to activate with Enter
      await user.keyboard('{Enter}');
      expect(screen.getByTestId('add-documentation-dialog')).toHaveAttribute('data-open', 'true');
    });

    it('should have proper button labels and titles', () => {
      renderWithQueryClient();

      const expandButton = screen.getByTestId('maximize-icon').closest('button');
      expect(expandButton).toHaveAttribute('title', 'Expand');
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration Tests', () => {
    it('should work correctly with QueryClientProvider', () => {
      expect(() => renderWithQueryClient()).not.toThrow();
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });

    it('should handle complete workflow from empty to populated state', async () => {
      const user = userEvent.setup();
      
      // Start with empty state
      mockUseTeamDocumentations.mockReturnValue(createMockQueryResult({
        data: [],
      }) as any);

      const { rerender } = renderWithQueryClient();
      expect(screen.getByText('No documentation added yet')).toBeInTheDocument();

      // Simulate adding documentation
      mockUseTeamDocumentations.mockReturnValue(createMockQueryResult({
        data: mockDocumentations,
      }) as any);

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      rerender(
        <QueryClientProvider client={queryClient}>
          <TeamDocs {...defaultProps} />
        </QueryClientProvider>
      );

      expect(screen.getByTestId('tabs')).toBeInTheDocument();
      expect(screen.getByText('API Documentation')).toBeInTheDocument();
    });

    it('should maintain state during prop changes', () => {
      const { rerender } = renderWithQueryClient();

      expect(screen.getByTestId('add-documentation-dialog')).toHaveAttribute('data-team-id', 'team-1');

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      rerender(
        <QueryClientProvider client={queryClient}>
          <TeamDocs teamId="team-2" teamName="Updated Team" />
        </QueryClientProvider>
      );

      expect(screen.getByTestId('add-documentation-dialog')).toHaveAttribute('data-team-id', 'team-2');
    });
  });
});
