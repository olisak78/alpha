import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { PortalContent } from '@/components/PortalContent';
import { MemoryRouter } from 'react-router-dom';

// Mock hooks
vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: vi.fn(),
}));

vi.mock('@/contexts/hooks', () => ({
  usePortalState: vi.fn(),
}));

vi.mock('@/contexts/HeaderNavigationContext', () => ({
  useHeaderNavigation: vi.fn(),
}));

vi.mock('@/stores/sidebarStore', () => ({
  useSidebarWidth: vi.fn(),
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/utils/organization-utils', () => ({
  isUserInSapCfsOrganization: vi.fn(),
}));

// Mock child components
vi.mock('@/components/DeveloperPortalHeader/DeveloperPortalHeader', () => ({
  DeveloperPortalHeader: vi.fn(({ unreadCount, onNotificationClick }) => (
    <div data-testid="developer-portal-header">
      <div data-testid="unread-count">{unreadCount}</div>
      <button onClick={onNotificationClick} data-testid="notification-button">
        Notifications
      </button>
    </div>
  )),
}));

vi.mock('@/components/DeveloperPortalHeader/HeaderNavigation', () => ({
  HeaderNavigation: vi.fn(({ tabs, activeTab, onTabClick, isDropdown }) => (
    <div data-testid="header-navigation">
      <div data-testid="nav-tabs-count">{tabs.length}</div>
      <div data-testid="nav-active-tab">{activeTab || 'none'}</div>
      <div data-testid="nav-is-dropdown">{String(isDropdown)}</div>
      <button onClick={() => onTabClick('tab-1')} data-testid="nav-tab-button">
        Tab Click
      </button>
    </div>
  )),
}));

vi.mock('@/components/Sidebar/SideBar', () => ({
  SideBar: vi.fn(({ activeProject, projects, onProjectChange }) => (
    <div data-testid="sidebar">
      <div data-testid="sidebar-active-project">{activeProject}</div>
      <div data-testid="sidebar-projects-count">{projects.length}</div>
      <button onClick={() => onProjectChange('new-project')} data-testid="sidebar-project-button">
        Change Project
      </button>
    </div>
  )),
}));

vi.mock('@/components/NotificationPopup', () => ({
  NotificationPopup: vi.fn(({ isOpen, onClose, notifications, currentId, markAllRead, unreadCount }) => (
    <div data-testid="notification-popup" data-is-open={isOpen}>
      <div data-testid="popup-notifications-count">{notifications.length}</div>
      <div data-testid="popup-current-id">{currentId}</div>
      <div data-testid="popup-unread-count">{unreadCount}</div>
      <button onClick={onClose} data-testid="popup-close-button">Close</button>
      <button onClick={markAllRead} data-testid="popup-mark-read-button">Mark All Read</button>
    </div>
  )),
}));

// Mock Outlet
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Outlet: vi.fn(() => <div data-testid="outlet">Main Content</div>),
    useLocation: vi.fn(),
  };
});

import { useNotifications } from '@/hooks/useNotifications';
import { usePortalState } from '@/contexts/hooks';
import { useHeaderNavigation } from '@/contexts/HeaderNavigationContext';
import { useSidebarWidth } from '@/stores/sidebarStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isUserInSapCfsOrganization } from '@/utils/organization-utils';
import { DeveloperPortalHeader } from '@/components/DeveloperPortalHeader/DeveloperPortalHeader';
import { HeaderNavigation } from '@/components/DeveloperPortalHeader/HeaderNavigation';
import { SideBar } from '@/components/Sidebar/SideBar';
import { NotificationPopup } from '@/components/NotificationPopup';

describe('PortalContent', () => {
  const mockSetMeHighlightNotifications = vi.fn();
  const mockMarkAllRead = vi.fn();
  const mockSetActiveTab = vi.fn();
  const mockOnProjectChange = vi.fn();

  const mockNotifications = [
    { id: '1', message: 'Notification 1', read: false },
    { id: '2', message: 'Notification 2', read: false },
    { id: '3', message: 'Notification 3', read: true },
  ];

  const mockTabs = [
    { id: 'tab-1', label: 'Tab 1' },
    { id: 'tab-2', label: 'Tab 2' },
  ];

  const defaultProps = {
    activeProject: 'home',
    projects: ['home', 'teams', 'links'],
    onProjectChange: mockOnProjectChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useNotifications).mockReturnValue({
      notifications: mockNotifications,
      unreadCount: 2,
      markAllRead: mockMarkAllRead,
    } as any);

    vi.mocked(usePortalState).mockReturnValue({
      currentDevId: 'dev-1',
      setMeHighlightNotifications: mockSetMeHighlightNotifications,
    } as any);

    vi.mocked(useHeaderNavigation).mockReturnValue({
      tabs: mockTabs,
      activeTab: 'tab-1',
      setActiveTab: mockSetActiveTab,
      isDropdown: false,
      setIsDropdown: vi.fn(),
      setTabs: vi.fn(),
    });

    vi.mocked(useSidebarWidth).mockReturnValue(208);
    vi.mocked(useIsMobile).mockReturnValue(false);
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/home',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });

    vi.mocked(useAuth).mockReturnValue({
      user: { organization: 'sap-cfs' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
    } as any);

    vi.mocked(isUserInSapCfsOrganization).mockReturnValue(true);
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  describe('Rendering', () => {
    it('should render all main components', () => {
      renderWithRouter(<PortalContent {...defaultProps} />);

      expect(screen.getByTestId('developer-portal-header')).toBeInTheDocument();
      expect(screen.getByTestId('header-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
      expect(screen.getByTestId('notification-popup')).toBeInTheDocument();
    });

    it('should render main content outlet', () => {
      renderWithRouter(<PortalContent {...defaultProps} />);

      expect(screen.getByTestId('outlet')).toHaveTextContent('Main Content');
    });
  });

  describe('Component Integration', () => {
    it('should pass correct props to all child components', () => {
      renderWithRouter(<PortalContent {...defaultProps} />);

      // Header props
      expect(screen.getByTestId('unread-count')).toHaveTextContent('2');
      
      // Navigation props
      expect(screen.getByTestId('nav-tabs-count')).toHaveTextContent('2');
      expect(screen.getByTestId('nav-active-tab')).toHaveTextContent('tab-1');
      expect(screen.getByTestId('nav-is-dropdown')).toHaveTextContent('false');
      
      // Sidebar props
      expect(screen.getByTestId('sidebar-active-project')).toHaveTextContent('home');
      expect(screen.getByTestId('sidebar-projects-count')).toHaveTextContent('3');
    });

    it('should handle user interactions correctly', async () => {
      const user = userEvent.setup();
      renderWithRouter(<PortalContent {...defaultProps} />);

      // Test notification click
      const notificationButton = screen.getByTestId('notification-button');
      await user.click(notificationButton);
      expect(mockSetMeHighlightNotifications).toHaveBeenCalledWith(false);

      // Test tab click
      const tabButton = screen.getByTestId('nav-tab-button');
      await user.click(tabButton);
      expect(mockSetActiveTab).toHaveBeenCalledWith('tab-1');

      // Test project change
      const projectButton = screen.getByTestId('sidebar-project-button');
      await user.click(projectButton);
      expect(mockOnProjectChange).toHaveBeenCalledWith('new-project');
    });
  });

  describe('Notification Popup', () => {
    it('should handle notification popup functionality', async () => {
      const user = userEvent.setup();
      renderWithRouter(<PortalContent {...defaultProps} />);

      // Verify props passed to popup
      expect(screen.getByTestId('popup-notifications-count')).toHaveTextContent('3');
      expect(screen.getByTestId('popup-current-id')).toHaveTextContent('dev-1');
      expect(screen.getByTestId('popup-unread-count')).toHaveTextContent('2');

      // Verify popup starts closed
      const popup = screen.getByTestId('notification-popup');
      expect(popup).toHaveAttribute('data-is-open', 'false');

      // Test opening popup
      const notificationButton = screen.getByTestId('notification-button');
      await user.click(notificationButton);
      expect(popup).toHaveAttribute('data-is-open', 'true');

      // Test closing popup
      const closeButton = screen.getByTestId('popup-close-button');
      await user.click(closeButton);
      expect(popup).toHaveAttribute('data-is-open', 'false');

      // Test mark all read functionality
      const markReadButton = screen.getByTestId('popup-mark-read-button');
      await user.click(markReadButton);
      expect(mockMarkAllRead).toHaveBeenCalledTimes(1);
    });
  });

  describe('AI Arena Chat Page', () => {
    it('should detect AI Arena chat page', () => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/ai-arena/chat',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      const { container } = renderWithRouter(<PortalContent {...defaultProps} />);

      const mainContent = container.querySelector('main');
      expect(mainContent).toHaveClass('overflow-hidden');
      expect(mainContent).not.toHaveClass('overflow-auto');
    });

    it('should detect AI Arena deployments when activeTab is chat', () => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/ai-arena/deployments',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      vi.mocked(useHeaderNavigation).mockReturnValue({
        tabs: mockTabs,
        activeTab: 'chat',
        setActiveTab: mockSetActiveTab,
        isDropdown: false,
        setIsDropdown: vi.fn(),
        setTabs: vi.fn(),
      });

      const { container } = renderWithRouter(<PortalContent {...defaultProps} />);

      const mainContent = container.querySelector('main');
      expect(mainContent).toHaveClass('overflow-hidden');
    });

    it('should not detect AI Arena when on deployments tab', () => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/ai-arena/deployments',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      vi.mocked(useHeaderNavigation).mockReturnValue({
        tabs: mockTabs,
        activeTab: 'deployments',
        setActiveTab: mockSetActiveTab,
        isDropdown: false,
        setIsDropdown: vi.fn(),
        setTabs: vi.fn(),
      });

      const { container } = renderWithRouter(<PortalContent {...defaultProps} />);

      const mainContent = container.querySelector('main');
      expect(mainContent).toHaveClass('overflow-auto');
      expect(mainContent).not.toHaveClass('overflow-hidden');
    });

    it('should use overflow-auto for non-AI Arena pages', () => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/home',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      const { container } = renderWithRouter(<PortalContent {...defaultProps} />);

      const mainContent = container.querySelector('main');
      expect(mainContent).toHaveClass('overflow-auto');
    });
  });

  describe('Responsive Behavior', () => {
    it('should apply sidebar padding on desktop', () => {
      vi.mocked(useIsMobile).mockReturnValue(false);
      vi.mocked(useSidebarWidth).mockReturnValue(208);

      const { container } = renderWithRouter(<PortalContent {...defaultProps} />);

      const header = container.querySelector('.border-b');
      expect(header).toHaveStyle({ paddingLeft: '208px' });
    });


    it('should update padding when sidebar width changes', () => {
      const { container, rerender } = renderWithRouter(<PortalContent {...defaultProps} />);

      let header = container.querySelector('.border-b');
      expect(header).toHaveStyle({ paddingLeft: '208px' });

      vi.mocked(useSidebarWidth).mockReturnValue(64);

      rerender(
        <MemoryRouter>
          <PortalContent {...defaultProps} />
        </MemoryRouter>
      );

      header = container.querySelector('.border-b');
      expect(header).toHaveStyle({ paddingLeft: '64px' });
    });
  });

  describe('Layout Structure', () => {
    it('should have flex column layout', () => {
      const { container } = renderWithRouter(<PortalContent {...defaultProps} />);

      const root = container.firstChild;
      expect(root).toHaveClass('flex', 'flex-col', 'h-screen', 'overflow-hidden');
    });

    it('should have header with border-bottom', () => {
      const { container } = renderWithRouter(<PortalContent {...defaultProps} />);

      const header = container.querySelector('.border-b');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('bg-background', 'z-30');
    });

    it('should have main content area', () => {
      const { container } = renderWithRouter(<PortalContent {...defaultProps} />);

      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveClass('flex-1', 'bg-background');
    });
  });

  describe('Hook Integration', () => {
    it('should call all required hooks', () => {
      renderWithRouter(<PortalContent {...defaultProps} />);

      expect(useNotifications).toHaveBeenCalledWith('dev-1');
      expect(usePortalState).toHaveBeenCalled();
      expect(useHeaderNavigation).toHaveBeenCalled();
      expect(useSidebarWidth).toHaveBeenCalled();
      expect(useIsMobile).toHaveBeenCalled();
      expect(useLocation).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero unread notifications', () => {
      vi.mocked(useNotifications).mockReturnValue({
        notifications: [],
        unreadCount: 0,
        markAllRead: mockMarkAllRead,
      } as any);

      renderWithRouter(<PortalContent {...defaultProps} />);

      expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
    });

    it('should handle empty tabs array', () => {
      vi.mocked(useHeaderNavigation).mockReturnValue({
        tabs: [],
        activeTab: null,
        setActiveTab: mockSetActiveTab,
        isDropdown: false,
        setIsDropdown: vi.fn(),
        setTabs: vi.fn(),
      });

      renderWithRouter(<PortalContent {...defaultProps} />);

      expect(screen.getByTestId('nav-tabs-count')).toHaveTextContent('0');
    });

    it('should handle empty projects array', () => {
      renderWithRouter(<PortalContent {...defaultProps} projects={[]} />);

      expect(screen.getByTestId('sidebar-projects-count')).toHaveTextContent('0');
    });

    it('should handle many notifications', () => {
      const manyNotifications = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        message: `Notification ${i}`,
        read: false,
      }));

      vi.mocked(useNotifications).mockReturnValue({
        notifications: manyNotifications,
        unreadCount: 100,
        markAllRead: mockMarkAllRead,
      } as any);

      renderWithRouter(<PortalContent {...defaultProps} />);

      expect(screen.getByTestId('popup-notifications-count')).toHaveTextContent('100');
      expect(screen.getByTestId('unread-count')).toHaveTextContent('100');
    });
  });
});
