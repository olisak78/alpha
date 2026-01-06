import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DocsRawEditor } from '../../../src/features/docs/components/DocsRawEditor';
import { apiClient } from '../../../src/services/ApiClient';
import '@testing-library/jest-dom/vitest';

// Mock dependencies
vi.mock('../../../src/services/ApiClient');
vi.mock('../../../src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockApiClient = vi.mocked(apiClient);

describe('DocsRawEditor', () => {
  const defaultProps = {
    content: '# Test Document\n\nThis is a test document.',
    selectedPath: 'docs/test.md',
    fileSHA: 'abc123',
    docsConfig: {
      owner: 'test-owner',
      repo: 'test-repo',
      branch: 'main',
      docsPath: 'docs',
    },
    onCancel: vi.fn(),
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock document.documentElement.classList.contains for dark mode detection
    Object.defineProperty(document.documentElement, 'classList', {
      value: {
        contains: vi.fn().mockReturnValue(false), // Default to light mode
      },
      writable: true,
    });

    // Mock window.confirm
    global.confirm = vi.fn().mockReturnValue(true);
  });

  it('should render editor with header, content and handle changes', () => {
    render(<DocsRawEditor {...defaultProps} />);
    
    // Check header information
    expect(screen.getByText('Edit: test.md')).toBeInTheDocument();
    expect(screen.getByText('test-owner/test-repo - main')).toBeInTheDocument();
    
    // Check initial content
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue(defaultProps.content);
    
    // Check save button initially disabled
    const saveButton = screen.getByRole('button', { name: /Save to GitHub/ });
    expect(saveButton).toBeDisabled();
    
    // Test content changes
    fireEvent.change(textarea, { target: { value: '# Modified Content' } });
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    expect(saveButton).not.toBeDisabled();
  });

  it('should call onSave when save is successful', async () => {
    mockApiClient.put.mockResolvedValue({});
    
    render(<DocsRawEditor {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    const newContent = '# Modified Content';
    fireEvent.change(textarea, { target: { value: newContent } });
    
    const saveButton = screen.getByRole('button', { name: /Save to GitHub/ });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockApiClient.put).toHaveBeenCalledWith(
        '/github/repos/test-owner/test-repo/contents/docs/test.md',
        {
          message: 'Update test.md via Developer Portal',
          content: newContent,
          sha: 'abc123',
          branch: 'main',
        }
      );
    });
    
    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledWith(newContent);
    });
  });

  it('should handle save errors gracefully', async () => {
    const error = new Error('Save failed');
    mockApiClient.put.mockRejectedValue(error);
    
    render(<DocsRawEditor {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '# Modified Content' } });
    
    const saveButton = screen.getByRole('button', { name: /Save to GitHub/ });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockApiClient.put).toHaveBeenCalled();
    });
    
    // Should not call onSave on error
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('should show loading state during save', async () => {
    let resolvePromise: (value: any) => void;
    const savePromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockApiClient.put.mockReturnValue(savePromise);
    
    render(<DocsRawEditor {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '# Modified Content' } });
    
    const saveButton = screen.getByRole('button', { name: /Save to GitHub/ });
    fireEvent.click(saveButton);
    
    // Should show loading state
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
    
    // Resolve the promise
    resolvePromise!({});
    
    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    });
  });

  it('should call onCancel when cancel button is clicked without changes', () => {
    render(<DocsRawEditor {...defaultProps} />);
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/ });
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('should show confirmation dialog when canceling with unsaved changes', () => {
    render(<DocsRawEditor {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '# Modified Content' } });
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/ });
    fireEvent.click(cancelButton);
    
    expect(global.confirm).toHaveBeenCalledWith(
      'You have unsaved changes. Are you sure you want to cancel?'
    );
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('should not cancel if user declines confirmation', () => {
    global.confirm = vi.fn().mockReturnValue(false);
    
    render(<DocsRawEditor {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '# Modified Content' } });
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/ });
    fireEvent.click(cancelButton);
    
    expect(global.confirm).toHaveBeenCalled();
    expect(defaultProps.onCancel).not.toHaveBeenCalled();
  });

  it('should display and update file statistics and commit info', () => {
    render(<DocsRawEditor {...defaultProps} />);
    
    // Check initial statistics
    const content = defaultProps.content;
    const lines = content.split('\n').length;
    const characters = content.length;
    expect(screen.getByText(`Lines: ${lines} | Characters: ${characters}`)).toBeInTheDocument();
    
    // Check commit information
    expect(screen.getByText(/Editing as authenticated user/)).toBeInTheDocument();
    expect(screen.getByText(/Changes will be committed to main/)).toBeInTheDocument();
    
    // Test statistics update
    const textarea = screen.getByRole('textbox');
    const newContent = 'Line 1\nLine 2\nLine 3';
    fireEvent.change(textarea, { target: { value: newContent } });
    expect(screen.getByText('Lines: 3 | Characters: 20')).toBeInTheDocument();
  });

  it('should handle markdown syntax highlighting', () => {
    render(<DocsRawEditor {...defaultProps} />);
    
    // The component should render both the textarea and the highlighting overlay
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    
    // Check for the highlighting overlay (it should be present but hidden)
    const container = textarea.closest('.relative');
    expect(container).toBeInTheDocument();
  });

  it('should sync scroll between textarea and highlight overlay', () => {
    render(<DocsRawEditor {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    
    // Mock scrollTop and scrollLeft
    Object.defineProperty(textarea, 'scrollTop', { value: 100, writable: true });
    Object.defineProperty(textarea, 'scrollLeft', { value: 50, writable: true });
    
    // Mock previousElementSibling (the highlight overlay)
    const mockHighlight = {
      scrollTop: 0,
      scrollLeft: 0,
    };
    Object.defineProperty(textarea, 'previousElementSibling', {
      value: mockHighlight,
      writable: true,
    });
    
    fireEvent.scroll(textarea);
    
    expect(mockHighlight.scrollTop).toBe(100);
    expect(mockHighlight.scrollLeft).toBe(50);
  });

  it('should reset content when props change', () => {
    const { rerender } = render(<DocsRawEditor {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Modified content' } });
    
    // Should show unsaved changes
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    
    // Change props
    const newProps = {
      ...defaultProps,
      content: '# New Content',
    };
    rerender(<DocsRawEditor {...newProps} />);
    
    // Should reset to new content and clear unsaved changes
    expect(textarea).toHaveValue('# New Content');
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
  });

  it('should show no changes message when trying to save without changes', async () => {
    render(<DocsRawEditor {...defaultProps} />);
    
    const saveButton = screen.getByRole('button', { name: /Save to GitHub/ });
    
    // Button should be disabled initially
    expect(saveButton).toBeDisabled();
    
    // Force click (even though disabled)
    fireEvent.click(saveButton);
    
    // Should not call API
    expect(mockApiClient.put).not.toHaveBeenCalled();
  });
});
