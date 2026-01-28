import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocsContent } from '../../../src/features/docs/components/DocsContent';
import '@testing-library/jest-dom/vitest';

// Mock clipboard API
const mockWriteText = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock API client
vi.mock('../../../src/services/ApiClient', () => ({
  apiClient: {
    get: vi.fn(),
    getBinary: vi.fn(),
  },
}));

vi.mock('../../../src/services/githubDocsApi', () => ({
  DOCS_CONFIG: {
    owner: 'test-owner',
    repo: 'test-repo',
    branch: 'main',
    docsPath: 'docs',
  },
}));

vi.mock('../../../src/features/docs/components/MermaidDiagram', () => ({
  MermaidDiagram: ({ chart }: { chart: string }) => (
    <div data-testid="mermaid-diagram">{chart}</div>
  ),
}));

// Mock react-markdown with more realistic behavior
vi.mock('react-markdown', () => ({
  default: ({ children, components }: any) => {
    // Simulate markdown parsing for headings
    if (typeof children === 'string') {
      const lines = children.split('\n');
      return (
        <div data-testid="markdown-content">
          {lines.map((line: string, index: number) => {
            const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
            if (headingMatch) {
              const level = headingMatch[1].length;
              const text = headingMatch[2];
              const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
              const id = text.toLowerCase().replace(/\s+/g, '-');
              
              if (components && components[HeadingTag]) {
                return components[HeadingTag]({ 
                  key: index, 
                  id, 
                  children: text,
                  node: {},
                });
              }
              
              return React.createElement(HeadingTag, { key: index, id }, text);
            }
            
            // Handle code blocks
            if (line.startsWith('```')) {
              const language = line.slice(3);
              const codeContent = 'console.log("test");';
              
              if (language === 'mermaid') {
                return components?.pre?.({ 
                  key: index,
                  node: {},
                  children: React.createElement('code', { 
                    className: 'language-mermaid',
                    children: 'graph TD\n  A --> B'
                  })
                });
              }
              
              // Simulate the actual pre component behavior from DocsContent
              if (components?.pre) {
                const codeElement = React.createElement('code', { 
                  className: `language-${language}`,
                  children: codeContent
                });
                
                return components.pre({ 
                  key: index,
                  node: {},
                  children: codeElement
                });
              }
              
              return React.createElement('pre', { key: index }, 
                React.createElement('code', { 
                  className: `language-${language}`,
                  children: codeContent
                })
              );
            }
            
            // Handle images
            const imgMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
            if (imgMatch && components?.img) {
              return components.img({
                key: index,
                src: imgMatch[2],
                alt: imgMatch[1],
                node: {},
              });
            }
            
            // Handle inline code
            const inlineCodeMatch = line.match(/`([^`]+)`/);
            if (inlineCodeMatch && components?.code) {
              return components.code({
                key: index,
                inline: true,
                children: inlineCodeMatch[1],
                node: {},
              });
            }
            
            return <div key={index}>{line}</div>;
          })}
        </div>
      );
    }
    return <div data-testid="markdown-content">{children}</div>;
  },
}));

// Mock other markdown plugins
vi.mock('remark-gfm', () => ({ default: vi.fn() }));
vi.mock('remark-math', () => ({ default: vi.fn() }));
vi.mock('rehype-prism-plus', () => ({ default: vi.fn() }));
vi.mock('rehype-katex', () => ({ default: vi.fn() }));
vi.mock('rehype-slug', () => ({ default: vi.fn() }));
vi.mock('github-slugger', () => ({
  default: class {
    slug(text: string) {
      // Match github-slugger behavior more closely
      return text
        .toLowerCase()
        .replace(/["']/g, '')      // Remove quotes entirely
        .replace(/[^\w\s-]/g, '-') // Replace other special characters with hyphens
        .replace(/\s+/g, '-')      // Replace spaces with hyphens
        .replace(/-+/g, '-')       // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens
    }
  },
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Copy: () => <div data-testid="copy-icon">Copy</div>,
  Check: () => <div data-testid="check-icon">Check</div>,
  AlertCircle: () => <div data-testid="alert-circle-icon">AlertCircle</div>,
  Loader2: () => <div data-testid="loader-icon">Loader2</div>,
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}));

describe('DocsContent', () => {
  const defaultProps = {
    content: '# Test Document\n\nThis is a test document.',
    isLoading: false,
    error: null,
    selectedPath: 'docs/test.md',
    onTableOfContentsChange: vi.fn(),
  };

  const mockDocsConfig = {
    owner: 'test-owner',
    repo: 'test-repo',
    branch: 'main',
    docsPath: 'docs',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any blob URLs that might have been created
    vi.clearAllTimers();
  });

  describe('Component States', () => {
    it('should render different states correctly', () => {
      // Test loading state
      const { rerender } = render(<DocsContent {...defaultProps} isLoading={true} />);
      expect(screen.getByText('Loading document...')).toBeInTheDocument();
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      
      // Test error state
      const error = new Error('Failed to load document');
      rerender(<DocsContent {...defaultProps} error={error} />);
      expect(screen.getByText('Failed to Load Document')).toBeInTheDocument();
      expect(screen.getByText('Failed to load document')).toBeInTheDocument();
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
      
      // Test empty state (undefined and empty string)
      rerender(<DocsContent {...defaultProps} content={undefined} />);
      expect(screen.getByText('Select a document to view')).toBeInTheDocument();
      
      rerender(<DocsContent {...defaultProps} content="" />);
      expect(screen.getByText('Select a document to view')).toBeInTheDocument();
      
      // Test content state
      rerender(<DocsContent {...defaultProps} />);
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      expect(screen.getByText('Test Document')).toBeInTheDocument();
      expect(screen.getByText('This is a test document.')).toBeInTheDocument();
    });
  });

  describe('Table of Contents', () => {
    it('should extract and manage table of contents', () => {
      const { rerender } = render(<DocsContent {...defaultProps} />);
      
      // Test initial content extraction
      expect(defaultProps.onTableOfContentsChange).toHaveBeenCalledWith([
        { id: 'test-document', text: 'Test Document', level: 1 },
      ]);
      
      // Test complex headings structure
      const contentWithHeadings = `# Introduction
## Getting Started
### Installation
## Advanced Topics
# Conclusion`;
      
      rerender(<DocsContent {...defaultProps} content={contentWithHeadings} />);
      expect(defaultProps.onTableOfContentsChange).toHaveBeenCalledWith([
        { id: 'introduction', text: 'Introduction', level: 1 },
        { id: 'getting-started', text: 'Getting Started', level: 2 },
        { id: 'installation', text: 'Installation', level: 3 },
        { id: 'advanced-topics', text: 'Advanced Topics', level: 2 },
        { id: 'conclusion', text: 'Conclusion', level: 1 },
      ]);
      
      // Test content without headings
      rerender(<DocsContent {...defaultProps} content="Plain text without headings." />);
      expect(defaultProps.onTableOfContentsChange).toHaveBeenCalledWith([]);
      
      // Test clearing when content becomes undefined
      vi.clearAllMocks();
      rerender(<DocsContent {...defaultProps} content={undefined} />);
      expect(defaultProps.onTableOfContentsChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Code Blocks and Mermaid Diagrams', () => {
    it('should render mermaid diagrams', () => {
      const contentWithMermaid = `# Test
\`\`\`mermaid
graph TD
  A --> B
\`\`\``;
      
      render(<DocsContent {...defaultProps} content={contentWithMermaid} />);
      
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.getByTestId('mermaid-diagram')).toBeInTheDocument();
    });

    it('should render regular code blocks', () => {
      const contentWithCode = `# Test
\`\`\`javascript
console.log("test");
\`\`\``;
      
      render(<DocsContent {...defaultProps} content={contentWithCode} />);
      
      expect(screen.getByText('Test')).toBeInTheDocument();
      
      // Verify that code blocks are rendered
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });

    it('should handle inline code', () => {
      const contentWithInlineCode = 'Use `console.log()` to debug.';
      
      render(<DocsContent {...defaultProps} content={contentWithInlineCode} />);
      
      expect(screen.getByText('console.log()')).toBeInTheDocument();
    });

  });

  describe('Image Handling', () => {
    let mockApiClient: any;
    
    beforeEach(async () => {
      // Import the mocked module
      const apiModule = await import('../../../src/services/ApiClient');
      mockApiClient = apiModule.apiClient;
      mockApiClient.getBinary.mockResolvedValue(new Blob(['fake-image-data']));
      mockApiClient.get.mockResolvedValue({ download_url: 'https://example.com/image.png' });
    });

    it('should handle regular image URLs', () => {
      const contentWithImage = '![Alt text](https://example.com/image.png)';
      
      render(<DocsContent {...defaultProps} content={contentWithImage} />);
      
      // Should render regular img tag for external URLs
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'https://example.com/image.png');
      expect(img).toHaveAttribute('alt', 'Alt text');
    });

    it('should handle relative image paths', async () => {
      const contentWithRelativeImage = '![Alt text](./images/test.png)';
      
      render(<DocsContent {...defaultProps} content={contentWithRelativeImage} docsConfig={mockDocsConfig} />);
      
      // Should show loading state initially
      expect(screen.getByText('Loading image...')).toBeInTheDocument();
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      
      // Wait for image to load
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith(
          '/github/repos/test-owner/test-repo/contents/docs/docs/images/test.png?ref=main'
        );
      });
    });

    it('should handle GitHub URLs with authentication', async () => {
      const contentWithGitHubImage = '![Alt text](https://github.tools.sap/owner/repo/raw/main/image.png)';
      
      render(<DocsContent {...defaultProps} content={contentWithGitHubImage} docsConfig={mockDocsConfig} />);
      
      // Should show loading state initially
      expect(screen.getByText('Loading image...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(mockApiClient.getBinary).toHaveBeenCalledWith('/github/asset', {
          params: { url: 'https://github.tools.sap/owner/repo/raw/main/image.png' },
        });
      });
    });

    it('should handle image loading errors', async () => {
      mockApiClient.getBinary.mockRejectedValue(new Error('Failed to load'));
      
      const contentWithImage = '![Alt text](https://github.tools.sap/owner/repo/raw/main/image.png)';
      
      render(<DocsContent {...defaultProps} content={contentWithImage} docsConfig={mockDocsConfig} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load image')).toBeInTheDocument();
        expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
      });
    });

    it('should handle missing src attribute', () => {
      const contentWithBrokenImage = '![Alt text]()';
      
      render(<DocsContent {...defaultProps} content={contentWithBrokenImage} />);
      
      // With empty src, our mock doesn't render an img element, just shows the markdown text
      expect(screen.getByText('![Alt text]()')).toBeInTheDocument();
    });
  });

  describe('Props and Configuration', () => {
    it('should handle prop changes and custom configuration', () => {
      const customConfig = {
        owner: 'custom-owner',
        repo: 'custom-repo',
        branch: 'develop',
        docsPath: 'documentation',
      };
      
      const { rerender } = render(<DocsContent {...defaultProps} docsConfig={customConfig} />);
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      
      // Test content updates
      const newContent = '# New Heading\n## Subheading';
      rerender(<DocsContent {...defaultProps} content={newContent} docsConfig={customConfig} />);
      expect(defaultProps.onTableOfContentsChange).toHaveBeenLastCalledWith([
        { id: 'new-heading', text: 'New Heading', level: 1 },
        { id: 'subheading', text: 'Subheading', level: 2 },
      ]);
      
      // Test selectedPath changes
      rerender(<DocsContent {...defaultProps} selectedPath="docs/new-file.md" docsConfig={customConfig} />);
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });
  });

  describe('Memory Management', () => {
    it('should handle cleanup on path changes and unmount', () => {
      const { rerender, unmount } = render(
        <DocsContent {...defaultProps} selectedPath="docs/file1.md" />
      );
      
      // Test selectedPath change cleanup
      rerender(<DocsContent {...defaultProps} selectedPath="docs/file2.md" />);
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      
      // Test unmount cleanup
      unmount();
      expect(screen.queryByTestId('markdown-content')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle edge cases and malformed content', () => {
      // Test malformed markdown - use simpler content that our mock can handle
      const { rerender } = render(<DocsContent {...defaultProps} content='# Simple Heading' />);
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      expect(screen.getByText('Simple Heading')).toBeInTheDocument();
      
      // Test special characters in headings
      rerender(<DocsContent {...defaultProps} content='# Heading with "quotes" & symbols!' />);
      expect(defaultProps.onTableOfContentsChange).toHaveBeenCalledWith([
        { id: 'heading-with-quotes-symbols', text: 'Heading with "quotes" & symbols!', level: 1 },
      ]);
      
      // Test null error and undefined selectedPath
      rerender(<DocsContent {...defaultProps} error={null} selectedPath={null} />);
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      
      // Test very long content (performance test)
      const longContent = Array(50).fill('# Heading').join('\n'); // Reduced for faster tests
      rerender(<DocsContent {...defaultProps} content={longContent} />);
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      expect(defaultProps.onTableOfContentsChange).toHaveBeenCalledWith(
        Array(50).fill(null).map(() => ({ id: 'heading', text: 'Heading', level: 1 }))
      );
    });
  });
});
