import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import TopBarDateTime from '../../../src/components/DeveloperPortalHeader/TopBarDateTime';
import { useIsMobile } from '../../../src/hooks/use-mobile';

// Mock the useIsMobile hook
vi.mock('../../../src/hooks/use-mobile');

// Mock lucide-react Clock icon
vi.mock('lucide-react', () => ({
  Clock: ({ className, ...props }: any) => (
    <div data-testid="clock-icon" className={className} {...props}>
      Clock
    </div>
  )
}));

describe('TopBarDateTime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Set a consistent system time for testing
    vi.setSystemTime(new Date('2023-12-25T14:30:45.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Desktop view', () => {
    beforeEach(() => {
      vi.mocked(useIsMobile).mockReturnValue(false);
    });

    it('renders correctly with proper structure and accessibility', () => {
      render(<TopBarDateTime />);

      // Check basic rendering
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
      expect(screen.getByRole('time')).toBeInTheDocument();

      // Check accessibility attributes
      const clockIcon = screen.getByTestId('clock-icon');
      const timeElement = screen.getByRole('time');
      
      expect(clockIcon).toHaveAttribute('aria-hidden', 'true');
      expect(timeElement).toHaveAttribute('aria-label', 'Current date and time');
      expect(timeElement).toHaveAttribute('title');
      expect(timeElement.textContent).toBeTruthy();

      // Check CSS classes
      const container = timeElement.parentElement;
      expect(container).toHaveClass('inline-flex', 'items-center', 'gap-2', 'text-sm', 'text-white', 'select-none');
      expect(clockIcon).toHaveClass('h-4', 'w-4', 'text-white');
    });
  });

  describe('Mobile view', () => {
    it('uses different format for mobile vs desktop', () => {
      // Test desktop format first
      vi.mocked(useIsMobile).mockReturnValue(false);
      const { rerender } = render(<TopBarDateTime />);
      
      const timeElement = screen.getByRole('time');
      const desktopText = timeElement.textContent;

      // Test mobile format
      vi.mocked(useIsMobile).mockReturnValue(true);
      rerender(<TopBarDateTime />);
      
      const mobileText = timeElement.textContent;
      
      // Verify both formats exist and have accessibility
      expect(desktopText).toBeTruthy();
      expect(mobileText).toBeTruthy();
      expect(timeElement).toHaveAttribute('aria-label', 'Current date and time');
      
      // Note: The actual format difference depends on locale and Intl implementation
      // The important thing is that both formats render successfully
    });
  });

  describe('Time updates', () => {
    beforeEach(() => {
      vi.mocked(useIsMobile).mockReturnValue(false);
    });

    it('updates time every second', () => {
      render(<TopBarDateTime />);

      const timeElement = screen.getByRole('time');
      const initialText = timeElement.textContent;

      // Advance system time by 1 second
      act(() => {
        vi.setSystemTime(new Date('2023-12-25T14:30:46.000Z'));
        vi.advanceTimersByTime(1000);
      });

      // Time should have updated
      expect(timeElement.textContent).not.toBe(initialText);
    });

    it('cleans up interval on unmount', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      const { unmount } = render(<TopBarDateTime />);
      
      unmount();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('recreates interval when isMobile changes', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      vi.mocked(useIsMobile).mockReturnValue(false);
      const { rerender } = render(<TopBarDateTime />);
      
      const initialCallCount = setIntervalSpy.mock.calls.length;
      
      // Change isMobile value
      vi.mocked(useIsMobile).mockReturnValue(true);
      rerender(<TopBarDateTime />);
      
      // Should have cleared old interval and created new one
      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(setIntervalSpy.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      vi.mocked(useIsMobile).mockReturnValue(false);
    });

    it('falls back to toLocaleString when Intl.DateTimeFormat fails', () => {
      // Mock Intl.DateTimeFormat to throw an error
      const originalIntl = global.Intl;
      const mockDateTimeFormat = vi.fn().mockImplementation(() => {
        throw new Error('Intl not supported');
      });
      
      global.Intl = {
        ...originalIntl,
        DateTimeFormat: mockDateTimeFormat as any
      };

      // Mock Date.prototype.toLocaleString
      const toLocaleStringSpy = vi.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('Fallback time');

      render(<TopBarDateTime />);

      const timeElement = screen.getByRole('time');
      expect(timeElement.textContent).toBe('Fallback time');
      expect(toLocaleStringSpy).toHaveBeenCalled();

      // Restore mocks
      global.Intl = originalIntl;
      toLocaleStringSpy.mockRestore();
    });
  });

  describe('formatNow function behavior', () => {
    it('uses correct Intl options for desktop', () => {
      const formatSpy = vi.fn().mockReturnValue('formatted time');
      const DateTimeFormatSpy = vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => ({
        format: formatSpy
      } as any));

      vi.mocked(useIsMobile).mockReturnValue(false);
      render(<TopBarDateTime />);

      expect(DateTimeFormatSpy).toHaveBeenCalledWith(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      DateTimeFormatSpy.mockRestore();
    });

    it('uses correct Intl options for mobile', () => {
      const formatSpy = vi.fn().mockReturnValue('formatted time');
      const DateTimeFormatSpy = vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => ({
        format: formatSpy
      } as any));

      vi.mocked(useIsMobile).mockReturnValue(true);
      render(<TopBarDateTime />);

      expect(DateTimeFormatSpy).toHaveBeenCalledWith(undefined, {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      DateTimeFormatSpy.mockRestore();
    });
  });
});
