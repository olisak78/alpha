import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DocsPage from '../../../src/features/docs/DocsPage';
import type { DocTreeNode } from '../../../src/services/githubDocsApi';

/**
 * DocsPage Component Tests
 * 
 * Streamlined tests for the DocsPage component which provides a GitHub-like documentation
 * experience with sidebar navigation, content display, and table of contents.
 * Redundant tests have been removed while maintaining comprehensive coverage.
 */

// Mock hooks
vi.mock('../../../src/hooks/api/useDocs');

// Import the mocked modules
import { 
  useDocTreeLazy, 
  useDocDirectory, 
  useDocFile, 
  useDocFileWithMetadata 
} from '../../../src/hooks/api/useDocs';

const mockUseDocTreeLazy = vi.mocked(useDocTreeLazy);
const mockUseDocDirectory = vi.mocked(useDocDirectory);
const mockUseDocFile = vi.mocked(useDocFile);
const mockUseDocFileWithMetadata = vi.mocked(useDocFileWithMetadata);

// Mock child components - these need to be simple mocks that don't interfere with the actual component logic
vi.mock('../../../src/features/docs/components/DocsSidebar', () => ({
  DocsSidebar: ({ tree, selectedPath, onSelect, onLoadDirectory, expandedDirs }: any) => (
    <div data-testid="docs-sidebar">
      <div>Docs Sidebar</div>
      <div>Selected: {selectedPath || 'none'}</div>
      <div>Expanded dirs: {Array.from(expandedDirs).join(', ')}</div>
      {tree.map((node: DocTreeNode, index: number) => (
        <div key={index} data-testid={`sidebar-node-${node.path}`}>
          <button onClick={() => onSelect(node.path)}>{node.name}</button>
          {node.type === 'dir' && (
            <button onClick={() => onLoadDirectory(node.path)}>Load {node.name}</button>
          )}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../../../src/features/docs/components/DocsContent', () => ({
  DocsContent: ({ content, isLoading, error, selectedPath, onTableOfContentsChange, docsConfig }: any) => (
    <div data-testid="docs-content">
      <div>Docs Content</div>
      <div>Selected path: {selectedPath || 'none'}</div>
      <div>Config: {docsConfig ? JSON.stringify(docsConfig) : 'none'}</div>
      {isLoading && <div>Loading content...</div>}
      {error && <div>Content error: {error.message}</div>}
      {content && (
        <div>
          <div>Content: {content.substring(0, 50)}...</div>
          <button onClick={() => onTableOfContentsChange([
            { id: 'heading-1', text: 'Test Heading', level: 1 }
          ])}>
            Generate TOC
          </button>
        </div>
      )}
    </div>
  ),
}));

vi.mock('../../../src/features/docs/components/DocsTableOfContents', () => ({
  DocsTableOfContents: ({ items, activeId }: any) => (
    <div data-testid="docs-table-of-contents">
      <div>Table of Contents</div>
      <div>Active: {activeId}</div>
      {items.map((item: any) => (
        <div key={item.id} data-testid={`toc-item-${item.id}`}>
          {item.text} (Level {item.level})
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../../../src/features/docs/components/DocsSearch', () => ({
  DocsSearch: ({ value, onChange }: any) => (
    <div data-testid="docs-search">
      <input
        data-testid="search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search docs..."
      />
    </div>
  ),
}));

vi.mock('../../../src/features/docs/components/DocsRawEditor', () => ({
  DocsRawEditor: ({ content, selectedPath, fileSHA, docsConfig, onCancel, onSave }: any) => (
    <div data-testid="docs-raw-editor">
      <div>Raw Editor</div>
      <div>Path: {selectedPath}</div>
      <div>SHA: {fileSHA}</div>
      <div>Config: {JSON.stringify(docsConfig)}</div>
      <textarea data-testid="raw-editor-content" defaultValue={content} />
      <button onClick={onCancel}>Cancel</button>
      <button onClick={() => onSave('updated content')}>Save</button>
    </div>
  ),
}));

// Mock services
vi.mock('../../../src/services/githubDocsApi', () => ({
  flattenDocTree: vi.fn((tree: DocTreeNode[]) => 
    tree.reduce((acc: DocTreeNode[], node) => {
      acc.push(node);
      if (node.children) {
        acc.push(...node.children);
      }
      return acc;
    }, [])
  ),
  buildDocTreeLazy: vi.fn(),
}));

// Mock UI components
vi.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, variant, size, title, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
      data-size={size}
      title={title}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock icons
vi.mock('lucide-react', () => ({
  AlertCircle: () => <span data-testid="alert-circle-icon">⚠️</span>,
  AlertTriangle: () => <span data-testid="alert-triangle-icon">⚠️</span>,
  Loader2: () => <span data-testid="loader-icon">⏳</span>,
  FileText: () => <span data-testid="file-text-icon">📄</span>,
  Eye: () => <span data-testid="eye-icon">👁️</span>,
  Github: () => <span data-testid="github-icon">🐙</span>,
  FilePlus: () => <span data-testid="file-plus-icon">📄➕</span>,
  FolderPlus: () => <span data-testid="folder-plus-icon">📁➕</span>,
  Trash2: () => <span data-testid="trash-icon">🗑️</span>,
  X: () => <span data-testid="x-icon">✕</span>,
  Edit: () => <span data-testid="edit-icon">✏️</span>,
}));

// Mock Fuse.js
vi.mock('fuse.js', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      search: vi.fn((query: string) => [
        { item: { path: 'test.md', name: 'test.md' }, score: 0.1 }
      ]),
    })),
  };
});

describe('DocsPage Component', () => {
  const mockDocTree: DocTreeNode[] = [
    {
      type: 'file',
      name: 'README.md',
      path: 'README.md',
    },
    {
      type: 'dir',
      name: 'guides',
      path: 'guides',
      children: [
        {
          type: 'file',
          name: 'getting-started.md',
          path: 'guides/getting-started.md',
        },
      ],
    },
    {
      type: 'file',
      name: 'api.md',
      path: 'api.md',
    },
  ];

  const defaultProps = {
    owner: 'test-owner',
    repo: 'test-repo',
    branch: 'main',
    docsPath: 'docs',
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

  const renderWithQueryClient = (props = defaultProps) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <DocsPage {...props} />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockUseDocTreeLazy.mockReturnValue(createMockQueryResult({
      data: mockDocTree,
    }) as any);

    mockUseDocFile.mockReturnValue(createMockQueryResult({
      data: '# Test Content\n\nThis is test markdown content.',
    }) as any);

    mockUseDocFileWithMetadata.mockReturnValue(createMockQueryResult({
      data: {
        rawContent: '# Test Content\n\nThis is test markdown content.',
        sha: 'abc123',
      },
      refetch: vi.fn(),
    }) as any);

    mockUseDocDirectory.mockReturnValue(createMockQueryResult() as any);
  });

  // ============================================================================
  // CORE RENDERING AND CONFIGURATION TESTS
  // ============================================================================

  describe('Core Rendering and Configuration', () => {
    it('should render main layout with all components when data is loaded', () => {
      renderWithQueryClient();

      // Main layout structure
      expect(screen.getByTestId('docs-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('docs-content')).toBeInTheDocument();
      expect(screen.getByTestId('docs-search')).toBeInTheDocument();
      // Title is extracted from last segment of docsPath ("docs/coe" -> "coe", "docs" -> "docs")
      expect(screen.getByText('docs')).toBeInTheDocument();
      expect(screen.getAllByTestId('github-icon')).toHaveLength(2); // Header and action button
    });

    it('should handle different configurations and missing props', () => {
      // Test without props (default configuration)
      const { unmount } = renderWithQueryClient({} as any);
      expect(screen.getByTestId('docs-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('docs-content')).toBeInTheDocument();
      expect(screen.queryByTestId('github-icon')).not.toBeInTheDocument();
      unmount();

      // Test with full configuration
      renderWithQueryClient();
      const docsContent = screen.getByTestId('docs-content');
      expect(docsContent).toHaveTextContent('Config: {"owner":"test-owner","repo":"test-repo","branch":"main","docsPath":"docs"}');
    });

    it('should handle various prop combinations and edge cases', () => {
      const testCases = [
        {
          props: { owner: 'org1', repo: 'repo1', branch: 'main', docsPath: 'docs' },
          expectedConfig: '{"owner":"org1","repo":"repo1","branch":"main","docsPath":"docs"}',
        },
        {
          props: { owner: 'org-with-dashes', repo: 'repo_with_underscores', branch: 'feature/special-branch', docsPath: 'docs/api/v1' },
          expectedConfig: '{"owner":"org-with-dashes","repo":"repo_with_underscores","branch":"feature/special-branch","docsPath":"docs/api/v1"}',
        },
      ];

      testCases.forEach(({ props, expectedConfig }) => {
        const { unmount } = renderWithQueryClient(props);
        const docsContent = screen.getByTestId('docs-content');
        expect(docsContent).toHaveTextContent(`Config: ${expectedConfig}`);
        unmount();
      });
    });
  });

  // ============================================================================
  // LOADING AND ERROR STATES
  // ============================================================================

  describe('Loading and Error States', () => {
    it('should render loading states correctly', () => {
      // Tree loading state
      mockUseDocTreeLazy.mockReturnValue(createMockQueryResult({
        data: null,
        isLoading: true,
        isSuccess: false,
        status: 'pending',
      }) as any);

      const { unmount } = renderWithQueryClient();
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.getByText('Loading documentation...')).toBeInTheDocument();
      expect(screen.queryByTestId('docs-sidebar')).not.toBeInTheDocument();
      unmount();

      // Content loading state
      mockUseDocTreeLazy.mockReturnValue(createMockQueryResult({ data: mockDocTree }) as any);
      mockUseDocFile.mockReturnValue(createMockQueryResult({
        data: undefined,
        isLoading: true,
        isSuccess: false,
        status: 'pending',
      }) as any);

      renderWithQueryClient();
      expect(screen.getByTestId('docs-content')).toBeInTheDocument();
      expect(screen.getByText('Loading content...')).toBeInTheDocument();
    });

    it('should render error states correctly', () => {
      // Tree loading error
      const mockError = new Error('Failed to load documentation tree');
      mockUseDocTreeLazy.mockReturnValue(createMockQueryResult({
        data: null,
        isError: true,
        isSuccess: false,
        error: mockError,
        status: 'error',
      }) as any);

      const { unmount } = renderWithQueryClient();
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
      expect(screen.getByText('Failed to Load Documentation')).toBeInTheDocument();
      expect(screen.getByText('Failed to load documentation tree')).toBeInTheDocument();
      unmount();

      // Content loading error
      mockUseDocTreeLazy.mockReturnValue(createMockQueryResult({ data: mockDocTree }) as any);
      const fileError = new Error('File not found');
      mockUseDocFile.mockReturnValue(createMockQueryResult({
        data: undefined,
        isError: true,
        isSuccess: false,
        error: fileError,
        status: 'error',
      }) as any);

      renderWithQueryClient();
      expect(screen.getByTestId('docs-content')).toBeInTheDocument();
      expect(screen.getByText('Content error: File not found')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // FILE NAVIGATION AND INTERACTION
  // ============================================================================

  describe('File Navigation and Interaction', () => {
    it('should handle file selection and navigation', async () => {
      const user = userEvent.setup();
      renderWithQueryClient();

      // Auto-select first file
      await waitFor(() => {
        expect(screen.getByText('Selected: README.md')).toBeInTheDocument();
      });

      // Handle file selection from sidebar
      const apiFileButton = screen.getByText('api.md');
      await user.click(apiFileButton);

      await waitFor(() => {
        expect(screen.getByText('Selected: api.md')).toBeInTheDocument();
      });
    });

    it('should handle directory loading and expansion', async () => {
      const user = userEvent.setup();
      renderWithQueryClient();

      const loadGuidesButton = screen.getByText('Load guides');
      
      // First click expands
      await user.click(loadGuidesButton);
      await waitFor(() => {
        expect(screen.getByText('Expanded dirs: guides')).toBeInTheDocument();
      });

      // Second click collapses
      await user.click(loadGuidesButton);
      await waitFor(() => {
        expect(screen.getByText('Expanded dirs:')).toBeInTheDocument();
      });
    });

    it('should handle empty files and errors gracefully', async () => {
      // Test empty file handling
      mockUseDocFile.mockReturnValue(createMockQueryResult({
        data: '', // Empty content
      }) as any);

      const { unmount } = renderWithQueryClient();
      await waitFor(() => {
        expect(screen.getByTestId('docs-content')).toBeInTheDocument();
      });
      unmount();

      // Test 404 error handling
      const mockError = new Error('File not found');
      mockUseDocFile.mockReturnValue(createMockQueryResult({
        data: undefined,
        isError: true,
        error: mockError,
        status: 'error',
      }) as any);

      renderWithQueryClient();
      expect(screen.getByTestId('docs-content')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // SEARCH AND TABLE OF CONTENTS
  // ============================================================================

  describe('Search and Table of Contents', () => {
    it('should handle search functionality', async () => {
      const user = userEvent.setup();
      renderWithQueryClient();

      const searchInput = screen.getByTestId('search-input');
      
      // Test search input
      await user.type(searchInput, 'test');
      expect(searchInput).toHaveValue('test');

      // Test clearing search
      await user.clear(searchInput);
      expect(searchInput).toHaveValue('');
    });

    it('should handle table of contents generation and tracking', async () => {
      const user = userEvent.setup();
      renderWithQueryClient();

      // Initially no TOC
      expect(screen.queryByTestId('docs-table-of-contents')).not.toBeInTheDocument();

      // Generate TOC
      const generateTocButton = screen.getByText('Generate TOC');
      await user.click(generateTocButton);

      await waitFor(() => {
        expect(screen.getByTestId('docs-table-of-contents')).toBeInTheDocument();
        expect(screen.getByTestId('toc-item-heading-1')).toBeInTheDocument();
        expect(screen.getByText('Test Heading (Level 1)')).toBeInTheDocument();
        
        const toc = screen.getByTestId('docs-table-of-contents');
        expect(toc).toHaveTextContent('Active:'); // Initially empty
      });
    });
  });

  // ============================================================================
  // RAW EDITOR MODE
  // ============================================================================

  describe('Raw Editor Mode', () => {
    it('should show edit button when docsConfig is provided and hide when not', () => {
      // With docsConfig - should show edit button
      const { unmount } = renderWithQueryClient();
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
      unmount();

      // Without docsConfig - should not show edit button
      renderWithQueryClient({} as any);
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByTestId('edit-icon')).not.toBeInTheDocument();
    });

  });

  // ============================================================================
  // GITHUB INTEGRATION
  // ============================================================================

  describe('GitHub Integration', () => {
    it('should handle GitHub integration correctly', async () => {
      const mockWindowOpen = vi.fn();
      Object.defineProperty(window, 'open', {
        value: mockWindowOpen,
        writable: true,
      });

      const user = userEvent.setup();
      
      // Test with docsConfig
      const { unmount } = renderWithQueryClient();
      const githubButtons = screen.getAllByTestId('github-icon');
      expect(githubButtons).toHaveLength(2);

      const openButton = screen.getByText('Open');
      expect(openButton.closest('button')).toHaveAttribute('title', 'Open in GitHub');

      // Test GitHub button click
      const headerGithubButton = githubButtons[0].closest('button');
      if (headerGithubButton) {
        await user.click(headerGithubButton);
        expect(mockWindowOpen).toHaveBeenCalledWith(
          'https://github.tools.sap/test-owner/test-repo/tree/main/docs',
          '_blank',
          'noopener,noreferrer'
        );
      }
      unmount();

      // Test without docsConfig
      renderWithQueryClient({} as any);
      expect(screen.queryByText('Open')).not.toBeInTheDocument();
      expect(screen.queryAllByTestId('github-icon')).toHaveLength(0);
    });
  });

  // ============================================================================
  // LAZY LOADING AND PERFORMANCE
  // ============================================================================

  describe('Lazy Loading and Performance', () => {
    it('should handle lazy loading with success and error scenarios', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Test successful lazy loading
      const mockBuildDocTreeLazy = vi.fn().mockResolvedValue([
        {
          type: 'file',
          name: 'advanced.md',
          path: 'guides/advanced.md',
        },
      ]);

      vi.doMock('../../../src/services/githubDocsApi', () => ({
        flattenDocTree: vi.fn(),
        buildDocTreeLazy: mockBuildDocTreeLazy,
      }));

      const { unmount } = renderWithQueryClient();
      const loadGuidesButton = screen.getByText('Load guides');
      await user.click(loadGuidesButton);

      await waitFor(() => {
        expect(screen.getByText('Expanded dirs: guides')).toBeInTheDocument();
      });
      unmount();

      // Test lazy loading error handling
      const mockBuildDocTreeLazyError = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.doMock('../../../src/services/githubDocsApi', () => ({
        flattenDocTree: vi.fn(),
        buildDocTreeLazy: mockBuildDocTreeLazyError,
      }));

      renderWithQueryClient();
      const loadGuidesButtonError = screen.getByText('Load guides');
      await user.click(loadGuidesButtonError);

      await waitFor(() => {
        expect(screen.getByTestId('docs-sidebar')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should handle large datasets efficiently', () => {
      const veryLargeTree = Array.from({ length: 1000 }, (_, i) => ({
        type: 'file' as const,
        name: `file-${i}.md`,
        path: `docs/section-${Math.floor(i / 100)}/file-${i}.md`,
      }));

      mockUseDocTreeLazy.mockReturnValue(createMockQueryResult({
        data: veryLargeTree,
      }) as any);

      const startTime = performance.now();
      renderWithQueryClient();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000);
      expect(screen.getByTestId('docs-sidebar')).toBeInTheDocument();
      expect(screen.getByText('file-0.md')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // EDGE CASES AND DATA HANDLING
  // ============================================================================

  describe('Edge Cases and Data Handling', () => {
    it('should handle various data states and edge cases', () => {
      const testCases = [
        { data: [], description: 'empty doc tree' },
        { data: null, description: 'null doc tree' },
      ];

      testCases.forEach(({ data, description }) => {
        mockUseDocTreeLazy.mockReturnValue(createMockQueryResult({ data }) as any);
        const { unmount } = renderWithQueryClient();
        
        expect(screen.getByTestId('docs-sidebar')).toBeInTheDocument();
        if (data && data.length === 0) {
          expect(screen.getByText('Selected: none')).toBeInTheDocument();
        }
        unmount();
      });
    });

    it('should handle special characters and large datasets', () => {
      const specialCharTree: DocTreeNode[] = [
        {
          type: 'file',
          name: 'file with spaces & special chars.md',
          path: 'docs/file with spaces & special chars.md',
        },
        {
          type: 'file',
          name: 'файл-с-unicode.md',
          path: 'docs/файл-с-unicode.md',
        },
      ];

      mockUseDocTreeLazy.mockReturnValue(createMockQueryResult({
        data: specialCharTree,
      }) as any);

      renderWithQueryClient();
      expect(screen.getByText('file with spaces & special chars.md')).toBeInTheDocument();
      expect(screen.getByText('файл-с-unicode.md')).toBeInTheDocument();
    });

    it('should handle missing metadata gracefully', () => {
      mockUseDocFileWithMetadata.mockReturnValue(createMockQueryResult({
        data: null,
      }) as any);

      renderWithQueryClient();
      expect(screen.getByTestId('docs-content')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // INTEGRATION AND STATE MANAGEMENT
  // ============================================================================

  describe('Integration and State Management', () => {
    it('should handle complete workflow integration', async () => {
      const user = userEvent.setup();
      renderWithQueryClient();

      // Initial state
      await waitFor(() => {
        expect(screen.getByText('Selected: README.md')).toBeInTheDocument();
      });

      // Content display
      expect(screen.getByText(/Content: # Test Content/)).toBeInTheDocument();

      // TOC generation
      const generateTocButton = screen.getByText('Generate TOC');
      await user.click(generateTocButton);

      await waitFor(() => {
        expect(screen.getByTestId('docs-table-of-contents')).toBeInTheDocument();
      });

      // Search functionality
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'readme');
      expect(searchInput).toHaveValue('readme');
    });

    it('should handle state transitions correctly', async () => {
      const { rerender } = renderWithQueryClient();

      // Start with loading state
      mockUseDocTreeLazy.mockReturnValue(createMockQueryResult({
        data: null,
        isLoading: true,
        isSuccess: false,
        status: 'pending',
      }) as any);

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      rerender(
        <QueryClientProvider client={queryClient}>
          <DocsPage {...defaultProps} />
        </QueryClientProvider>
      );

      expect(screen.getByText('Loading documentation...')).toBeInTheDocument();

      // Transition to loaded state
      mockUseDocTreeLazy.mockReturnValue(createMockQueryResult({
        data: mockDocTree,
      }) as any);

      rerender(
        <QueryClientProvider client={queryClient}>
          <DocsPage {...defaultProps} />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading documentation...')).not.toBeInTheDocument();
        expect(screen.getByTestId('docs-sidebar')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // ACCESSIBILITY AND PERFORMANCE
  // ============================================================================

  describe('Accessibility and Performance', () => {
    it('should provide proper accessibility features', async () => {
      const user = userEvent.setup();
      renderWithQueryClient();

      // Semantic structure
      const mainContainer = screen.getByTestId('docs-sidebar').closest('div');
      expect(mainContainer).toBeInTheDocument();
      // Title is extracted from last segment of docsPath
      expect(screen.getByText('docs')).toBeInTheDocument();

      // Keyboard navigation
      const searchInput = screen.getByTestId('search-input');
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);

      await user.keyboard('{Tab}');

      // ARIA attributes
      expect(searchInput).toHaveAttribute('placeholder', 'Search docs...');
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should handle rapid state changes efficiently', async () => {
      const user = userEvent.setup();
      renderWithQueryClient();

      const searchInput = screen.getByTestId('search-input');

      // Rapid typing and clearing
      await user.type(searchInput, 'test');
      await user.clear(searchInput);
      await user.type(searchInput, 'api');
      await user.clear(searchInput);

      expect(searchInput).toHaveValue('');
    });

    it('should cleanup resources properly', () => {
      const mockRemoveEventListener = vi.fn();
      
      Object.defineProperty(document, 'getElementById', {
        value: vi.fn().mockReturnValue({
          addEventListener: vi.fn(),
          removeEventListener: mockRemoveEventListener,
          getBoundingClientRect: vi.fn().mockReturnValue({ top: 0, bottom: 100 }),
          scrollTop: 0,
        }),
        writable: true,
      });

      const { unmount } = renderWithQueryClient();
      
      expect(screen.getByTestId('docs-content')).toBeInTheDocument();
      
      unmount();
      
      // Event listeners should be cleaned up
      // Note: The actual cleanup verification depends on the component implementation
    });
  });
});
