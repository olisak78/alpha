import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocsTableOfContents } from '../../../src/features/docs/components/DocsTableOfContents';
import { TableOfContentsItem } from '../../../src/features/docs/DocsPage';
import '@testing-library/jest-dom/vitest';

const mockTocItems: TableOfContentsItem[] = [
  { id: 'introduction', text: 'Introduction', level: 1 },
  { id: 'getting-started', text: 'Getting Started', level: 2 },
  { id: 'installation', text: 'Installation', level: 3 },
  { id: 'configuration', text: 'Configuration', level: 3 },
  { id: 'advanced-topics', text: 'Advanced Topics', level: 2 },
  { id: 'troubleshooting', text: 'Troubleshooting', level: 1 },
];

// Mock DOM methods
const mockScrollTo = vi.fn();
const mockGetBoundingClientRect = vi.fn();
const mockRequestAnimationFrame = vi.fn((callback) => {
  // Return a mock ID without calling the callback to avoid async issues
  return 1;
});

// Mock scroll container
const mockScrollContainer = {
  scrollTop: 0,
  getBoundingClientRect: () => ({
    top: 0,
    left: 0,
    bottom: 600,
    right: 800,
    width: 800,
    height: 600,
  }),
};

// Mock target element
const mockTargetElement = {
  getBoundingClientRect: () => ({
    top: 200,
    left: 0,
    bottom: 220,
    right: 800,
    width: 800,
    height: 20,
  }),
};

describe('DocsTableOfContents', () => {
  const defaultProps = {
    items: mockTocItems,
    activeId: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock DOM methods
    global.requestAnimationFrame = mockRequestAnimationFrame;
    
    // Mock document.getElementById
    vi.spyOn(document, 'getElementById').mockImplementation((id) => {
      if (id === 'docs-content-scroll-container') {
        return mockScrollContainer as any;
      }
      if (mockTocItems.some(item => item.id === id)) {
        return mockTargetElement as any;
      }
      return null;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
  });

  it('should render TOC heading and items correctly', () => {
    // Test with items
    const { rerender } = render(<DocsTableOfContents {...defaultProps} />);
    expect(screen.getByText('On This Page')).toBeInTheDocument();
    mockTocItems.forEach(item => {
      expect(screen.getByText(item.text)).toBeInTheDocument();
    });
    
    // Test empty state
    rerender(<DocsTableOfContents {...defaultProps} items={[]} />);
    expect(screen.queryByText('On This Page')).not.toBeInTheDocument();
  });

  it('should highlight active item', () => {
    render(<DocsTableOfContents {...defaultProps} activeId="getting-started" />);
    
    const activeButton = screen.getByRole('button', { name: 'Getting Started' });
    expect(activeButton).toHaveClass('text-blue-600', 'font-medium');
  });

  it('should apply proper indentation based on heading level', () => {
    render(<DocsTableOfContents {...defaultProps} />);
    
    const level1Button = screen.getByRole('button', { name: 'Introduction' });
    const level2Button = screen.getByRole('button', { name: 'Getting Started' });
    const level3Button = screen.getByRole('button', { name: 'Installation' });
    
    // Check that buttons have different padding based on level
    expect(level1Button.parentElement).toHaveStyle({ paddingLeft: '0px' });
    expect(level2Button.parentElement).toHaveStyle({ paddingLeft: '12px' });
    expect(level3Button.parentElement).toHaveStyle({ paddingLeft: '24px' });
  });

  it('should handle click events and scroll to target', () => {
    render(<DocsTableOfContents {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: 'Getting Started' });
    fireEvent.click(button);
    
    expect(document.getElementById).toHaveBeenCalledWith('getting-started');
    expect(document.getElementById).toHaveBeenCalledWith('docs-content-scroll-container');
  });

  it('should log error when target element is not found', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock getElementById to return null for the target element
    vi.spyOn(document, 'getElementById').mockImplementation((id) => {
      if (id === 'docs-content-scroll-container') {
        return mockScrollContainer as any;
      }
      return null; // Target element not found
    });
    
    render(<DocsTableOfContents {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: 'Getting Started' });
    fireEvent.click(button);
    
    expect(consoleSpy).toHaveBeenCalledWith('TOC Click - Element with ID not found:', 'getting-started');
    
    consoleSpy.mockRestore();
  });

  it('should log error when scroll container is not found', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock getElementById to return null for scroll container
    vi.spyOn(document, 'getElementById').mockImplementation((id) => {
      if (mockTocItems.some(item => item.id === id)) {
        return mockTargetElement as any;
      }
      return null; // Scroll container not found
    });
    
    render(<DocsTableOfContents {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: 'Getting Started' });
    fireEvent.click(button);
    
    expect(consoleSpy).toHaveBeenCalledWith('TOC Click - Scroll container not found');
    
    consoleSpy.mockRestore();
  });

  it('should have proper styling and dark mode support', () => {
    render(<DocsTableOfContents {...defaultProps} />);
    
    const heading = screen.getByText('On This Page');
    expect(heading).toHaveClass('text-sm', 'font-semibold', 'uppercase', 'tracking-wide');
    expect(heading.className).toContain('dark:text-white');
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('w-full', 'text-left', 'text-sm', 'transition-colors');
      expect(button.className).toContain('dark:hover:text-blue-400');
    });
  });

  it('should handle smooth scrolling animation', () => {
    let animationCallback: ((time: number) => void) | null = null;
    
    // Mock requestAnimationFrame to capture the callback
    global.requestAnimationFrame = vi.fn((callback: (time: number) => void) => {
      animationCallback = callback;
      return 1;
    });
    
    render(<DocsTableOfContents {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: 'Getting Started' });
    fireEvent.click(button);
    
    expect(global.requestAnimationFrame).toHaveBeenCalled();
    
    // Simulate animation frame
    if (animationCallback) {
      animationCallback(100);
    }
  });

  it('should render items in correct order', () => {
    render(<DocsTableOfContents {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    const buttonTexts = buttons.map(button => button.textContent);
    
    expect(buttonTexts).toEqual([
      'Introduction',
      'Getting Started',
      'Installation',
      'Configuration',
      'Advanced Topics',
      'Troubleshooting',
    ]);
  });

  it('should handle items with special characters in text', () => {
    const specialItems: TableOfContentsItem[] = [
      { id: 'api-reference', text: 'API Reference & Examples', level: 1 },
      { id: 'faq', text: 'FAQ (Frequently Asked Questions)', level: 2 },
    ];
    
    render(<DocsTableOfContents {...defaultProps} items={specialItems} />);
    
    expect(screen.getByText('API Reference & Examples')).toBeInTheDocument();
    expect(screen.getByText('FAQ (Frequently Asked Questions)')).toBeInTheDocument();
  });

  it('should maintain sticky positioning', () => {
    const { container } = render(<DocsTableOfContents {...defaultProps} />);
    
    const tocContainer = container.firstChild as HTMLElement;
    expect(tocContainer).toHaveClass('sticky', 'top-0', 'h-screen', 'overflow-y-auto');
  });
});
