import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationPopup } from '../../src/components/NotificationPopup';
import '@testing-library/jest-dom/vitest';

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Bell: ({ className }: { className?: string }) => (
    <div data-testid="bell-icon" className={className} />
  ),
  CheckCircle2: ({ className }: { className?: string }) => (
    <div data-testid="check-circle-icon" className={className} />
  ),
  Inbox: ({ className }: { className?: string }) => (
    <div data-testid="inbox-icon" className={className} />
  ),
  X: ({ className }: { className?: string }) => (
    <div data-testid="x-icon" className={className} />
  ),
}));

// Mock UI components
vi.mock('../../src/components/ui/button', () => ({
  Button: ({ children, onClick, className, variant, size, ...props }: any) => (
    <button 
      onClick={onClick} 
      className={className}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('../../src/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span className={className} data-variant={variant}>
      {children}
    </span>
  ),
}));

// Mock utils
vi.mock('../../src/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

describe('NotificationPopup Component', () => {
  const mockOnClose = vi.fn();
  const mockMarkAllRead = vi.fn();
  const currentId = 'user-123';

  const mockNotifications = [
    {
      id: 'notif-1',
      title: 'System Update',
      message: 'System will be updated tonight',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      readBy: [],
    },
    {
      id: 'notif-2',
      title: 'Task Assigned',
      message: 'You have been assigned a new task',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
      readBy: [currentId],
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    notifications: mockNotifications,
    currentId,
    markAllRead: mockMarkAllRead,
    unreadCount: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-12-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <NotificationPopup {...defaultProps} isOpen={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render popup with notifications when isOpen is true', () => {
      render(<NotificationPopup {...defaultProps} />);
      
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('System Update')).toBeInTheDocument();
      expect(screen.getByText('Task Assigned')).toBeInTheDocument();
      expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
    });

    it('should display unread count badge', () => {
      render(<NotificationPopup {...defaultProps} unreadCount={3} />);
      
      const badge = screen.getByText('3');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('data-variant', 'secondary');
    });

    it('should render empty state when no notifications', () => {
      render(
        <NotificationPopup 
          {...defaultProps} 
          notifications={[]} 
          unreadCount={0}
        />
      );

      expect(screen.getByText('All caught up!')).toBeInTheDocument();
      expect(screen.getByText('No new notifications right now.')).toBeInTheDocument();
      expect(screen.getByTestId('inbox-icon')).toBeInTheDocument();
    });
  });

  describe('Notification Display', () => {
    it('should show read/unread status correctly', () => {
      render(<NotificationPopup {...defaultProps} />);

      // Unread notification should have "New" badge
      expect(screen.getByText('New')).toBeInTheDocument();
      
      // Read notification should have check icon
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    it('should display due dates and creation times', () => {
      render(<NotificationPopup {...defaultProps} />);

      expect(screen.getByText(/Due:/)).toBeInTheDocument();
      expect(screen.getAllByText(/\d+h ago/)).toHaveLength(2);
      // Date format is locale-specific (e.g., "26.12.2025" or "12/26/2025")
      expect(screen.getByText(/\d{1,2}[.\/]\d{1,2}[.\/]\d{4}/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when close button is clicked', () => {
      render(<NotificationPopup {...defaultProps} />);

      const closeButton = screen.getByTestId('x-icon').closest('button');
      fireEvent.click(closeButton!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call markAllRead when mark all read button is clicked', () => {
      render(<NotificationPopup {...defaultProps} />);

      const markAllReadButton = screen.getByText('Mark all read');
      fireEvent.click(markAllReadButton);

      expect(mockMarkAllRead).toHaveBeenCalledWith(currentId);
    });

    it('should close popup when Escape key is pressed', () => {
      render(<NotificationPopup {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should close popup when clicking outside', () => {
      render(
        <div>
          <div data-testid="outside-element">Outside</div>
          <NotificationPopup {...defaultProps} />
        </div>
      );

      const outsideElement = screen.getByTestId('outside-element');
      fireEvent.mouseDown(outsideElement);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not close popup when clicking inside', () => {
      render(<NotificationPopup {...defaultProps} />);

      const popupContent = screen.getByText('Notifications');
      fireEvent.mouseDown(popupContent);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle notifications without readBy array', () => {
      const notificationWithoutReadBy = {
        id: 'no-readby',
        title: 'No ReadBy',
        message: 'Message without readBy',
        createdAt: new Date().toISOString(),
      };

      expect(() => {
        render(
          <NotificationPopup 
            {...defaultProps} 
            notifications={[notificationWithoutReadBy as any]}
          />
        );
      }).not.toThrow();

      expect(screen.getByText('No ReadBy')).toBeInTheDocument();
    });

    it('should handle empty currentId', () => {
      render(
        <NotificationPopup 
          {...defaultProps} 
          currentId=""
        />
      );

      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });
});
