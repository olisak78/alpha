import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocsSidebar } from '../../../src/features/docs/components/DocsSidebar';
import { DocTreeNode } from '../../../src/services/githubDocsApi';
import '@testing-library/jest-dom/vitest';

const mockFileNode: DocTreeNode = {
  name: 'getting-started.md',
  path: 'docs/getting-started.md',
  type: 'file',
};

const mockDirNode: DocTreeNode = {
  name: 'guides',
  path: 'docs/guides',
  type: 'dir',
  children: [
    {
      name: 'installation.md',
      path: 'docs/guides/installation.md',
      type: 'file',
    },
    {
      name: 'configuration.md',
      path: 'docs/guides/configuration.md',
      type: 'file',
    },
  ],
};

const mockEmptyDirNode: DocTreeNode = {
  name: 'empty-folder',
  path: 'docs/empty-folder',
  type: 'dir',
  children: [],
};

const mockLazyDirNode: DocTreeNode = {
  name: 'lazy-folder',
  path: 'docs/lazy-folder',
  type: 'dir',
  // children: undefined for lazy loading
};

describe('DocsSidebar', () => {
  const defaultProps = {
    tree: [mockFileNode, mockDirNode],
    selectedPath: null,
    onSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render file and directory nodes correctly', () => {
    render(<DocsSidebar {...defaultProps} />);
    
    // File should be rendered without .md extension
    expect(screen.getByText('getting-started')).toBeInTheDocument();
    const fileButton = screen.getByRole('button', { name: /getting-started/ });
    expect(fileButton).toBeInTheDocument();
    
    // Directory should be rendered with folder icon
    expect(screen.getByText('guides')).toBeInTheDocument();
    const dirButton = screen.getByRole('button', { name: /guides/ });
    expect(dirButton).toBeInTheDocument();
  });

  it('should call onSelect when file is clicked', () => {
    const onSelect = vi.fn();
    render(<DocsSidebar {...defaultProps} onSelect={onSelect} />);
    
    const fileButton = screen.getByRole('button', { name: /getting-started/ });
    fireEvent.click(fileButton);
    
    expect(onSelect).toHaveBeenCalledWith('docs/getting-started.md');
  });

  it('should expand/collapse directories when clicked', () => {
    render(<DocsSidebar {...defaultProps} />);
    
    // Initially, children should not be visible
    expect(screen.queryByText('installation')).not.toBeInTheDocument();
    expect(screen.queryByText('configuration')).not.toBeInTheDocument();
    
    // Click to expand
    const dirButton = screen.getByRole('button', { name: /guides/ });
    fireEvent.click(dirButton);
    
    // Children should now be visible
    expect(screen.getByText('installation')).toBeInTheDocument();
    expect(screen.getByText('configuration')).toBeInTheDocument();
  });

  it('should highlight selected file', () => {
    render(<DocsSidebar {...defaultProps} selectedPath="docs/getting-started.md" />);
    
    const fileButton = screen.getByRole('button', { name: /getting-started/ });
    expect(fileButton).toHaveClass('bg-blue-50', 'text-blue-600', 'font-medium');
  });

  it('should handle empty states', () => {
    // Test empty tree
    const { rerender } = render(<DocsSidebar {...defaultProps} tree={[]} />);
    expect(screen.getByText('No documentation files found')).toBeInTheDocument();
    
    // Test empty folder
    rerender(<DocsSidebar {...defaultProps} tree={[mockEmptyDirNode]} />);
    const dirButton = screen.getByRole('button', { name: /empty-folder/ });
    fireEvent.click(dirButton);
    expect(screen.getByText('Empty folder')).toBeInTheDocument();
  });

  it('should handle lazy loading with onLoadDirectory callback', () => {
    const onLoadDirectory = vi.fn();
    const expandedDirs = new Set<string>();
    
    render(
      <DocsSidebar
        {...defaultProps}
        tree={[mockLazyDirNode]}
        onLoadDirectory={onLoadDirectory}
        expandedDirs={expandedDirs}
      />
    );
    
    const dirButton = screen.getByRole('button', { name: /lazy-folder/ });
    fireEvent.click(dirButton);
    
    expect(onLoadDirectory).toHaveBeenCalledWith('docs/lazy-folder');
  });

  it('should show loading state for lazy-loaded directories', () => {
    const expandedDirs = new Set(['docs/lazy-folder']);
    
    render(
      <DocsSidebar
        {...defaultProps}
        tree={[mockLazyDirNode]}
        expandedDirs={expandedDirs}
      />
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render nested directory structure with proper indentation', () => {
    const nestedTree: DocTreeNode[] = [
      {
        name: 'level1',
        path: 'docs/level1',
        type: 'dir',
        children: [
          {
            name: 'level2',
            path: 'docs/level1/level2',
            type: 'dir',
            children: [
              {
                name: 'deep-file.md',
                path: 'docs/level1/level2/deep-file.md',
                type: 'file',
              },
            ],
          },
        ],
      },
    ];

    render(<DocsSidebar {...defaultProps} tree={nestedTree} />);
    
    // Expand level1
    const level1Button = screen.getByRole('button', { name: /level1/ });
    fireEvent.click(level1Button);
    
    // Expand level2
    const level2Button = screen.getByRole('button', { name: /level2/ });
    fireEvent.click(level2Button);
    
    // Deep file should be visible
    expect(screen.getByText('deep-file')).toBeInTheDocument();
  });

  it('should show different icons for expanded/collapsed folders', () => {
    render(<DocsSidebar {...defaultProps} />);
    
    const dirButton = screen.getByRole('button', { name: /guides/ });
    
    // Initially collapsed - should have ChevronRight
    expect(dirButton.querySelector('svg')).toBeInTheDocument();
    
    // Click to expand
    fireEvent.click(dirButton);
    
    // Should now have ChevronDown (different icon)
    expect(dirButton.querySelector('svg')).toBeInTheDocument();
  });

  it('should handle file selection in nested directories', () => {
    const onSelect = vi.fn();
    render(<DocsSidebar {...defaultProps} onSelect={onSelect} />);
    
    // Expand directory first
    const dirButton = screen.getByRole('button', { name: /guides/ });
    fireEvent.click(dirButton);
    
    // Click on nested file
    const nestedFileButton = screen.getByRole('button', { name: /installation/ });
    fireEvent.click(nestedFileButton);
    
    expect(onSelect).toHaveBeenCalledWith('docs/guides/installation.md');
  });

  it('should maintain expanded state when using internal state management', () => {
    render(<DocsSidebar {...defaultProps} />);
    
    const dirButton = screen.getByRole('button', { name: /guides/ });
    
    // Expand
    fireEvent.click(dirButton);
    expect(screen.getByText('installation')).toBeInTheDocument();
    
    // Collapse
    fireEvent.click(dirButton);
    expect(screen.queryByText('installation')).not.toBeInTheDocument();
  });
});
