import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  openTeamsChat,
  openSAPProfile,
  openEmailClient,
  formatBirthDate,
  formatPhoneNumber,
  copyToClipboard,
  SAP_PEOPLE_BASE_URL
} from '../../src/utils/member-utils';

/**
 * Member Utils Tests
 * 
 * Optimized tests for member-related utility functions with comprehensive
 * coverage while minimizing redundancy.
 */

describe('member-utils', () => {
  const mockWindowOpen = vi.fn();
  const mockLocationHref = vi.fn();
  let originalWindowOpen: typeof window.open;
  let originalLocation: Location;

  beforeEach(() => {
    // Store originals
    originalWindowOpen = window.open;
    originalLocation = window.location;

    // Setup mocks
    window.open = mockWindowOpen;
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
    Object.defineProperty(window.location, 'href', {
      set: mockLocationHref,
      configurable: true,
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore originals
    window.open = originalWindowOpen;
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  // ============================================================================
  // CONSTANTS
  // ============================================================================

  it('should have correct SAP_PEOPLE_BASE_URL', () => {
    expect(SAP_PEOPLE_BASE_URL).toBe('https://people.wdf.sap.corp');
  });

  // ============================================================================
  // formatBirthDate - Core business logic function
  // ============================================================================

  describe('formatBirthDate', () => {
    it('should format valid MM-DD dates', () => {
      expect(formatBirthDate('03-15')).toBe('March 15');
      expect(formatBirthDate('12-25')).toBe('December 25');
      expect(formatBirthDate('1-5')).toBe('January 5'); // single digits
      expect(formatBirthDate('02-29')).toBe('February 29'); // leap year edge case
    });

    it('should handle null/undefined/empty inputs', () => {
      expect(formatBirthDate(undefined)).toBe('');
      expect(formatBirthDate('')).toBe('');
      expect(formatBirthDate(null as any)).toBe('');
    });

    it('should return non-MM-DD formats unchanged', () => {
      expect(formatBirthDate('March 15')).toBe('March 15');
      expect(formatBirthDate('2024-03-15')).toBe('2024-03-15'); // YYYY-MM-DD
      expect(formatBirthDate('15/03/2024')).toBe('15/03/2024');
      expect(formatBirthDate('abc-def')).toBe('abc-def'); // malformed
      expect(formatBirthDate('123-456')).toBe('123-456'); // too many digits
    });

    it('should handle invalid MM-DD dates gracefully', () => {
      expect(formatBirthDate('13-15')).toBe('13-15'); // invalid month - return original
      expect(formatBirthDate('03-32')).toBe('03-32'); // invalid day - return original
      expect(formatBirthDate('00-15')).toBe('00-15'); // invalid month (0) - return original
      expect(formatBirthDate('02-30')).toBe('02-30'); // invalid day for February - return original
      expect(formatBirthDate('04-31')).toBe('04-31'); // invalid day for April - return original
    });
  });

  // ============================================================================
  // formatPhoneNumber - Core business logic function
  // ============================================================================

  describe('formatPhoneNumber', () => {
    it('should return "Not specified" for undefined/null/empty inputs', () => {
      expect(formatPhoneNumber(undefined)).toBe('Not specified');
      expect(formatPhoneNumber('')).toBe('Not specified');
    });

    it('should format international phone numbers with dash after 4th digit', () => {
      expect(formatPhoneNumber('+49123456789')).toBe('+491-23456789');
      expect(formatPhoneNumber('+1234567890')).toBe('+123-4567890');
    });

    it('should return phone numbers unchanged if they do not start with +', () => {
      expect(formatPhoneNumber('123456789')).toBe('123456789');
      expect(formatPhoneNumber('555-1234')).toBe('555-1234');
    });
  });

  // ============================================================================
  // copyToClipboard - Browser integration function
  // ============================================================================

  describe('copyToClipboard', () => {
    let mockWriteText: ReturnType<typeof vi.fn>;
    let mockEvent: React.MouseEvent;
    let originalClipboard: Clipboard;

    beforeEach(() => {
      // Mock clipboard API
      mockWriteText = vi.fn().mockResolvedValue(undefined);
      originalClipboard = navigator.clipboard;
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
      });

      // Mock React event
      mockEvent = {
        stopPropagation: vi.fn(),
      } as unknown as React.MouseEvent;

      // Mock console.error to avoid noise in tests
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      // Restore clipboard
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        writable: true,
      });
      vi.restoreAllMocks();
    });

    it('should copy text to clipboard and stop event propagation', async () => {
      await copyToClipboard(mockEvent, 'test text');

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockWriteText).toHaveBeenCalledWith('test text');
    });

    it('should handle clipboard API errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      mockWriteText.mockRejectedValue(new Error('Clipboard access denied'));

      await copyToClipboard(mockEvent, 'test text');

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockWriteText).toHaveBeenCalledWith('test text');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy text: ', expect.any(Error));
    });
  });

  // ============================================================================
  // Browser integration functions - Smoke tests
  // ============================================================================

  describe('openTeamsChat', () => {
    it('should open Teams with correct URL and handle edge cases', () => {
      openTeamsChat('john.doe@example.com');
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'msteams:/l/chat/0/0?users=john.doe%40example.com',
        '_blank'
      );

      // Should handle special characters and not throw on invalid input
      expect(() => openTeamsChat('user+tag@example.com')).not.toThrow();
      expect(() => openTeamsChat('')).not.toThrow();
    });
  });

  describe('openSAPProfile', () => {
    it('should open SAP profile with correct URL and handle edge cases', () => {
      openSAPProfile('user123');
      expect(mockWindowOpen).toHaveBeenCalledWith(
        `${SAP_PEOPLE_BASE_URL}/profiles/user123#?profile_tab=organization`,
        '_blank'
      );

      // Should handle various ID formats and not throw on invalid input
      expect(() => openSAPProfile('USER-456')).not.toThrow();
      expect(() => openSAPProfile('')).not.toThrow();
    });
  });

  describe('openEmailClient', () => {
    it('should open Outlook web with correct URL and handle edge cases', () => {
      openEmailClient('john.doe@example.com');
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://outlook.office.com/mail/deeplink/compose?to=john.doe%40example.com',
        '_blank'
      );

      // Should handle special characters and multiple emails
      expect(() => openEmailClient('user+tag@example.com')).not.toThrow();
      expect(() => openEmailClient('user1@example.com,user2@example.com')).not.toThrow();
    });
  });

  // ============================================================================
  // Integration
  // ============================================================================

  it('should maintain function independence', () => {
    mockWindowOpen.mockImplementationOnce(() => { throw new Error('Blocked'); });
    
    expect(() => openTeamsChat('test@example.com')).toThrow('Blocked');
    expect(() => openSAPProfile('user123')).not.toThrow();
    expect(() => openEmailClient('test@example.com')).not.toThrow();
    expect(formatBirthDate('03-15')).toBe('March 15');
  });
});
