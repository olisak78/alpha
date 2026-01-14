import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BaseBody, PluginBody } from '@/plugins/components/PluginBody';

// Mock theme store
vi.mock('@/stores/themeStore', () => ({
  useTheme: vi.fn(() => ({
    actualTheme: 'light',
  })),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Loader2: ({ className }: { className?: string }) => (
    <div data-testid="loader-icon" className={className}>
      Loading
    </div>
  ),
  AlertCircle: ({ className }: { className?: string }) => (
    <div data-testid="alert-icon" className={className}>
      Alert
    </div>
  ),
  RefreshCw: ({ className }: { className?: string }) => (
    <div data-testid="refresh-icon" className={className}>
      Refresh
    </div>
  ),
}));

describe('PluginBody', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Exports', () => {
    it('should export BaseBody and PluginBody', () => {
      expect(BaseBody).toBeDefined();
      expect(PluginBody).toBeDefined();
    });

    it('should have PluginBody as alias of BaseBody', () => {
      expect(PluginBody).toBe(BaseBody);
    });
  });

  describe('Content State (Default)', () => {
    it('should render children when no loading or error', () => {
      render(
        <BaseBody>
          <div data-testid="test-content">Test Content</div>
        </BaseBody>
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should apply default minHeight to content container', () => {
      const { container } = render(
        <BaseBody>
          <div>Content</div>
        </BaseBody>
      );

      const contentContainer = container.firstChild;
      expect(contentContainer).toHaveStyle({ minHeight: '400px' });
    });

    it('should apply custom minHeight to content container', () => {
      const { container } = render(
        <BaseBody minHeight="600px">
          <div>Content</div>
        </BaseBody>
      );

      const contentContainer = container.firstChild;
      expect(contentContainer).toHaveStyle({ minHeight: '600px' });
    });

    it('should render complex children', () => {
      render(
        <BaseBody>
          <div data-testid="parent">
            <h1>Title</h1>
            <p>Paragraph</p>
            <button>Button</button>
          </div>
        </BaseBody>
      );

      expect(screen.getByTestId('parent')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
      expect(screen.getByText('Button')).toBeInTheDocument();
    });

    it('should render content container', () => {
      const { container } = render(
        <BaseBody>
          <div>Content</div>
        </BaseBody>
      );

      const contentContainer = container.firstChild;
      expect(contentContainer).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should render loading state when isLoading is true', () => {
      render(
        <BaseBody isLoading={true}>
          <div data-testid="test-content">Should not render</div>
        </BaseBody>
      );

      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    });

    it('should display default loading message', () => {
      render(<BaseBody isLoading={true}>Content</BaseBody>);

      expect(screen.getByText('Loading plugin...')).toBeInTheDocument();
    });

    it('should display custom loading message', () => {
      render(
        <BaseBody isLoading={true} loadingMessage="Fetching data...">
          Content
        </BaseBody>
      );

      expect(screen.getByText('Fetching data...')).toBeInTheDocument();
      expect(screen.queryByText('Loading plugin...')).not.toBeInTheDocument();
    });

    it('should apply minHeight to loading container', () => {
      const { container } = render(
        <BaseBody isLoading={true} minHeight="500px">
          Content
        </BaseBody>
      );

      const loadingContainer = container.querySelector('.flex.flex-col');
      expect(loadingContainer).toHaveStyle({ minHeight: '500px' });
    });

    it('should have loader icon with animate-spin class', () => {
      render(<BaseBody isLoading={true}>Content</BaseBody>);

      const loader = screen.getByTestId('loader-icon');
      expect(loader).toHaveClass('animate-spin');
    });

    it('should center loading content', () => {
      const { container } = render(
        <BaseBody isLoading={true}>Content</BaseBody>
      );

      const loadingContainer = container.querySelector('.flex.flex-col');
      expect(loadingContainer).toHaveClass('items-center');
      expect(loadingContainer).toHaveClass('justify-center');
    });

    it('should apply padding to loading container', () => {
      const { container } = render(
        <BaseBody isLoading={true}>Content</BaseBody>
      );

      const loadingContainer = container.querySelector('.flex.flex-col');
      expect(loadingContainer).toHaveClass('p-12');
    });
  });

  describe('Loading State - Theme Variations', () => {
    it('should apply dark theme styles to loader in dark mode', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'dark',
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      render(<BaseBody isLoading={true}>Content</BaseBody>);

      const loader = screen.getByTestId('loader-icon');
      expect(loader.className).toContain('text-gray-400');
    });

    it('should apply light theme styles to loader in light mode', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'light',
        theme: 'light',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      render(<BaseBody isLoading={true}>Content</BaseBody>);

      const loader = screen.getByTestId('loader-icon');
      expect(loader.className).toContain('text-gray-600');
    });

    it('should apply dark theme styles to loading message in dark mode', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'dark',
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      const { container } = render(
        <BaseBody isLoading={true}>Content</BaseBody>
      );

      const message = container.querySelector('p');
      expect(message?.className).toContain('text-gray-400');
    });

    it('should apply light theme styles to loading message in light mode', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'light',
        theme: 'light',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      const { container } = render(
        <BaseBody isLoading={true}>Content</BaseBody>
      );

      const message = container.querySelector('p');
      expect(message?.className).toContain('text-gray-600');
    });
  });

  describe('Error State', () => {
    it('should render error state when error is provided as string', () => {
      render(
        <BaseBody error="Something went wrong">
          <div data-testid="test-content">Should not render</div>
        </BaseBody>
      );

      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    });

    it('should render error state when error is provided as Error object', () => {
      const error = new Error('Network error occurred');
      render(
        <BaseBody error={error}>
          <div data-testid="test-content">Should not render</div>
        </BaseBody>
      );

      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
      expect(screen.getByText('Network error occurred')).toBeInTheDocument();
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    });

    it('should display "Plugin Error" heading', () => {
      render(<BaseBody error="Error message">Content</BaseBody>);

      expect(screen.getByText('Plugin Error')).toBeInTheDocument();
    });

    it('should apply minHeight to error container', () => {
      const { container } = render(
        <BaseBody error="Error" minHeight="550px">
          Content
        </BaseBody>
      );

      const errorContainer = container.querySelector('.flex.flex-col');
      expect(errorContainer).toHaveStyle({ minHeight: '550px' });
    });

    it('should center error content', () => {
      const { container } = render(<BaseBody error="Error">Content</BaseBody>);

      const errorContainer = container.querySelector('.flex.flex-col');
      expect(errorContainer).toHaveClass('items-center');
      expect(errorContainer).toHaveClass('justify-center');
    });

    it('should apply padding to error container', () => {
      const { container } = render(<BaseBody error="Error">Content</BaseBody>);

      const errorContainer = container.querySelector('.flex.flex-col');
      expect(errorContainer).toHaveClass('p-12');
    });

    it('should render retry button when onRetry is provided', () => {
      const onRetry = vi.fn();
      render(
        <BaseBody error="Error" onRetry={onRetry}>
          Content
        </BaseBody>
      );

      expect(screen.getByText('Retry')).toBeInTheDocument();
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    });

    it('should not render retry button when onRetry is not provided', () => {
      render(<BaseBody error="Error">Content</BaseBody>);

      expect(screen.queryByText('Retry')).not.toBeInTheDocument();
      expect(screen.queryByTestId('refresh-icon')).not.toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      render(
        <BaseBody error="Error" onRetry={onRetry}>
          Content
        </BaseBody>
      );

      const retryButton = screen.getByText('Retry');
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry multiple times when clicked multiple times', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      render(
        <BaseBody error="Error" onRetry={onRetry}>
          Content
        </BaseBody>
      );

      const retryButton = screen.getByText('Retry');
      await user.click(retryButton);
      await user.click(retryButton);
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error State - Theme Variations', () => {
    it('should apply dark theme styles to error icon background in dark mode', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'dark',
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      const { container } = render(<BaseBody error="Error">Content</BaseBody>);

      const iconBackground = container.querySelector('.rounded-full');
      expect(iconBackground?.className).toContain('bg-red-900/20');
    });

    it('should apply light theme styles to error icon background in light mode', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'light',
        theme: 'light',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      const { container } = render(<BaseBody error="Error">Content</BaseBody>);

      const iconBackground = container.querySelector('.rounded-full');
      expect(iconBackground?.className).toContain('bg-red-50');
    });

    it('should apply dark theme styles to error icon in dark mode', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'dark',
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      render(<BaseBody error="Error">Content</BaseBody>);

      const icon = screen.getByTestId('alert-icon');
      expect(icon.className).toContain('text-red-400');
    });

    it('should apply light theme styles to error icon in light mode', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'light',
        theme: 'light',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      render(<BaseBody error="Error">Content</BaseBody>);

      const icon = screen.getByTestId('alert-icon');
      expect(icon.className).toContain('text-red-600');
    });

    it('should apply dark theme styles to error heading in dark mode', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'dark',
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      render(<BaseBody error="Error">Content</BaseBody>);

      const heading = screen.getByText('Plugin Error');
      expect(heading.className).toContain('text-gray-100');
    });

    it('should apply light theme styles to error heading in light mode', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'light',
        theme: 'light',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      render(<BaseBody error="Error">Content</BaseBody>);

      const heading = screen.getByText('Plugin Error');
      expect(heading.className).toContain('text-gray-900');
    });

    it('should apply dark theme styles to error message in dark mode', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'dark',
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      render(<BaseBody error="Test error message">Content</BaseBody>);

      const message = screen.getByText('Test error message');
      expect(message.className).toContain('text-gray-400');
    });

    it('should apply light theme styles to error message in light mode', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'light',
        theme: 'light',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      render(<BaseBody error="Test error message">Content</BaseBody>);

      const message = screen.getByText('Test error message');
      expect(message.className).toContain('text-gray-600');
    });

    it('should apply dark theme styles to retry button in dark mode', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'dark',
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      render(
        <BaseBody error="Error" onRetry={vi.fn()}>
          Content
        </BaseBody>
      );

      const button = screen.getByText('Retry').closest('button');
      expect(button?.className).toContain('bg-gray-700');
      expect(button?.className).toContain('hover:bg-gray-600');
      expect(button?.className).toContain('text-gray-200');
    });

    it('should apply light theme styles to retry button in light mode', async () => {
      const { useTheme } = await import('@/stores/themeStore');
      vi.mocked(useTheme).mockReturnValue({
        actualTheme: 'light',
        theme: 'light',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      });

      render(
        <BaseBody error="Error" onRetry={vi.fn()}>
          Content
        </BaseBody>
      );

      const button = screen.getByText('Retry').closest('button');
      expect(button?.className).toContain('bg-gray-100');
      expect(button?.className).toContain('hover:bg-gray-200');
      expect(button?.className).toContain('text-gray-900');
    });
  });

  describe('State Priority', () => {
    it('should prioritize loading state over error state', () => {
      render(
        <BaseBody isLoading={true} error="Error">
          <div data-testid="test-content">Content</div>
        </BaseBody>
      );

      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('alert-icon')).not.toBeInTheDocument();
      expect(screen.queryByText('Error')).not.toBeInTheDocument();
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    });

    it('should prioritize loading state over content', () => {
      render(
        <BaseBody isLoading={true}>
          <div data-testid="test-content">Content</div>
        </BaseBody>
      );

      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    });

    it('should prioritize error state over content', () => {
      render(
        <BaseBody error="Error">
          <div data-testid="test-content">Content</div>
        </BaseBody>
      );

      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    });

    it('should show content when neither loading nor error', () => {
      render(
        <BaseBody isLoading={false} error={null}>
          <div data-testid="test-content">Content</div>
        </BaseBody>
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      expect(screen.queryByTestId('loader-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('alert-icon')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string error as falsy (show content)', () => {
      render(
        <BaseBody error="">
          <div data-testid="test-content">Content</div>
        </BaseBody>
      );

      // Empty string is falsy, so error state should NOT render
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      expect(screen.queryByTestId('alert-icon')).not.toBeInTheDocument();
      expect(screen.queryByText('Plugin Error')).not.toBeInTheDocument();
    });

    it('should handle non-empty string error (show error)', () => {
      render(
        <BaseBody error="Actual error">
          <div data-testid="test-content">Content</div>
        </BaseBody>
      );

      // Non-empty string is truthy, so error state should render
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
      expect(screen.getByText('Actual error')).toBeInTheDocument();
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    });

    it('should handle null error (show content)', () => {
      render(
        <BaseBody error={null}>
          <div data-testid="test-content">Content</div>
        </BaseBody>
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      expect(screen.queryByTestId('alert-icon')).not.toBeInTheDocument();
    });

    it('should handle undefined error (show content)', () => {
      render(
        <BaseBody error={undefined}>
          <div data-testid="test-content">Content</div>
        </BaseBody>
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      expect(screen.queryByTestId('alert-icon')).not.toBeInTheDocument();
    });

    it('should handle empty loading message', () => {
      const { container } = render(
        <BaseBody isLoading={true} loadingMessage="">
          Content
        </BaseBody>
      );

      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      // Empty message should still render as empty p tag
      const message = container.querySelector('p');
      expect(message).toBeInTheDocument();
      expect(message?.textContent).toBe('');
    });

    it('should handle very long error message', () => {
      const longError =
        'This is a very long error message that should still render correctly and be contained within the max-width constraint of the error message container.';

      render(<BaseBody error={longError}>Content</BaseBody>);

      expect(screen.getByText(longError)).toBeInTheDocument();
      const message = screen.getByText(longError);
      expect(message.className).toContain('max-w-md');
    });

    it('should handle minHeight with different units', () => {
      const { container: pxContainer } = render(
        <BaseBody minHeight="500px">Content</BaseBody>
      );
      const { container: remContainer } = render(
        <BaseBody minHeight="30rem">Content</BaseBody>
      );
      const { container: vhContainer } = render(
        <BaseBody minHeight="50vh">Content</BaseBody>
      );

      expect(pxContainer.firstChild).toHaveStyle({
        minHeight: '500px',
      });
      expect(remContainer.firstChild).toHaveStyle({
        minHeight: '30rem',
      });
      expect(vhContainer.firstChild).toHaveStyle({
        minHeight: '50vh',
      });
    });
  });

  describe('Accessibility', () => {
    it('should use semantic heading for error title', () => {
      render(<BaseBody error="Error">Content</BaseBody>);

      const heading = screen.getByText('Plugin Error');
      expect(heading.tagName).toBe('H3');
    });

    it('should center error message text', () => {
      render(<BaseBody error="Error message">Content</BaseBody>);

      const message = screen.getByText('Error message');
      expect(message.className).toContain('text-center');
    });

    it('should have clickable retry button', () => {
      render(
        <BaseBody error="Error" onRetry={vi.fn()}>
          Content
        </BaseBody>
      );

      const button = screen.getByText('Retry').closest('button');
      expect(button).toBeInTheDocument();
      expect(button?.tagName).toBe('BUTTON');
    });

    it('should have transition effects on retry button', () => {
      render(
        <BaseBody error="Error" onRetry={vi.fn()}>
          Content
        </BaseBody>
      );

      const button = screen.getByText('Retry').closest('button');
      expect(button?.className).toContain('transition-colors');
    });
  });

  describe('Snapshot', () => {
    it('should match snapshot for content state', () => {
      const { container } = render(
        <BaseBody>
          <div>Test Content</div>
        </BaseBody>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for loading state', () => {
      const { container } = render(<BaseBody isLoading={true}>Content</BaseBody>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for error state without retry', () => {
      const { container } = render(<BaseBody error="Error">Content</BaseBody>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for error state with retry', () => {
      const { container } = render(
        <BaseBody error="Error" onRetry={vi.fn()}>
          Content
        </BaseBody>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});