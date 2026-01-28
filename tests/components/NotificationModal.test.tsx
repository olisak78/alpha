import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationModal } from '@/components/NotificationModal';

describe('NotificationModal', () => {
  const mockOnClose = vi.fn();
  const mockMarkAllRead = vi.fn();

  const sampleNotifications = [
    {
      id: 'notif1',
      title: 'New Task Assigned',
      message: 'You have been assigned a new task for Project Alpha',
      dueDate: '2025-01-15T00:00:00Z',
      createdAt: '2025-01-01T10:00:00Z',
      readBy: [],
    },
    {
      id: 'notif2',
      title: 'Meeting Reminder',
      message: 'Team standup meeting in 30 minutes',
      createdAt: '2025-01-01T09:00:00Z',
      readBy: ['user1'],
    },
    {
      id: 'notif3',
      title: 'System Update',
      message: 'System will be under maintenance tonight',
      dueDate: '2025-01-20T00:00:00Z',
      createdAt: '2024-12-30T14:00:00Z',
      readBy: ['user1', 'user2'],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal Rendering and Structure', () => {
    it('should render modal when isOpen is true', () => {
      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={[]}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={0}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should not render modal content when isOpen is false', () => {
      render(
        <NotificationModal
          isOpen={false}
          onClose={mockOnClose}
          notifications={sampleNotifications}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={1}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render modal title with bell icon', () => {
      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={[]}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={0}
        />
      );

      expect(screen.getByText('Notification Center')).toBeInTheDocument();
    });
  });

  describe('Unread Count Badge', () => {
    it('should display unread count badge when unreadCount > 0', () => {
      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={sampleNotifications}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={2}
        />
      );

      expect(screen.getByText('2 unread')).toBeInTheDocument();
    });

    it('should not display unread count badge when unreadCount is 0', () => {
      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={sampleNotifications}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={0}
        />
      );

      expect(screen.queryByText(/unread/)).not.toBeInTheDocument();
    });

    it('should display correct unread count for single unread notification', () => {
      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={sampleNotifications}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={1}
        />
      );

      expect(screen.getByText('1 unread')).toBeInTheDocument();
    });

    it('should display correct unread count for multiple unread notifications', () => {
      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={sampleNotifications}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={5}
        />
      );

      expect(screen.getByText('5 unread')).toBeInTheDocument();
    });
  });

  describe('Mark All as Read Button', () => {
    it('should display mark all as read button when unreadCount > 0', () => {
      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={sampleNotifications}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={2}
        />
      );

      expect(screen.getByRole('button', { name: /mark all as read/i })).toBeInTheDocument();
    });

    it('should not display mark all as read button when unreadCount is 0', () => {
      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={sampleNotifications}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={0}
        />
      );

      expect(screen.queryByRole('button', { name: /mark all as read/i })).not.toBeInTheDocument();
    });

    it('should call markAllRead with currentId when button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={sampleNotifications}
          currentId="user123"
          markAllRead={mockMarkAllRead}
          unreadCount={2}
        />
      );

      const markAllButton = screen.getByRole('button', { name: /mark all as read/i });
      await user.click(markAllButton);

      expect(mockMarkAllRead).toHaveBeenCalledTimes(1);
      expect(mockMarkAllRead).toHaveBeenCalledWith('user123');
    });

    it('should have CheckCircle2 icon in button', () => {
      const { container } = render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={sampleNotifications}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={2}
        />
      );

      const button = screen.getByRole('button', { name: /mark all as read/i });
      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Notification Table Rendering', () => {
    it('should render table with notifications', () => {
      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={sampleNotifications}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={1}
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should render table headers', () => {
      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={sampleNotifications}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={1}
        />
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Message')).toBeInTheDocument();
      expect(screen.getByText('Due Date')).toBeInTheDocument();
      expect(screen.getByText('Created')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('should render all notifications in table', () => {
      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={sampleNotifications}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={1}
        />
      );

      expect(screen.getByText('New Task Assigned')).toBeInTheDocument();
      expect(screen.getByText('Meeting Reminder')).toBeInTheDocument();
      expect(screen.getByText('System Update')).toBeInTheDocument();
    });

    it('should display notification messages', () => {
      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={sampleNotifications}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={1}
        />
      );

      expect(screen.getByText('You have been assigned a new task for Project Alpha')).toBeInTheDocument();
      expect(screen.getByText('Team standup meeting in 30 minutes')).toBeInTheDocument();
      expect(screen.getByText('System will be under maintenance tonight')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should format created date as locale date string', () => {
      const notifications = [
        {
          id: 'notif1',
          title: 'Test',
          message: 'Test message',
          createdAt: '2025-01-15T10:30:00Z',
          readBy: [],
        },
      ];

      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={notifications}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={1}
        />
      );

      const expectedDate = new Date('2025-01-15T10:30:00Z').toLocaleDateString();
      expect(screen.getByText(expectedDate)).toBeInTheDocument();
    });

    it('should format due date as locale date string when present', () => {
      const notifications = [
        {
          id: 'notif1',
          title: 'Test',
          message: 'Test message',
          createdAt: '2025-01-01T10:00:00Z',
          dueDate: '2025-01-20T00:00:00Z',
          readBy: [],
        },
      ];

      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={notifications}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={1}
        />
      );

      const expectedDueDate = new Date('2025-01-20T00:00:00Z').toLocaleDateString();
      expect(screen.getByText(expectedDueDate)).toBeInTheDocument();
    });

    it('should display N/A for missing due date', () => {
      const notifications = [
        {
          id: 'notif1',
          title: 'Test',
          message: 'Test message',
          createdAt: '2025-01-01T10:00:00Z',
          readBy: [],
        },
      ];

      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={notifications}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={1}
        />
      );

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('should display N/A for undefined due date', () => {
      const notifications = [
        {
          id: 'notif1',
          title: 'Test',
          message: 'Test message',
          createdAt: '2025-01-01T10:00:00Z',
          dueDate: undefined,
          readBy: [],
        },
      ];

      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={notifications}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={1}
        />
      );

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('Read/Unread Status', () => {
    it('should display "New" badge for unread notifications', () => {
      const notifications = [
        {
          id: 'notif1',
          title: 'Unread Notification',
          message: 'This is unread',
          createdAt: '2025-01-01T10:00:00Z',
          readBy: [],
        },
      ];

      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={notifications}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={1}
        />
      );

      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should correctly identify read status based on currentId', () => {
      const notifications = [
        {
          id: 'notif1',
          title: 'Notification',
          message: 'Test',
          createdAt: '2025-01-01T10:00:00Z',
          readBy: ['user2', 'user3'],
        },
      ];

      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={notifications}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={1}
        />
      );

      // Should show as unread for user1
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should handle notification with undefined readBy array', () => {
      const notifications = [
        {
          id: 'notif1',
          title: 'Notification',
          message: 'Test',
          createdAt: '2025-01-01T10:00:00Z',
        } as any,
      ];

      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={notifications}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={1}
        />
      );

      // Should show as unread
      expect(screen.getByText('New')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when notifications array is empty', () => {
      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={[]}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={0}
        />
      );

      expect(screen.getByText('No current messages')).toBeInTheDocument();
      expect(screen.getByText("You're all caught up! New notifications will appear here.")).toBeInTheDocument();
    });

    it('should display inbox icon in empty state', () => {
      const { container } = render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={[]}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={0}
        />
      );

      const emptyState = screen.getByText('No current messages').closest('div')?.parentElement;
      const icon = emptyState?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should not display table when notifications array is empty', () => {
      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={[]}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={0}
        />
      );

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should not display mark all as read button in empty state', () => {
      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={[]}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={0}
        />
      );

      expect(screen.queryByRole('button', { name: /mark all as read/i })).not.toBeInTheDocument();
    });
  });

  describe('Modal Close Behavior', () => {
    it('should call onClose when dialog change event is triggered', async () => {
      const user = userEvent.setup();

      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={[]}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={0}
        />
      );

      // Press Escape key to close modal
      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Multiple Notifications Scenarios', () => {
    it('should render mix of read and unread notifications', () => {
      const mixedNotifications = [
        {
          id: 'notif1',
          title: 'Unread 1',
          message: 'Message 1',
          createdAt: '2025-01-01T10:00:00Z',
          readBy: [],
        },
        {
          id: 'notif2',
          title: 'Read 1',
          message: 'Message 2',
          createdAt: '2025-01-01T09:00:00Z',
          readBy: ['user1'],
        },
        {
          id: 'notif3',
          title: 'Unread 2',
          message: 'Message 3',
          createdAt: '2025-01-01T08:00:00Z',
          readBy: ['user2'],
        },
      ];

      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={mixedNotifications}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={2}
        />
      );

      // Should have 2 "New" badges
      const newBadges = screen.getAllByText('New');
      expect(newBadges).toHaveLength(2);
    });

    it('should render all notifications as read when all are read', () => {
      const allReadNotifications = [
        {
          id: 'notif1',
          title: 'Read 1',
          message: 'Message 1',
          createdAt: '2025-01-01T10:00:00Z',
          readBy: ['user1'],
        },
        {
          id: 'notif2',
          title: 'Read 2',
          message: 'Message 2',
          createdAt: '2025-01-01T09:00:00Z',
          readBy: ['user1'],
        },
      ];

      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={allReadNotifications}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={0}
        />
      );

      // Should not have any "New" badges
      expect(screen.queryByText('New')).not.toBeInTheDocument();
      // Should not show mark all as read button
      expect(screen.queryByRole('button', { name: /mark all as read/i })).not.toBeInTheDocument();
    });

    it('should handle large number of notifications', () => {
      const manyNotifications = Array.from({ length: 50 }, (_, i) => ({
        id: `notif${i}`,
        title: `Notification ${i}`,
        message: `Message ${i}`,
        createdAt: '2025-01-01T10:00:00Z',
        readBy: i % 2 === 0 ? ['user1'] : [],
      }));

      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={manyNotifications}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={25}
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('row')).toHaveLength(51); // 50 notifications + 1 header row
    });
  });

  describe('Edge Cases', () => {
    it('should handle notification with very long title', () => {
      const longTitleNotification = [
        {
          id: 'notif1',
          title: 'A'.repeat(200),
          message: 'Short message',
          createdAt: '2025-01-01T10:00:00Z',
          readBy: [],
        },
      ];

      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={longTitleNotification}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={1}
        />
      );

      expect(screen.getByText('A'.repeat(200))).toBeInTheDocument();
    });

    it('should handle notification with very long message', () => {
      const longMessageNotification = [
        {
          id: 'notif1',
          title: 'Short title',
          message: 'B'.repeat(500),
          createdAt: '2025-01-01T10:00:00Z',
          readBy: [],
        },
      ];

      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={longMessageNotification}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={1}
        />
      );

      expect(screen.getByText('B'.repeat(500))).toBeInTheDocument();
    });

    it('should handle notification with special characters in text', () => {
      const specialCharsNotification = [
        {
          id: 'notif1',
          title: 'Test & <Title> "with" \'special\' characters',
          message: 'Message with & < > " \' characters',
          createdAt: '2025-01-01T10:00:00Z',
          readBy: [],
        },
      ];

      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={specialCharsNotification}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={1}
        />
      );

      expect(screen.getByText('Test & <Title> "with" \'special\' characters')).toBeInTheDocument();
    });

    it('should handle empty currentId', () => {
      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={sampleNotifications}
          currentId=""
          markAllRead={mockMarkAllRead}
          unreadCount={3}
        />
      );

      // All notifications should appear as unread since empty string won't match any readBy
      const newBadges = screen.getAllByText('New');
      expect(newBadges.length).toBeGreaterThan(0);
    });

    it('should handle multiple users in readBy array', () => {
      const multiUserNotification = [
        {
          id: 'notif1',
          title: 'Multi-user notification',
          message: 'Read by multiple users',
          createdAt: '2025-01-01T10:00:00Z',
          readBy: ['user1', 'user2', 'user3', 'user4'],
        },
      ];

      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={multiUserNotification}
          currentId="user2"
          markAllRead={mockMarkAllRead}
          unreadCount={0}
        />
      );

      // Should show as read for user2
      expect(screen.queryByText('New')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible dialog role', () => {
      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={[]}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={0}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have accessible table structure', () => {
      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={sampleNotifications}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={1}
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader')).toHaveLength(5);
    });

    it('should have accessible button for mark all as read', () => {
      render(
        <NotificationModal
          isOpen={true}
          onClose={mockOnClose}
          notifications={sampleNotifications}
          currentId="user1"
          markAllRead={mockMarkAllRead}
          unreadCount={1}
        />
      );

      const button = screen.getByRole('button', { name: /mark all as read/i });
      expect(button).toBeInTheDocument();
    });
  });
});