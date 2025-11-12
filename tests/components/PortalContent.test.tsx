import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PortalContent } from '@/components/PortalContent';
import { useNotifications } from '@/hooks/useNotifications';
import { usePortalState } from '@/contexts/hooks';
import { useHeaderNavigation } from '@/contexts/HeaderNavigationContext';
import { useSidebarState } from '@/contexts/SidebarContext';
import { useIsMobile } from '@/hooks/use-mobile';

// Mock all the hooks and contexts
vi.mock('@/hooks/useNotifications');
vi.mock('@/contexts/hooks');
vi.mock('@/contexts/HeaderNavigationContext');
vi.mock('@/contexts/SidebarContext');
vi.mock('@/hooks/use-mobile');

// Mock child components
vi.mock('@/components/DeveloperPortalHeader/DeveloperPortalHeader', () => ({
  DeveloperPortalHeader: ({ unreadCount, onNotificationClick }: any) => (
    <div data-testid="developer-portal-header">
      <span data-testid="unread-count">{unreadCount}</span>
      <button data-testid="notification-button" onClick={onNotificationClick}>
        Notifications
      </button>
    </div>
  )
}));

vi.mock('@/components/DeveloperPortalHeader/HeaderNavigation', () => ({
  HeaderNavigation: ({ tabs, activeTab, onTabClick, isDropdown }: any) => (
    <div data-testid="header-navigation">
      <span data-testid="active-tab">{activeTab || ''}</span>
      <span data-testid="is-dropdown">{String(isDropdown)}</span>
      {tabs.map((tab: any) => (
        <button key={tab.id} data-testid={`tab-${tab.id}`} onClick={() => onTabClick(tab.id)}>
          {tab.label}
        </button>
      ))}
    </div>
  )
}));

vi.mock('@/components/Sidebar/SideBar', () => ({
  SideBar: ({ activeProject, projects, onProjectChange }: any) => (
    <div data-testid="sidebar">
      <span data-testid="active-project">{activeProject}</span>
      <span data-testid="projects-count">{projects.length}</span>
      {projects.map((project: string) => (
        <button key={project} data-testid={`project-${project}`} onClick={() => onProjectChange(project)}>
          {project}
        </button>
      ))}
    </div>
  )
}));

vi.mock('@/components/NotificationPopup', () => ({
  NotificationPopup: ({ isOpen, onClose, notifications, currentId, markAllRead, unreadCount }: any) => (
    <div data-testid="notification-popup" style={{ display: isOpen ? 'block' : 'none' }}>
      <span data-testid="popup-unread-count">{unreadCount}</span>
      <span data-testid="popup-current-id">{currentId}</span>
      <span data-testid="popup-notifications-count">{notifications.length}</span>
      <button data-testid="close-popup" onClick={onClose}>Close</button>
      <button data-testid="mark-all-read" onClick={() => markAllRead(currentId)}>Mark All Read</button>
    </div>
  )
}));

// Mock Outlet from react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">Page Content</div>,
    useLocation: vi.fn()
  };
});

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

// Default test data
const defaultProps = {
  activeProject: 'project-1',
  projects: ['project-1', 'project-2', 'project-3'],
  onProjectChange: vi.fn()
};

const defaultMocks = {
  notifications: {
    notifications: [
      { id: '1', title: 'Test Notification', message: 'Test message', createdAt: new Date().toISOString(), readBy: [] }
    ],
    unreadCount: 1,
    markAllRead: vi.fn()
  },
  portalState: {
    currentDevId: 'dev-123',
    setMeHighlightNotifications: vi.fn()
  },
  headerNavigation: {
    tabs: [
      { id: 'tab1', label: 'Tab 1' },
      { id: 'tab2', label: 'Tab 2' }
    ],
    activeTab: 'tab1',
    setActiveTab: vi.fn(),
    isDropdown: false
  },
  sidebarState: {
    sidebarWidth: 208
  }
};


describe('PortalContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up default mock returns using vi.mocked
    vi.mocked(useNotifications).mockReturnValue(defaultMocks.notifications);
    vi.mocked(usePortalState).mockReturnValue(defaultMocks.portalState);
    vi.mocked(useHeaderNavigation).mockReturnValue(defaultMocks.headerNavigation);
    vi.mocked(useSidebarState).mockReturnValue(defaultMocks.sidebarState);
    vi.mocked(useIsMobile).mockReturnValue(false);
    
    // Set up default useLocation mock
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
      key: 'default-key'
    });
  });

  describe('Component Rendering', () => {
    it('renders all main sections with correct props', () => {
      render(
        <TestWrapper>
          <PortalContent {...defaultProps} />
        </TestWrapper>
      );

      // All main sections are rendered
      expect(screen.getByTestId('developer-portal-header')).toBeInTheDocument();
      expect(screen.getByTestId('header-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
      expect(screen.getByTestId('notification-popup')).toBeInTheDocument();

      // Props are passed correctly
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
      expect(screen.getByTestId('active-tab')).toHaveTextContent('tab1');
      expect(screen.getByTestId('active-project')).toHaveTextContent('project-1');
      expect(screen.getByTestId('projects-count')).toHaveTextContent('3');
    });

    it('handles empty data gracefully', () => {
      vi.mocked(useNotifications).mockReturnValue({
        notifications: [],
        unreadCount: 0,
        markAllRead: vi.fn()
      });
      
      vi.mocked(useHeaderNavigation).mockReturnValue({
        ...defaultMocks.headerNavigation,
        tabs: [],
        activeTab: null
      });

      render(
        <TestWrapper>
          <PortalContent {...defaultProps} projects={[]} />
        </TestWrapper>
      );

      expect(screen.getByTestId('popup-notifications-count')).toHaveTextContent('0');
      expect(screen.getByTestId('projects-count')).toHaveTextContent('0');
      expect(screen.getByTestId('active-tab')).toHaveTextContent('');
    });
  });

  describe('Responsive Behavior', () => {
    it('applies correct padding for desktop and mobile views', () => {
      // Desktop view
      vi.mocked(useIsMobile).mockReturnValue(false);
      vi.mocked(useSidebarState).mockReturnValue({ sidebarWidth: 208 });

      const { rerender } = render(
        <TestWrapper>
          <PortalContent {...defaultProps} />
        </TestWrapper>
      );

      const headerContainer = screen.getByTestId('developer-portal-header').parentElement;
      expect(headerContainer).toHaveStyle({ paddingLeft: '208px' });

      // Mobile view
      vi.mocked(useIsMobile).mockReturnValue(true);

      rerender(
        <TestWrapper>
          <PortalContent {...defaultProps} />
        </TestWrapper>
      );

      expect(headerContainer).not.toHaveStyle({ paddingLeft: '208px' });
    });
  });

  describe('AI Arena Chat Detection', () => {
    it('applies correct overflow styles based on page type', () => {
      // AI Arena chat page
      vi.mocked(useLocation).mockReturnValue({ pathname: '/ai-arena/chat' });

      const { rerender } = render(
        <TestWrapper>
          <PortalContent {...defaultProps} />
        </TestWrapper>
      );

      let mainContent = screen.getByRole('main');
      expect(mainContent).toHaveClass('overflow-hidden');
      expect(mainContent).not.toHaveClass('overflow-auto');

      // Non-AI Arena page
      vi.mocked(useLocation).mockReturnValue({ pathname: '/some-other-page' });

      rerender(
        <TestWrapper>
          <PortalContent {...defaultProps} />
        </TestWrapper>
      );

      mainContent = screen.getByRole('main');
      expect(mainContent).toHaveClass('overflow-auto');
      expect(mainContent).not.toHaveClass('overflow-hidden');
    });

    it('handles AI Arena deployments page with chat tab', () => {
      vi.mocked(useLocation).mockReturnValue({ pathname: '/ai-arena/deployments' });
      
      vi.mocked(useHeaderNavigation).mockReturnValue({
        ...defaultMocks.headerNavigation,
        activeTab: 'chat'
      });

      render(
        <TestWrapper>
          <PortalContent {...defaultProps} />
        </TestWrapper>
      );

      const mainContent = screen.getByRole('main');
      expect(mainContent).toHaveClass('overflow-hidden');
    });
  });

  describe('Notification System', () => {
    it('manages notification popup state correctly', () => {
      render(
        <TestWrapper>
          <PortalContent {...defaultProps} />
        </TestWrapper>
      );

      const notificationPopup = screen.getByTestId('notification-popup');
      const notificationButton = screen.getByTestId('notification-button');
      const closeButton = screen.getByTestId('close-popup');

      // Initially closed
      expect(notificationPopup.style.display).toBe('none');

      // Open popup
      fireEvent.click(notificationButton);
      expect(notificationPopup.style.display).toBe('block');

      // Close popup
      fireEvent.click(closeButton);
      expect(notificationPopup.style.display).toBe('none');
    });

    it('calls correct functions when notification interactions occur', () => {
      const mockSetMeHighlightNotifications = vi.fn();
      const mockMarkAllRead = vi.fn();
      
      vi.mocked(usePortalState).mockReturnValue({
        ...defaultMocks.portalState,
        setMeHighlightNotifications: mockSetMeHighlightNotifications
      });
      
      vi.mocked(useNotifications).mockReturnValue({
        ...defaultMocks.notifications,
        markAllRead: mockMarkAllRead
      });

      render(
        <TestWrapper>
          <PortalContent {...defaultProps} />
        </TestWrapper>
      );

      // Click notification button
      fireEvent.click(screen.getByTestId('notification-button'));
      expect(mockSetMeHighlightNotifications).toHaveBeenCalledWith(false);

      // Click mark all read
      fireEvent.click(screen.getByTestId('mark-all-read'));
      expect(mockMarkAllRead).toHaveBeenCalledWith('dev-123');
    });
  });

  describe('User Interactions', () => {
    it('handles project and tab changes', () => {
      const mockOnProjectChange = vi.fn();
      const mockSetActiveTab = vi.fn();
      
      vi.mocked(useHeaderNavigation).mockReturnValue({
        ...defaultMocks.headerNavigation,
        setActiveTab: mockSetActiveTab
      });

      render(
        <TestWrapper>
          <PortalContent {...defaultProps} onProjectChange={mockOnProjectChange} />
        </TestWrapper>
      );

      // Change project
      fireEvent.click(screen.getByTestId('project-project-2'));
      expect(mockOnProjectChange).toHaveBeenCalledWith('project-2');

      // Change tab
      fireEvent.click(screen.getByTestId('tab-tab2'));
      expect(mockSetActiveTab).toHaveBeenCalledWith('tab2');
    });
  });

  describe('Hook Integration', () => {
    it('calls hooks with correct parameters', () => {
      render(
        <TestWrapper>
          <PortalContent {...defaultProps} />
        </TestWrapper>
      );

      expect(vi.mocked(useNotifications)).toHaveBeenCalledWith('dev-123');
    });

    it('handles undefined currentDevId', () => {
      vi.mocked(usePortalState).mockReturnValue({
        ...defaultMocks.portalState,
        currentDevId: undefined
      });

      render(
        <TestWrapper>
          <PortalContent {...defaultProps} />
        </TestWrapper>
      );

      expect(vi.mocked(useNotifications)).toHaveBeenCalledWith(undefined);
    });
  });
});
