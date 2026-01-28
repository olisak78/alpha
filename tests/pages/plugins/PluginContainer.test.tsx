import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BaseContainer, PluginContainer } from '@/plugins/components/PluginContainer';

// Mock theme store
vi.mock('@/stores/themeStore', () => ({
  useTheme: vi.fn(),
}));

describe('PluginContainer', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Default mock - light theme
    const { useTheme } = await import('@/stores/themeStore');
    vi.mocked(useTheme).mockReturnValue({
      actualTheme: 'light',
      theme: 'light',
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    });
  });

  describe('Component Exports', () => {
    it('should export BaseContainer', () => {
      expect(BaseContainer).toBeDefined();
      expect(typeof BaseContainer).toBe('function');
    });

    it('should export PluginContainer', () => {
      expect(PluginContainer).toBeDefined();
      expect(typeof PluginContainer).toBe('function');
    });

    it('should have PluginContainer as alias of BaseContainer', () => {
      expect(PluginContainer).toBe(BaseContainer);
    });
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      render(
        <BaseContainer>
          <div>Test Content</div>
        </BaseContainer>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      render(
        <BaseContainer>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </BaseContainer>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    it('should render complex children', () => {
      render(
        <BaseContainer>
          <div>
            <h1>Title</h1>
            <p>Paragraph</p>
            <button>Button</button>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        </BaseContainer>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
      expect(screen.getByText('Button')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('should render as a div element', () => {
      const { container } = render(
        <BaseContainer>
          <div>Content</div>
        </BaseContainer>
      );

      const mainContainer = container.firstChild;
      expect(mainContainer?.nodeName).toBe('DIV');
    });
  });

  describe('Default Styling', () => {
    it('should apply rounded-lg class', () => {
      const { container } = render(
        <BaseContainer>
          <div>Content</div>
        </BaseContainer>
      );

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('rounded-lg');
    });

    it('should apply border class', () => {
      const { container } = render(
        <BaseContainer>
          <div>Content</div>
        </BaseContainer>
      );

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('border');
    });

    it('should apply shadow-sm class', () => {
      const { container } = render(
        <BaseContainer>
          <div>Content</div>
        </BaseContainer>
      );

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('shadow-sm');
    });
  });

  describe('Light Theme Styling', () => {
    it('should apply light theme background in light mode', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'light',
        theme: 'light',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      const { container } = render(
        <BaseContainer>
          <div>Content</div>
        </BaseContainer>
      );

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('bg-white');
    });

    it('should apply light theme border in light mode', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'light',
        theme: 'light',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      const { container } = render(
        <BaseContainer>
          <div>Content</div>
        </BaseContainer>
      );

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('border-gray-200');
    });

    it('should not apply dark theme classes in light mode', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'light',
        theme: 'light',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      const { container } = render(
        <BaseContainer>
          <div>Content</div>
        </BaseContainer>
      );

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).not.toContain('bg-gray-800');
      expect(mainContainer.className).not.toContain('border-gray-700');
    });
  });

  describe('Dark Theme Styling', () => {
    it('should apply dark theme background in dark mode', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'dark',
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      const { container } = render(
        <BaseContainer>
          <div>Content</div>
        </BaseContainer>
      );

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('bg-gray-800');
    });

    it('should apply dark theme border in dark mode', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'dark',
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      const { container } = render(
        <BaseContainer>
          <div>Content</div>
        </BaseContainer>
      );

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('border-gray-700');
    });

    it('should not apply light theme classes in dark mode', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'dark',
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      const { container } = render(
        <BaseContainer>
          <div>Content</div>
        </BaseContainer>
      );

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).not.toContain('bg-white');
      expect(mainContainer.className).not.toContain('border-gray-200');
    });
  });

  describe('Theme Switching', () => {
    it('should update styles when theme changes from light to dark', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      
      // Start with light theme
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'light',
        theme: 'light',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      const { container, rerender } = render(
        <BaseContainer>
          <div>Content</div>
        </BaseContainer>
      );

      let mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('bg-white');
      expect(mainContainer.className).toContain('border-gray-200');

      // Switch to dark theme
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'dark',
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      rerender(
        <BaseContainer>
          <div>Content</div>
        </BaseContainer>
      );

      mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('bg-gray-800');
      expect(mainContainer.className).toContain('border-gray-700');
    });

    it('should update styles when theme changes from dark to light', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      
      // Start with dark theme
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'dark',
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      const { container, rerender } = render(
        <BaseContainer>
          <div>Content</div>
        </BaseContainer>
      );

      let mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('bg-gray-800');
      expect(mainContainer.className).toContain('border-gray-700');

      // Switch to light theme
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'light',
        theme: 'light',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      rerender(
        <BaseContainer>
          <div>Content</div>
        </BaseContainer>
      );

      mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('bg-white');
      expect(mainContainer.className).toContain('border-gray-200');
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className when provided', () => {
      const { container } = render(
        <BaseContainer className="custom-class">
          <div>Content</div>
        </BaseContainer>
      );

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('custom-class');
    });

    it('should apply multiple custom classes', () => {
      const { container } = render(
        <BaseContainer className="custom-1 custom-2 custom-3">
          <div>Content</div>
        </BaseContainer>
      );

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('custom-1');
      expect(mainContainer.className).toContain('custom-2');
      expect(mainContainer.className).toContain('custom-3');
    });

    it('should preserve default classes when custom className is provided', () => {
      const { container } = render(
        <BaseContainer className="custom-class">
          <div>Content</div>
        </BaseContainer>
      );

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('rounded-lg');
      expect(mainContainer.className).toContain('border');
      expect(mainContainer.className).toContain('shadow-sm');
      expect(mainContainer.className).toContain('custom-class');
    });

    it('should work without className prop (default empty string)', () => {
      const { container } = render(
        <BaseContainer>
          <div>Content</div>
        </BaseContainer>
      );

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('rounded-lg');
      expect(mainContainer.className).toContain('border');
    });

    it('should handle empty string className', () => {
      const { container } = render(
        <BaseContainer className="">
          <div>Content</div>
        </BaseContainer>
      );

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('rounded-lg');
      expect(mainContainer.className).toContain('border');
    });

    it('should apply utility classes from custom className', () => {
      const { container } = render(
        <BaseContainer className="p-4 m-2 flex">
          <div>Content</div>
        </BaseContainer>
      );

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('p-4');
      expect(mainContainer.className).toContain('m-2');
      expect(mainContainer.className).toContain('flex');
    });
  });

  describe('PluginContainer Alias', () => {
    it('should render with PluginContainer export', () => {
      render(
        <PluginContainer>
          <div data-testid="plugin-content">Plugin Content</div>
        </PluginContainer>
      );

      expect(screen.getByTestId('plugin-content')).toBeInTheDocument();
      expect(screen.getByText('Plugin Content')).toBeInTheDocument();
    });

    it('should apply same styles as BaseContainer', () => {
      const { container: baseContainer } = render(
        <BaseContainer>
          <div>Content</div>
        </BaseContainer>
      );

      const { container: pluginContainer } = render(
        <PluginContainer>
          <div>Content</div>
        </PluginContainer>
      );

      const baseElement = baseContainer.firstChild as HTMLElement;
      const pluginElement = pluginContainer.firstChild as HTMLElement;

      // Should have same base classes
      expect(baseElement.className).toContain('rounded-lg');
      expect(pluginElement.className).toContain('rounded-lg');
      
      expect(baseElement.className).toContain('border');
      expect(pluginElement.className).toContain('border');
      
      expect(baseElement.className).toContain('shadow-sm');
      expect(pluginElement.className).toContain('shadow-sm');
    });

    it('should accept same props as BaseContainer', () => {
      render(
        <PluginContainer className="test-class">
          <div data-testid="test-content">Test</div>
        </PluginContainer>
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null children gracefully', () => {
      expect(() => {
        render(<BaseContainer>{null}</BaseContainer>);
      }).not.toThrow();
    });

    it('should handle undefined children gracefully', () => {
      expect(() => {
        render(<BaseContainer>{undefined}</BaseContainer>);
      }).not.toThrow();
    });

    it('should handle text node as children', () => {
      render(<BaseContainer>Plain text content</BaseContainer>);

      expect(screen.getByText('Plain text content')).toBeInTheDocument();
    });

    it('should handle number as children', () => {
      render(<BaseContainer>{42}</BaseContainer>);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should handle boolean children (not rendered)', () => {
      const { container } = render(
        <BaseContainer>
          {true}
          {false}
        </BaseContainer>
      );

      // Booleans are not rendered in React
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.textContent).toBe('');
    });

    it('should handle array of children', () => {
      const children = [
        <div key="1">Item 1</div>,
        <div key="2">Item 2</div>,
        <div key="3">Item 3</div>,
      ];

      render(<BaseContainer>{children}</BaseContainer>);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });

    it('should handle fragment children', () => {
      render(
        <BaseContainer>
          <>
            <div>Fragment Child 1</div>
            <div>Fragment Child 2</div>
          </>
        </BaseContainer>
      );

      expect(screen.getByText('Fragment Child 1')).toBeInTheDocument();
      expect(screen.getByText('Fragment Child 2')).toBeInTheDocument();
    });

    it('should handle nested containers', () => {
      render(
        <BaseContainer>
          <BaseContainer>
            <div>Nested Content</div>
          </BaseContainer>
        </BaseContainer>
      );

      expect(screen.getByText('Nested Content')).toBeInTheDocument();
    });

    it('should handle very long className strings', () => {
      const longClassName = 'class-1 class-2 class-3 class-4 class-5 class-6 class-7 class-8';
      
      const { container } = render(
        <BaseContainer className={longClassName}>
          <div>Content</div>
        </BaseContainer>
      );

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('class-1');
      expect(mainContainer.className).toContain('class-8');
    });
  });

  describe('Accessibility', () => {
    it('should not have any aria attributes by default', () => {
      const { container } = render(
        <BaseContainer>
          <div>Content</div>
        </BaseContainer>
      );

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.getAttribute('role')).toBeNull();
      expect(mainContainer.getAttribute('aria-label')).toBeNull();
    });

    it('should allow children to have accessibility attributes', () => {
      render(
        <BaseContainer>
          <button aria-label="Click me">Button</button>
        </BaseContainer>
      );

      const button = screen.getByLabelText('Click me');
      expect(button).toBeInTheDocument();
    });

    it('should preserve semantic HTML in children', () => {
      render(
        <BaseContainer>
          <header>Header</header>
          <main>Main Content</main>
          <footer>Footer</footer>
        </BaseContainer>
      );

      expect(screen.getByText('Header').tagName).toBe('HEADER');
      expect(screen.getByText('Main Content').tagName).toBe('MAIN');
      expect(screen.getByText('Footer').tagName).toBe('FOOTER');
    });
  });

  describe('Performance', () => {
    it('should render multiple containers efficiently', () => {
      const { container } = render(
        <>
          {Array.from({ length: 10 }, (_, i) => (
            <BaseContainer key={i}>
              <div>Container {i}</div>
            </BaseContainer>
          ))}
        </>
      );

      const containers = container.querySelectorAll('.rounded-lg');
      expect(containers).toHaveLength(10);
    });
  });

  describe('Snapshot', () => {
    it('should match snapshot in light theme', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'light',
        theme: 'light',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      const { container } = render(
        <BaseContainer>
          <div>Test Content</div>
        </BaseContainer>
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot in dark theme', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'dark',
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      const { container } = render(
        <BaseContainer>
          <div>Test Content</div>
        </BaseContainer>
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot with custom className', () => {
      const { container } = render(
        <BaseContainer className="custom-test-class">
          <div>Test Content</div>
        </BaseContainer>
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot using PluginContainer alias', () => {
      const { container } = render(
        <PluginContainer>
          <div>Plugin Content</div>
        </PluginContainer>
      );

      expect(container.firstChild).toMatchSnapshot();
    });
  });
});