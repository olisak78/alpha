import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BaseHeader, PluginHeader } from '@/plugins/components/PluginHeader';

// Mock theme store
vi.mock('@/stores/themeStore', () => ({
  useTheme: vi.fn(),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Puzzle: ({ className }: { className?: string }) => (
    <div data-testid="puzzle-icon" className={className}>Puzzle</div>
  ),
  Settings: ({ className }: { className?: string }) => (
    <div data-testid="settings-icon" className={className}>Settings</div>
  ),
  Box: ({ className }: { className?: string }) => (
    <div data-testid="box-icon" className={className}>Box</div>
  ),
  Zap: ({ className }: { className?: string }) => (
    <div data-testid="zap-icon" className={className}>Zap</div>
  ),
}));

describe('PluginHeader', () => {
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
    it('should export BaseHeader', () => {
      expect(BaseHeader).toBeDefined();
      expect(typeof BaseHeader).toBe('function');
    });

    it('should export PluginHeader', () => {
      expect(PluginHeader).toBeDefined();
      expect(typeof PluginHeader).toBe('function');
    });

    it('should have PluginHeader as alias of BaseHeader', () => {
      expect(PluginHeader).toBe(BaseHeader);
    });
  });

  describe('Basic Rendering', () => {
    it('should render with only title', () => {
      render(<BaseHeader title="Test Plugin" />);

      expect(screen.getByText('Test Plugin')).toBeInTheDocument();
    });

    it('should render title as h2 element', () => {
      render(<BaseHeader title="Test Plugin" />);

      const title = screen.getByText('Test Plugin');
      expect(title.tagName).toBe('H2');
    });

    it('should render with title and description', () => {
      render(
        <BaseHeader
          title="Test Plugin"
          description="This is a test plugin description"
        />
      );

      expect(screen.getByText('Test Plugin')).toBeInTheDocument();
      expect(screen.getByText('This is a test plugin description')).toBeInTheDocument();
    });

    it('should not render description when not provided', () => {
      render(<BaseHeader title="Test Plugin" />);

      const container = screen.getByText('Test Plugin').closest('div');
      const paragraphs = container?.querySelectorAll('p');
      expect(paragraphs?.length).toBe(0);
    });

    it('should render description as p element', () => {
      render(
        <BaseHeader
          title="Test Plugin"
          description="Test description"
        />
      );

      const description = screen.getByText('Test description');
      expect(description.tagName).toBe('P');
    });
  });

  describe('Icon Rendering', () => {
    it('should render icon when provided', () => {
      render(<BaseHeader title="Test Plugin" icon="Puzzle" />);

      expect(screen.getByTestId('puzzle-icon')).toBeInTheDocument();
    });

    it('should not render icon when not provided', () => {
      render(<BaseHeader title="Test Plugin" />);

      expect(screen.queryByTestId('puzzle-icon')).not.toBeInTheDocument();
    });

    it('should render different icons based on icon prop', () => {
      const { rerender } = render(<BaseHeader title="Test" icon="Puzzle" />);
      expect(screen.getByTestId('puzzle-icon')).toBeInTheDocument();

      rerender(<BaseHeader title="Test" icon="Settings" />);
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('puzzle-icon')).not.toBeInTheDocument();

      rerender(<BaseHeader title="Test" icon="Box" />);
      expect(screen.getByTestId('box-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('settings-icon')).not.toBeInTheDocument();
    });

    it('should apply correct icon size classes', () => {
      render(<BaseHeader title="Test Plugin" icon="Puzzle" />);

      const icon = screen.getByTestId('puzzle-icon');
      expect(icon).toHaveClass('w-5');
      expect(icon).toHaveClass('h-5');
    });

  });

  describe('Actions Rendering', () => {
    it('should render actions when provided', () => {
      render(
        <BaseHeader
          title="Test Plugin"
          actions={
            <button data-testid="action-button">Action</button>
          }
        />
      );

      expect(screen.getByTestId('action-button')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('should not render actions container when actions not provided', () => {
      const { container } = render(<BaseHeader title="Test Plugin" />);

      const actionsContainer = container.querySelector('.flex.items-center.space-x-2');
      expect(actionsContainer).not.toBeInTheDocument();
    });

    it('should render multiple action elements', () => {
      render(
        <BaseHeader
          title="Test Plugin"
          actions={
            <>
              <button data-testid="action-1">Edit</button>
              <button data-testid="action-2">Delete</button>
              <button data-testid="action-3">Share</button>
            </>
          }
        />
      );

      expect(screen.getByTestId('action-1')).toBeInTheDocument();
      expect(screen.getByTestId('action-2')).toBeInTheDocument();
      expect(screen.getByTestId('action-3')).toBeInTheDocument();
    });

    it('should render complex action components', () => {
      render(
        <BaseHeader
          title="Test Plugin"
          actions={
            <div data-testid="complex-actions">
              <span>Status: Active</span>
              <button>Configure</button>
            </div>
          }
        />
      );

      expect(screen.getByTestId('complex-actions')).toBeInTheDocument();
      expect(screen.getByText('Status: Active')).toBeInTheDocument();
      expect(screen.getByText('Configure')).toBeInTheDocument();
    });
  });

  describe('Light Theme Styling', () => {
    it('should apply light theme border color', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'light',
        theme: 'light',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      const { container } = render(<BaseHeader title="Test" />);

      const header = container.firstChild as HTMLElement;
      expect(header.className).toContain('border-gray-200');
    });

    it('should apply light theme title color', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'light',
        theme: 'light',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      render(<BaseHeader title="Test Plugin" />);

      const title = screen.getByText('Test Plugin');
      expect(title.className).toContain('text-gray-900');
    });

    it('should apply light theme description color', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'light',
        theme: 'light',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      render(
        <BaseHeader title="Test" description="Test description" />
      );

      const description = screen.getByText('Test description');
      expect(description.className).toContain('text-gray-600');
    });

    it('should apply light theme icon color', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'light',
        theme: 'light',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      const { container } = render(<BaseHeader title="Test" icon="Puzzle" />);

      const iconContainer = screen.getByTestId('puzzle-icon').parentElement;
      expect(iconContainer?.className).toContain('text-gray-600');
    });
  });

  describe('Dark Theme Styling', () => {
    it('should apply dark theme border color', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'dark',
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      const { container } = render(<BaseHeader title="Test" />);

      const header = container.firstChild as HTMLElement;
      expect(header.className).toContain('border-gray-700');
    });

    it('should apply dark theme title color', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'dark',
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      render(<BaseHeader title="Test Plugin" />);

      const title = screen.getByText('Test Plugin');
      expect(title.className).toContain('text-gray-100');
    });

    it('should apply dark theme description color', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'dark',
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      render(
        <BaseHeader title="Test" description="Test description" />
      );

      const description = screen.getByText('Test description');
      expect(description.className).toContain('text-gray-400');
    });

    it('should apply dark theme icon color', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'dark',
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      const { container } = render(<BaseHeader title="Test" icon="Puzzle" />);

      const iconContainer = screen.getByTestId('puzzle-icon').parentElement;
      expect(iconContainer?.className).toContain('text-gray-400');
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
        <BaseHeader title="Test" description="Description" icon="Puzzle" />
      );

      let header = container.firstChild as HTMLElement;
      expect(header.className).toContain('border-gray-200');
      
      let title = screen.getByText('Test');
      expect(title.className).toContain('text-gray-900');

      // Switch to dark theme
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'dark',
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      rerender(<BaseHeader title="Test" description="Description" icon="Puzzle" />);

      header = container.firstChild as HTMLElement;
      expect(header.className).toContain('border-gray-700');
      
      title = screen.getByText('Test');
      expect(title.className).toContain('text-gray-100');
    });
  });

  describe('Layout Structure', () => {
    it('should have border-b class on header', () => {
      const { container } = render(<BaseHeader title="Test" />);

      const header = container.firstChild as HTMLElement;
      expect(header.className).toContain('border-b');
    });

    it('should have padding classes on header', () => {
      const { container } = render(<BaseHeader title="Test" />);

      const header = container.firstChild as HTMLElement;
      expect(header.className).toContain('px-6');
      expect(header.className).toContain('py-4');
    });

    it('should have flex layout for header content', () => {
      const { container } = render(<BaseHeader title="Test" />);

      const flexContainer = container.querySelector('.flex.items-start.justify-between');
      expect(flexContainer).toBeInTheDocument();
    });

    it('should have space-x-3 between icon and text', () => {
      const { container } = render(
        <BaseHeader title="Test" icon="Puzzle" />
      );

      const iconTextContainer = container.querySelector('.flex.items-start.space-x-3');
      expect(iconTextContainer).toBeInTheDocument();
    });

    it('should apply mt-1 to icon container', () => {
      const { container } = render(
        <BaseHeader title="Test" icon="Puzzle" />
      );

      const iconContainer = screen.getByTestId('puzzle-icon').parentElement;
      expect(iconContainer?.className).toContain('mt-1');
    });

    it('should apply mt-1 to description', () => {
      render(
        <BaseHeader title="Test" description="Description" />
      );

      const description = screen.getByText('Description');
      expect(description.className).toContain('mt-1');
    });

    it('should have space-x-2 between actions', () => {
      const { container } = render(
        <BaseHeader
          title="Test"
          actions={
            <>
              <button>Action 1</button>
              <button>Action 2</button>
            </>
          }
        />
      );

      const actionsContainer = container.querySelector('.flex.items-center.space-x-2');
      expect(actionsContainer).toBeInTheDocument();
    });
  });

  describe('Typography', () => {
    it('should apply text-lg and font-semibold to title', () => {
      render(<BaseHeader title="Test Plugin" />);

      const title = screen.getByText('Test Plugin');
      expect(title.className).toContain('text-lg');
      expect(title.className).toContain('font-semibold');
    });

    it('should apply text-sm to description', () => {
      render(
        <BaseHeader title="Test" description="Description" />
      );

      const description = screen.getByText('Description');
      expect(description.className).toContain('text-sm');
    });
  });

  describe('Complete Composition', () => {
    it('should render all elements together', () => {
      render(
        <BaseHeader
          title="Complete Plugin"
          description="A complete plugin with all features"
          icon="Puzzle"
          actions={
            <button data-testid="action-btn">Action</button>
          }
        />
      );

      expect(screen.getByText('Complete Plugin')).toBeInTheDocument();
      expect(screen.getByText('A complete plugin with all features')).toBeInTheDocument();
      expect(screen.getByTestId('puzzle-icon')).toBeInTheDocument();
      expect(screen.getByTestId('action-btn')).toBeInTheDocument();
    });

    it('should maintain proper hierarchy with all elements', () => {
      const { container } = render(
        <BaseHeader
          title="Test"
          description="Description"
          icon="Puzzle"
          actions={<button>Action</button>}
        />
      );

      // Should have main flex container
      const mainFlex = container.querySelector('.flex.items-start.justify-between');
      expect(mainFlex).toBeInTheDocument();
      expect(mainFlex?.children).toHaveLength(2); // Left side and actions

      // Left side should have icon and text
      const leftSide = container.querySelector('.flex.items-start.space-x-3');
      expect(leftSide).toBeInTheDocument();
    });
  });

  describe('PluginHeader Alias', () => {
    it('should render with PluginHeader export', () => {
      render(<PluginHeader title="Plugin Header Test" />);

      expect(screen.getByText('Plugin Header Test')).toBeInTheDocument();
    });

    it('should apply same styles as BaseHeader', () => {
      const { container: baseContainer } = render(
        <BaseHeader title="Test" />
      );

      const { container: pluginContainer } = render(
        <PluginHeader title="Test" />
      );

      const baseHeader = baseContainer.firstChild as HTMLElement;
      const pluginHeader = pluginContainer.firstChild as HTMLElement;

      expect(baseHeader.className).toContain('px-6');
      expect(pluginHeader.className).toContain('px-6');
      
      expect(baseHeader.className).toContain('py-4');
      expect(pluginHeader.className).toContain('py-4');
      
      expect(baseHeader.className).toContain('border-b');
      expect(pluginHeader.className).toContain('border-b');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty title string', () => {
      render(<BaseHeader title="" />);

      const title = screen.getByRole('heading');
      expect(title).toBeInTheDocument();
      expect(title.textContent).toBe('');
    });

    it('should handle very long title', () => {
      const longTitle = 'This is a very long plugin title that might wrap to multiple lines';
      render(<BaseHeader title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle very long description', () => {
      const longDesc = 'This is a very long description that contains a lot of text and might wrap to multiple lines in the header component.';
      render(<BaseHeader title="Test" description={longDesc} />);

      expect(screen.getByText(longDesc)).toBeInTheDocument();
    });

    it('should handle special characters in title', () => {
      const specialTitle = 'Plugin <Title> & "Special" Characters';
      render(<BaseHeader title={specialTitle} />);

      expect(screen.getByText(specialTitle)).toBeInTheDocument();
    });

    it('should handle special characters in description', () => {
      const specialDesc = 'Description with <tags> & "quotes"';
      render(<BaseHeader title="Test" description={specialDesc} />);

      expect(screen.getByText(specialDesc)).toBeInTheDocument();
    });

    it('should handle null actions gracefully', () => {
      expect(() => {
        render(<BaseHeader title="Test" actions={null as any} />);
      }).not.toThrow();
    });

    it('should handle undefined actions gracefully', () => {
      expect(() => {
        render(<BaseHeader title="Test" actions={undefined} />);
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should use semantic heading element', () => {
      render(<BaseHeader title="Accessible Title" />);

      const heading = screen.getByRole('heading');
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toBe('Accessible Title');
    });

    it('should have proper heading level (h2)', () => {
      render(<BaseHeader title="Test" />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
    });

    it('should maintain action button accessibility', () => {
      render(
        <BaseHeader
          title="Test"
          actions={
            <button aria-label="Configure plugin">Configure</button>
          }
        />
      );

      const button = screen.getByLabelText('Configure plugin');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Snapshot', () => {
    it('should match snapshot with title only', () => {
      const { container } = render(<BaseHeader title="Test Plugin" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot with all props', () => {
      const { container } = render(
        <BaseHeader
          title="Complete Plugin"
          description="Full description"
          icon="Puzzle"
          actions={<button>Action</button>}
        />
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
        <BaseHeader title="Dark Theme" description="Description" icon="Puzzle" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});