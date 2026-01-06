import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import PluginCard from '@/plugins/components/PluginCard';
import type { PluginApiData } from '@/hooks/api/usePlugins';

// Mock hooks - create mocks inside factory to avoid hoisting issues
vi.mock('@/hooks/api/usePluginSubscriptions', () => ({
  useSubscribeToPlugin: vi.fn(),
  useUnsubscribeFromPlugin: vi.fn(),
}));

vi.mock('@/hooks/useAuthWithRole', () => ({
  useAuthWithRole: vi.fn(),
}));

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div data-testid="card" className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div data-testid="card-content" className={className}>{children}</div>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, variant }: any) => (
    <span data-testid="badge" data-variant={variant} className={className}>{children}</span>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, size, variant, ...props }: any) => (
    <button
      data-testid="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-size={size}
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <div data-testid="tooltip-provider">{children}</div>,
  Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ children, asChild }: any) => <div data-testid="tooltip-trigger">{children}</div>,
  TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
}));

// Mock icons
vi.mock('lucide-react', () => ({
  Edit: ({ className }: any) => <div data-testid="edit-icon" className={className}>Edit</div>,
  Pin: ({ className }: any) => <div data-testid="pin-icon" className={className}>Pin</div>,
  Trash2: ({ className }: any) => <div data-testid="trash-icon" className={className}>Trash</div>,
}));

// Mock models
vi.mock('@/plugins/models/models', () => ({
  DynamicIcon: ({ name, className }: any) => (
    <div data-testid="dynamic-icon" data-icon-name={name} className={className}>
      {name}
    </div>
  ),
  getCategoryColor: (category: string) => `color-${category.toLowerCase()}`,
}));

describe('PluginCard', () => {
  const mockPlugin: PluginApiData = {
    id: 'plugin-1',
    name: 'test-plugin',
    title: 'Test Plugin',
    description: 'A test plugin for unit testing',
    icon: 'TestIcon',
    category: 'Development',
    version: 'v1.0.0',
    owner: 'test-user@example.com',
    subscribed: false,
  };

  const mockOnOpen = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  const mockSubscribeMutate = vi.fn();
  const mockUnsubscribeMutate = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import the mocked modules to get references
    const { useSubscribeToPlugin, useUnsubscribeFromPlugin } = await import('@/hooks/api/usePluginSubscriptions');
    const { useAuthWithRole } = await import('@/hooks/useAuthWithRole');

    // Setup default mock implementations using vi.mocked()
    vi.mocked(useSubscribeToPlugin).mockReturnValue({
      mutate: mockSubscribeMutate,
      isPending: false,
    } as any);

    vi.mocked(useUnsubscribeFromPlugin).mockReturnValue({
      mutate: mockUnsubscribeMutate,
      isPending: false,
    } as any);

    vi.mocked(useAuthWithRole).mockReturnValue({
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test-user@example.com',
        portal_admin: false,
      },
      isLoading: false,
    } as any);
  });

  describe('Basic Rendering', () => {
    it('should render plugin card with all elements', () => {
      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
    });

    it('should display plugin title', () => {
      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Test Plugin')).toBeInTheDocument();
    });

    it('should display plugin description', () => {
      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('A test plugin for unit testing')).toBeInTheDocument();
    });

    it('should display default description when none provided', () => {
      const pluginWithoutDesc = { ...mockPlugin, description: '' };
      render(
        <PluginCard
          plugin={pluginWithoutDesc}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('No description provided')).toBeInTheDocument();
    });

    it('should display plugin icon', () => {
      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const icon = screen.getByTestId('dynamic-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('data-icon-name', 'TestIcon');
    });

    it('should display category badge', () => {
      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const badges = screen.getAllByTestId('badge');
      const categoryBadge = badges.find(badge => badge.textContent === 'Development');
      expect(categoryBadge).toBeInTheDocument();
    });

    it('should display version', () => {
      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    });

    it('should display plugin owner', () => {
      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(/By test-user@example.com/)).toBeInTheDocument();
    });

    it('should render pin icon', () => {
      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByTestId('pin-icon')).toBeInTheDocument();
    });

    it('should render Open button', () => {
      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Open')).toBeInTheDocument();
    });
  });

  describe('Default Values', () => {
    it('should use default category when not provided', () => {
      const pluginWithoutCategory = { ...mockPlugin, category: undefined };
      render(
        <PluginCard
          plugin={pluginWithoutCategory}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const badges = screen.getAllByTestId('badge');
      const categoryBadge = badges.find(badge => badge.textContent === 'Development');
      expect(categoryBadge).toBeInTheDocument();
    });

    it('should use default version when not provided', () => {
      const pluginWithoutVersion = { ...mockPlugin, version: undefined };
      render(
        <PluginCard
          plugin={pluginWithoutVersion}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    });

    it('should treat subscribed as false when not provided', () => {
      const pluginWithoutSubscribed = { ...mockPlugin, subscribed: undefined };
      render(
        <PluginCard
          plugin={pluginWithoutSubscribed}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const pinIcon = screen.getByTestId('pin-icon');
      expect(pinIcon).not.toHaveClass('fill-current');
    });
  });

  describe('Pin Functionality', () => {
    it('should show unpinned state when subscribed is false', () => {
      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const pinButton = screen.getByTestId('pin-icon').closest('button');
      expect(pinButton).toHaveAttribute('aria-label', 'Pin plugin');
      expect(pinButton).toHaveAttribute('title', 'Pin to sidebar');
    });

    it('should show pinned state when subscribed is true', () => {
      const pinnedPlugin = { ...mockPlugin, subscribed: true };
      render(
        <PluginCard
          plugin={pinnedPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const pinButton = screen.getByTestId('pin-icon').closest('button');
      expect(pinButton).toHaveAttribute('aria-label', 'Unpin plugin');
      expect(pinButton).toHaveAttribute('title', 'Unpin from sidebar');
      
      const pinIcon = screen.getByTestId('pin-icon');
      expect(pinIcon).toHaveClass('fill-current');
    });

    it('should call subscribe mutation when unpinned plugin is clicked', async () => {
      const user = userEvent.setup();
      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const pinButton = screen.getByTestId('pin-icon').closest('button');
      await user.click(pinButton!);

      expect(mockSubscribeMutate).toHaveBeenCalledWith('plugin-1');
      expect(mockUnsubscribeMutate).not.toHaveBeenCalled();
    });

    it('should call unsubscribe mutation when pinned plugin is clicked', async () => {
      const user = userEvent.setup();
      const pinnedPlugin = { ...mockPlugin, subscribed: true };
      render(
        <PluginCard
          plugin={pinnedPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const pinButton = screen.getByTestId('pin-icon').closest('button');
      await user.click(pinButton!);

      expect(mockUnsubscribeMutate).toHaveBeenCalledWith('plugin-1');
      expect(mockSubscribeMutate).not.toHaveBeenCalled();
    });

    it('should stop event propagation when pin is clicked', async () => {
      const user = userEvent.setup();
      const cardClickHandler = vi.fn();
      
      const { container } = render(
        <div onClick={cardClickHandler}>
          <PluginCard
            plugin={mockPlugin}
            onOpen={mockOnOpen}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
          />
        </div>
      );

      const pinButton = screen.getByTestId('pin-icon').closest('button');
      await user.click(pinButton!);

      expect(mockSubscribeMutate).toHaveBeenCalled();
      expect(cardClickHandler).not.toHaveBeenCalled();
    });

    it('should disable pin button when subscribe is pending', async () => {
      const { useSubscribeToPlugin } = await import('@/hooks/api/usePluginSubscriptions');
      vi.mocked(useSubscribeToPlugin).mockReturnValue({
        mutate: mockSubscribeMutate,
        isPending: true,
      } as any);

      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const pinButton = screen.getByTestId('pin-icon').closest('button');
      expect(pinButton).toBeDisabled();
    });

    it('should disable pin button when unsubscribe is pending', async () => {
      const { useUnsubscribeFromPlugin } = await import('@/hooks/api/usePluginSubscriptions');
      vi.mocked(useUnsubscribeFromPlugin).mockReturnValue({
        mutate: mockUnsubscribeMutate,
        isPending: true,
      } as any);

      const pinnedPlugin = { ...mockPlugin, subscribed: true };
      render(
        <PluginCard
          plugin={pinnedPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const pinButton = screen.getByTestId('pin-icon').closest('button');
      expect(pinButton).toBeDisabled();
    });
  });

  describe('Permission-Based Actions', () => {
    it('should show edit and delete buttons when user is plugin owner', async () => {
      const { useAuthWithRole } = await import('@/hooks/useAuthWithRole');
      vi.mocked(useAuthWithRole).mockReturnValue({
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test-user@example.com',
          portal_admin: false,
        },
        isLoading: false,
      } as any);

      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
      expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
    });

    it('should show edit and delete buttons when user is portal admin', async () => {
      const { useAuthWithRole } = await import('@/hooks/useAuthWithRole');
      vi.mocked(useAuthWithRole).mockReturnValue({
        user: {
          id: 'admin-1',
          name: 'Admin User',
          email: 'admin@example.com',
          portal_admin: true,
        },
        isLoading: false,
      } as any);

      const otherUserPlugin = { ...mockPlugin, owner: 'other-user@example.com' };
      render(
        <PluginCard
          plugin={otherUserPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
      expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
    });

    it('should hide edit and delete buttons when user is not owner and not admin', async () => {
      const { useAuthWithRole } = await import('@/hooks/useAuthWithRole');
      vi.mocked(useAuthWithRole).mockReturnValue({
        user: {
          id: 'user-2',
          name: 'Other User',
          email: 'other-user@example.com',
          portal_admin: false,
        },
        isLoading: false,
      } as any);

      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByTestId('edit-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('trash-icon')).not.toBeInTheDocument();
    });

    it('should hide edit and delete buttons when user is not authenticated', async () => {
      const { useAuthWithRole } = await import('@/hooks/useAuthWithRole');
      vi.mocked(useAuthWithRole).mockReturnValue({
        user: null,
        isLoading: false,
      } as any);

      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByTestId('edit-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('trash-icon')).not.toBeInTheDocument();
    });

    it('should match owner by user name', async () => {
      const { useAuthWithRole } = await import('@/hooks/useAuthWithRole');
      vi.mocked(useAuthWithRole).mockReturnValue({
        user: {
          id: 'user-1',
          name: 'test-user@example.com',
          email: 'different@example.com',
          portal_admin: false,
        },
        isLoading: false,
      } as any);

      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
      expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
    });

    it('should match owner by user email', async () => {
      const { useAuthWithRole } = await import('@/hooks/useAuthWithRole');
      vi.mocked(useAuthWithRole).mockReturnValue({
        user: {
          id: 'user-1',
          name: 'Different Name',
          email: 'test-user@example.com',
          portal_admin: false,
        },
        isLoading: false,
      } as any);

      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
      expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should call onOpen when Open button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const openButton = screen.getByText('Open');
      await user.click(openButton);

      expect(mockOnOpen).toHaveBeenCalledWith(mockPlugin);
      expect(mockOnOpen).toHaveBeenCalledTimes(1);
    });

    it('should call onEdit when Edit button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByTestId('edit-icon').closest('button');
      await user.click(editButton!);

      expect(mockOnEdit).toHaveBeenCalledWith(mockPlugin);
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('should call onDelete when Delete button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByTestId('trash-icon').closest('button');
      await user.click(deleteButton!);

      expect(mockOnDelete).toHaveBeenCalledWith(mockPlugin);
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it('should stop event propagation when Edit is clicked', async () => {
      const user = userEvent.setup();
      const cardClickHandler = vi.fn();
      
      render(
        <div onClick={cardClickHandler}>
          <PluginCard
            plugin={mockPlugin}
            onOpen={mockOnOpen}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
          />
        </div>
      );

      const editButton = screen.getByTestId('edit-icon').closest('button');
      await user.click(editButton!);

      expect(mockOnEdit).toHaveBeenCalled();
      expect(cardClickHandler).not.toHaveBeenCalled();
    });

    it('should stop event propagation when Delete is clicked', async () => {
      const user = userEvent.setup();
      const cardClickHandler = vi.fn();
      
      render(
        <div onClick={cardClickHandler}>
          <PluginCard
            plugin={mockPlugin}
            onOpen={mockOnOpen}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
          />
        </div>
      );

      const deleteButton = screen.getByTestId('trash-icon').closest('button');
      await user.click(deleteButton!);

      expect(mockOnDelete).toHaveBeenCalled();
      expect(cardClickHandler).not.toHaveBeenCalled();
    });

    it('should disable delete button when plugin is pinned', () => {
      const pinnedPlugin = { ...mockPlugin, subscribed: true };
      render(
        <PluginCard
          plugin={pinnedPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByTestId('trash-icon').closest('button');
      expect(deleteButton).toBeDisabled();
    });

    it('should enable delete button when plugin is not pinned', () => {
      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByTestId('trash-icon').closest('button');
      expect(deleteButton).not.toBeDisabled();
    });
  });

  describe('Tooltips', () => {
    it('should show edit tooltip', () => {
      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const tooltips = screen.getAllByTestId('tooltip-content');
      const editTooltip = tooltips.find(tooltip => tooltip.textContent === 'Edit plugin');
      expect(editTooltip).toBeInTheDocument();
    });

    it('should show delete tooltip when plugin is not pinned', () => {
      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const tooltips = screen.getAllByTestId('tooltip-content');
      const deleteTooltip = tooltips.find(tooltip => tooltip.textContent === 'Delete plugin');
      expect(deleteTooltip).toBeInTheDocument();
    });

    it('should show warning tooltip when plugin is pinned', () => {
      const pinnedPlugin = { ...mockPlugin, subscribed: true };
      render(
        <PluginCard
          plugin={pinnedPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const tooltips = screen.getAllByTestId('tooltip-content');
      const deleteTooltip = tooltips.find(tooltip => 
        tooltip.textContent === 'Unpin the plugin before deleting'
      );
      expect(deleteTooltip).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply hover shadow class to card', () => {
      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const card = screen.getByTestId('card');
      expect(card.className).toContain('hover:shadow-md');
    });

    it('should apply category color to badge', () => {
      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const badges = screen.getAllByTestId('badge');
      const categoryBadge = badges.find(badge => badge.textContent === 'Development');
      expect(categoryBadge?.className).toContain('color-development');
    });

    it('should apply destructive styling to delete button', () => {
      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByTestId('trash-icon').closest('button');
      expect(deleteButton?.className).toContain('text-destructive');
      expect(deleteButton?.className).toContain('hover:text-destructive');
    });
  });

  describe('Edge Cases', () => {
    it('should handle plugin with all optional fields missing', () => {
      const minimalPlugin: PluginApiData = {
        id: 'minimal',
        name: 'minimal',
        title: 'Minimal',
        description: '',
        owner: 'owner@example.com',
      };

      render(
        <PluginCard
          plugin={minimalPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Minimal')).toBeInTheDocument();
      expect(screen.getByText('No description provided')).toBeInTheDocument();
      expect(screen.getByText('Development')).toBeInTheDocument(); // Default category
      expect(screen.getByText('v1.0.0')).toBeInTheDocument(); // Default version
    });

    it('should handle very long title', () => {
      const longTitlePlugin = {
        ...mockPlugin,
        title: 'This is a very long plugin title that should be truncated with ellipsis',
      };

      const { container } = render(
        <PluginCard
          plugin={longTitlePlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const title = screen.getByText(longTitlePlugin.title);
      expect(title.className).toContain('truncate');
    });

    it('should handle plugin with special characters in title', () => {
      const specialCharsPlugin = {
        ...mockPlugin,
        title: 'Plugin with <special> & "characters"',
      };

      render(
        <PluginCard
          plugin={specialCharsPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Plugin with <special> & "characters"')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label for pin button when unpinned', () => {
      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const pinButton = screen.getByTestId('pin-icon').closest('button');
      expect(pinButton).toHaveAttribute('aria-label', 'Pin plugin');
    });

    it('should have proper aria-label for pin button when pinned', () => {
      const pinnedPlugin = { ...mockPlugin, subscribed: true };
      render(
        <PluginCard
          plugin={pinnedPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const pinButton = screen.getByTestId('pin-icon').closest('button');
      expect(pinButton).toHaveAttribute('aria-label', 'Unpin plugin');
    });

    it('should have proper title attribute for pin button', () => {
      render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const pinButton = screen.getByTestId('pin-icon').closest('button');
      expect(pinButton).toHaveAttribute('title', 'Pin to sidebar');
    });
  });

  describe('Snapshot', () => {
    it('should match snapshot for unpinned plugin as owner', () => {
      const { container } = render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for pinned plugin', () => {
      const pinnedPlugin = { ...mockPlugin, subscribed: true };
      const { container } = render(
        <PluginCard
          plugin={pinnedPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for non-owner view', async () => {
      const { useAuthWithRole } = await import('@/hooks/useAuthWithRole');
      vi.mocked(useAuthWithRole).mockReturnValue({
        user: {
          id: 'user-2',
          name: 'Other User',
          email: 'other@example.com',
          portal_admin: false,
        },
        isLoading: false,
      } as any);

      const { container } = render(
        <PluginCard
          plugin={mockPlugin}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});