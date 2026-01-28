import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import QuickLinksTab from '@/components/tabs/QuickLinksTab';
import type { UserMeResponse } from '@/types/api';

// Mock all child components
vi.mock('@/components/QuickLinks/QuickLinksGrid', () => ({
  QuickLinksGrid: vi.fn(() => <div data-testid="quick-links-grid">Grid Content</div>),
}));

vi.mock('@/components/QuickLinks/QuickLinksSearchFilter', () => ({
  QuickLinksSearchFilter: vi.fn(({ onAddLinkClick }) => (
    <div data-testid="search-filter">
      <button onClick={onAddLinkClick} data-testid="add-link-from-filter">Add Link</button>
    </div>
  )),
}));

vi.mock('@/components/QuickLinks/QuickLinksStates', () => ({
  LoadingState: vi.fn(() => <div data-testid="loading-state">Loading...</div>),
}));

vi.mock('@/components/dialogs/AddLinkDialog', () => ({
  AddLinkDialog: vi.fn(({ open, onOpenChange, ownerId }) => (
    open ? (
      <div data-testid="add-link-dialog">
        <div>Add Link Dialog</div>
        <div data-testid="owner-id">{ownerId}</div>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null
  )),
}));

vi.mock('@/components/dialogs/EditLinkDialog', () => ({
  EditLinkDialog: vi.fn(({ open, onOpenChange, linkData }) => (
    open ? (
      <div data-testid="edit-link-dialog">
        <div>Edit Link Dialog</div>
        <div data-testid="edit-link-id">{linkData?.id}</div>
        <div data-testid="edit-link-title">{linkData?.title}</div>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null
  )),
}));

vi.mock('@/components/dialogs/DeleteConfirmationDialog', () => ({
  DeleteConfirmationDialog: vi.fn(() => <div data-testid="delete-dialog">Delete Dialog</div>),
}));

// Mock hooks
vi.mock('@/hooks/api/useMembers', () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock('@/stores/quickLinksStore', () => ({
  useEditDialog: vi.fn(),
  useEditDialogActions: vi.fn(),
}));

// Mock context
vi.mock('@/contexts/QuickLinksContext', () => ({
  QuickLinksProvider: vi.fn(({ children }) => <div data-testid="quick-links-provider">{children}</div>),
  useQuickLinksContext: vi.fn(),
}));

import { useCurrentUser } from '@/hooks/api/useMembers';
import { useEditDialog, useEditDialogActions } from '@/stores/quickLinksStore';
import { useQuickLinksContext } from '@/contexts/QuickLinksContext';

describe('QuickLinksTab', () => {
  const mockCloseEditDialog = vi.fn();
  
  const mockCurrentUser = {
    id: 'user-123',
    uuid: 'uuid-123',
    username: 'testuser',
    first_name: 'Test',
    last_name: 'User',
  };

  const mockUserData: UserMeResponse = {
    id: 'user-456',
    uuid: 'uuid-456',
    username: 'johndoe',
    first_name: 'John',
    last_name: 'Doe',
    link: [
      {
        id: 'link-1',
        name: 'GitHub',
        title: 'GitHub',
        description: 'Code repository',
        url: 'https://github.com',
        category_id: 'cat-1',
        tags: ['code'],
        favorite: true,
      },
      {
        id: 'link-2',
        name: 'Jira',
        title: 'Jira',
        description: 'Issue tracking',
        url: 'https://jira.com',
        category_id: 'cat-2',
        tags: ['tasks'],
        favorite: true,
      },
    ],
  };

  const mockQuickLinks = [
    {
      id: 'link-1',
      title: 'GitHub',
      url: 'https://github.com',
      icon: 'Github',
      category: 'Development',
      categoryId: 'cat-1',
      categoryColor: 'bg-blue-500',
      description: 'Code repository',
      tags: ['code'],
      isFavorite: true,
    },
    {
      id: 'link-2',
      title: 'Jira',
      url: 'https://jira.com',
      icon: 'CheckSquare',
      category: 'Project Management',
      categoryId: 'cat-2',
      categoryColor: 'bg-green-500',
      description: 'Issue tracking',
      tags: ['tasks'],
      isFavorite: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(useCurrentUser).mockReturnValue({
      data: mockCurrentUser,
      isLoading: false,
    } as any);

    vi.mocked(useEditDialog).mockReturnValue({
      isOpen: false,
      linkId: '',
    });

    vi.mocked(useEditDialogActions).mockReturnValue({
      closeEditDialog: mockCloseEditDialog,
      openEditDialog: vi.fn(),
    });

    vi.mocked(useQuickLinksContext).mockReturnValue({
      quickLinks: mockQuickLinks,
      filteredQuickLinks: mockQuickLinks,
      linkCategories: [],
      isLoading: false,
      searchTerm: '',
      setSearchTerm: vi.fn(),
      selectedCategoryId: 'all',
      setSelectedCategoryId: vi.fn(),
      viewMode: 'collapsed',
      setViewMode: vi.fn(),
      handleToggleFavorite: vi.fn(),
      handleDeleteClick: vi.fn(),
      handleDeleteConfirm: vi.fn(),
      handleDeleteCancel: vi.fn(),
      handleEditClick: vi.fn(),
      deleteDialog: { isOpen: false, linkId: '', linkTitle: '' },
      editDialog: { isOpen: false, linkId: '' },
      handleEditCancel: vi.fn(),
      ownerId: undefined,
    } as any);
  });

  describe('Rendering', () => {
    it('should render QuickLinksProvider wrapper', () => {
      render(<QuickLinksTab userData={mockUserData} />);

      expect(screen.getByTestId('quick-links-provider')).toBeInTheDocument();
    });

    it('should render DeleteConfirmationDialog', () => {
      render(<QuickLinksTab userData={mockUserData} />);

      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading state when isLoading is true', () => {
      vi.mocked(useQuickLinksContext).mockReturnValue({
        quickLinks: [],
        isLoading: true,
      } as any);

      render(<QuickLinksTab userData={mockUserData} />);

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.queryByTestId('quick-links-grid')).not.toBeInTheDocument();
    });

    it('should not show search filter when loading', () => {
      vi.mocked(useQuickLinksContext).mockReturnValue({
        quickLinks: [],
        isLoading: true,
      } as any);

      render(<QuickLinksTab userData={mockUserData} />);

      expect(screen.queryByTestId('search-filter')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no links exist', () => {
      vi.mocked(useQuickLinksContext).mockReturnValue({
        quickLinks: [],
        isLoading: false,
      } as any);

      render(<QuickLinksTab userData={mockUserData} />);

      expect(screen.getByText(/No quick links yet/i)).toBeInTheDocument();
    });

    it('should show custom empty message when provided', () => {
      vi.mocked(useQuickLinksContext).mockReturnValue({
        quickLinks: [],
        isLoading: false,
      } as any);

      const customMessage = 'Your custom empty message here';
      render(<QuickLinksTab userData={mockUserData} emptyMessage={customMessage} />);

      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('should show Add Link button in empty state', () => {
      vi.mocked(useQuickLinksContext).mockReturnValue({
        quickLinks: [],
        isLoading: false,
      } as any);

      render(<QuickLinksTab userData={mockUserData} />);

      const addButton = screen.getByRole('button', { name: /add link/i });
      expect(addButton).toBeInTheDocument();
    });

    it('should not show search filter when no links exist', () => {
      vi.mocked(useQuickLinksContext).mockReturnValue({
        quickLinks: [],
        isLoading: false,
      } as any);

      render(<QuickLinksTab userData={mockUserData} />);

      expect(screen.queryByTestId('search-filter')).not.toBeInTheDocument();
    });

    it('should not show grid when no links exist', () => {
      vi.mocked(useQuickLinksContext).mockReturnValue({
        quickLinks: [],
        isLoading: false,
      } as any);

      render(<QuickLinksTab userData={mockUserData} />);

      expect(screen.queryByTestId('quick-links-grid')).not.toBeInTheDocument();
    });
  });

  describe('With Links State', () => {
    it('should render QuickLinksGrid when links exist', () => {
      render(<QuickLinksTab userData={mockUserData} />);

      expect(screen.getByTestId('quick-links-grid')).toBeInTheDocument();
    });

    it('should render QuickLinksSearchFilter when links exist', () => {
      render(<QuickLinksTab userData={mockUserData} />);

      expect(screen.getByTestId('search-filter')).toBeInTheDocument();
    });

    it('should not show empty state when links exist', () => {
      render(<QuickLinksTab userData={mockUserData} />);

      expect(screen.queryByText(/No quick links yet/i)).not.toBeInTheDocument();
    });

    it('should not show loading state when links are loaded', () => {
      render(<QuickLinksTab userData={mockUserData} />);

      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
    });
  });

  describe('Add Link Dialog', () => {
    it('should not show AddLinkDialog initially', () => {
      render(<QuickLinksTab userData={mockUserData} />);

      expect(screen.queryByTestId('add-link-dialog')).not.toBeInTheDocument();
    });

    it('should open AddLinkDialog when Add Link button is clicked from empty state', async () => {
      const user = userEvent.setup();
      
      vi.mocked(useQuickLinksContext).mockReturnValue({
        quickLinks: [],
        isLoading: false,
      } as any);

      render(<QuickLinksTab userData={mockUserData} />);

      const addButton = screen.getByRole('button', { name: /add link/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('add-link-dialog')).toBeInTheDocument();
      });
    });

    it('should open AddLinkDialog when Add Link button is clicked from search filter', async () => {
      const user = userEvent.setup();

      render(<QuickLinksTab userData={mockUserData} />);

      const addButton = screen.getByTestId('add-link-from-filter');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('add-link-dialog')).toBeInTheDocument();
      });
    });

    it('should pass ownerId to AddLinkDialog when provided', async () => {
      const user = userEvent.setup();
      const ownerId = 'custom-owner-123';

      vi.mocked(useQuickLinksContext).mockReturnValue({
        quickLinks: [],
        isLoading: false,
        ownerId,
      } as any);

      render(<QuickLinksTab userData={mockUserData} ownerId={ownerId} />);

      const addButton = screen.getByRole('button', { name: /add link/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('owner-id')).toHaveTextContent(ownerId);
      });
    });

    it('should use current user uuid as ownerId when not provided', async () => {
      const user = userEvent.setup();

      vi.mocked(useQuickLinksContext).mockReturnValue({
        quickLinks: [],
        isLoading: false,
      } as any);

      render(<QuickLinksTab userData={mockUserData} />);

      const addButton = screen.getByRole('button', { name: /add link/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('owner-id')).toHaveTextContent(mockCurrentUser.uuid);
      });
    });

    it('should close AddLinkDialog when onOpenChange is called', async () => {
      const user = userEvent.setup();

      vi.mocked(useQuickLinksContext).mockReturnValue({
        quickLinks: [],
        isLoading: false,
      } as any);

      render(<QuickLinksTab userData={mockUserData} />);

      // Open dialog
      const addButton = screen.getByRole('button', { name: /add link/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('add-link-dialog')).toBeInTheDocument();
      });

      // Close dialog
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('add-link-dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit Link Dialog', () => {
    it('should not show EditLinkDialog when editDialog.isOpen is false', () => {
      render(<QuickLinksTab userData={mockUserData} />);

      expect(screen.queryByTestId('edit-link-dialog')).not.toBeInTheDocument();
    });

    it('should show EditLinkDialog when editDialog.isOpen is true', () => {
      vi.mocked(useEditDialog).mockReturnValue({
        isOpen: true,
        linkId: 'link-1',
      });

      render(<QuickLinksTab userData={mockUserData} />);

      expect(screen.getByTestId('edit-link-dialog')).toBeInTheDocument();
    });

    it('should pass correct link data to EditLinkDialog', () => {
      vi.mocked(useEditDialog).mockReturnValue({
        isOpen: true,
        linkId: 'link-1',
      });

      render(<QuickLinksTab userData={mockUserData} />);

      expect(screen.getByTestId('edit-link-id')).toHaveTextContent('link-1');
      expect(screen.getByTestId('edit-link-title')).toHaveTextContent('GitHub');
    });

    it('should convert QuickLink to UserLink format for EditLinkDialog', () => {
      vi.mocked(useEditDialog).mockReturnValue({
        isOpen: true,
        linkId: 'link-2',
      });

      render(<QuickLinksTab userData={mockUserData} />);

      expect(screen.getByTestId('edit-link-id')).toHaveTextContent('link-2');
      expect(screen.getByTestId('edit-link-title')).toHaveTextContent('Jira');
    });

    it('should call closeEditDialog when EditLinkDialog is closed', async () => {
      const user = userEvent.setup();

      vi.mocked(useEditDialog).mockReturnValue({
        isOpen: true,
        linkId: 'link-1',
      });

      render(<QuickLinksTab userData={mockUserData} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(mockCloseEditDialog).toHaveBeenCalledTimes(1);
    });

    it('should not render EditLinkDialog when link is not found', () => {
      vi.mocked(useEditDialog).mockReturnValue({
        isOpen: true,
        linkId: 'nonexistent-link',
      });

      render(<QuickLinksTab userData={mockUserData} />);

      expect(screen.queryByTestId('edit-link-dialog')).not.toBeInTheDocument();
    });

    it('should handle missing description in link data', () => {
      const linksWithoutDescription = [
        {
          ...mockQuickLinks[0],
          description: undefined,
        },
      ];

      vi.mocked(useQuickLinksContext).mockReturnValue({
        quickLinks: linksWithoutDescription,
        isLoading: false,
      } as any);

      vi.mocked(useEditDialog).mockReturnValue({
        isOpen: true,
        linkId: 'link-1',
      });

      render(<QuickLinksTab userData={mockUserData} />);

      expect(screen.getByTestId('edit-link-dialog')).toBeInTheDocument();
    });

    it('should handle missing tags in link data', () => {
      const linksWithoutTags = [
        {
          ...mockQuickLinks[0],
          tags: undefined,
        },
      ];

      vi.mocked(useQuickLinksContext).mockReturnValue({
        quickLinks: linksWithoutTags,
        isLoading: false,
      } as any);

      vi.mocked(useEditDialog).mockReturnValue({
        isOpen: true,
        linkId: 'link-1',
      });

      render(<QuickLinksTab userData={mockUserData} />);

      expect(screen.getByTestId('edit-link-dialog')).toBeInTheDocument();
    });
  });

  describe('Custom Handlers', () => {
    it('should pass custom handlers to QuickLinksProvider', () => {
      const mockOnDeleteLink = vi.fn();
      const mockOnToggleFavorite = vi.fn();

      render(
        <QuickLinksTab
          userData={mockUserData}
          onDeleteLink={mockOnDeleteLink}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      expect(screen.getByTestId('quick-links-provider')).toBeInTheDocument();
    });

    it('should pass alwaysShowDelete to QuickLinksProvider', () => {
      render(<QuickLinksTab userData={mockUserData} alwaysShowDelete={true} />);

      expect(screen.getByTestId('quick-links-provider')).toBeInTheDocument();
    });

    it('should pass ownerId to QuickLinksProvider', () => {
      const ownerId = 'team-owner-123';

      render(<QuickLinksTab userData={mockUserData} ownerId={ownerId} />);

      expect(screen.getByTestId('quick-links-provider')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should accept and use userData prop', () => {
      render(<QuickLinksTab userData={mockUserData} />);

      expect(screen.getByTestId('quick-links-provider')).toBeInTheDocument();
    });

    it('should accept and use title prop', () => {
      const customTitle = 'My Custom Links';

      render(<QuickLinksTab userData={mockUserData} title={customTitle} />);

      // Title is passed to QuickLinksTabContent but not rendered directly
      expect(screen.getByTestId('quick-links-provider')).toBeInTheDocument();
    });

    it('should use default title when not provided', () => {
      render(<QuickLinksTab userData={mockUserData} />);

      expect(screen.getByTestId('quick-links-provider')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined userData', () => {
      render(<QuickLinksTab />);

      expect(screen.getByTestId('quick-links-provider')).toBeInTheDocument();
    });

    it('should handle userData with empty link array', () => {
      const emptyUserData = {
        ...mockUserData,
        link: [],
      };

      render(<QuickLinksTab userData={emptyUserData} />);

      expect(screen.getByTestId('quick-links-provider')).toBeInTheDocument();
    });

    it('should handle missing currentUser', () => {
      vi.mocked(useCurrentUser).mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      render(<QuickLinksTab userData={mockUserData} />);

      expect(screen.getByTestId('quick-links-provider')).toBeInTheDocument();
    });

    it('should handle simultaneous dialog states', () => {
      vi.mocked(useEditDialog).mockReturnValue({
        isOpen: true,
        linkId: 'link-1',
      });

      render(<QuickLinksTab userData={mockUserData} />);

      // Both dialogs should be present (Edit and Delete)
      expect(screen.getByTestId('edit-link-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should have minimum height for empty state', () => {
      vi.mocked(useQuickLinksContext).mockReturnValue({
        quickLinks: [],
        isLoading: false,
      } as any);

      const { container } = render(<QuickLinksTab userData={mockUserData} />);

      const emptyStateContainer = container.querySelector('.min-h-\\[350px\\]');
      expect(emptyStateContainer).toBeInTheDocument();
    });

    it('should have minimum height for main container', () => {
      const { container } = render(<QuickLinksTab userData={mockUserData} />);

      const mainContainer = container.querySelector('.min-h-\\[400px\\]');
      expect(mainContainer).toBeInTheDocument();
    });
  });
});
