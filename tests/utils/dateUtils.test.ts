import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatAlertDate, formatAlertDateOnly, formatAlertTimeOnly } from '../../src/utils/dateUtils';

describe('dateUtils', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('formatAlertDate', () => {
    it('should format valid dates with proper padding and handle edge cases', () => {
      // Test valid formatting with padding
      expect(formatAlertDate('2024-01-05T09:05:05.000Z')).toBe('05/01/2024 09:05:05');
      expect(formatAlertDate('2024-12-25T23:59:59.999Z')).toBe('25/12/2024 23:59:59');
      
      // Test null input (epoch date)
      expect(formatAlertDate(null as any)).toBe('01/01/1970 00:00:00');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should return "Invalid Date" and log error for invalid inputs', () => {
      const testCases = ['not-a-date', '', undefined];
      
      testCases.forEach((input, index) => {
        consoleErrorSpy.mockClear();
        const result = formatAlertDate(input as any);
        
        expect(result).toBe('Invalid Date');
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error formatting date:', expect.any(Error));
      });
    });
  });

  describe('formatAlertDateOnly', () => {
    it('should format valid dates and handle edge cases', () => {
      expect(formatAlertDateOnly('2024-01-05T09:05:05.000Z')).toBe('05/01/2024');
      expect(formatAlertDateOnly(null as any)).toBe('01/01/1970');
    });

    it('should return "Invalid Date" and log error for invalid inputs', () => {
      const result = formatAlertDateOnly('invalid-date');
      
      expect(result).toBe('Invalid Date');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error formatting date:', expect.any(Error));
    });
  });

  describe('formatAlertTimeOnly', () => {
    it('should format valid times including midnight and handle edge cases', () => {
      expect(formatAlertTimeOnly('2024-01-05T09:05:05.000Z')).toBe('09:05:05');
      expect(formatAlertTimeOnly('2024-01-15T00:00:00.000Z')).toBe('00:00:00');
      expect(formatAlertTimeOnly(null as any)).toBe('00:00:00');
    });

    it('should return "Invalid Time" and log error for invalid inputs', () => {
      const result = formatAlertTimeOnly('not-a-valid-time');
      
      expect(result).toBe('Invalid Time');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error formatting time:', expect.any(Error));
    });
  });

  describe('UTC consistency', () => {
    it('should format all functions consistently in UTC', () => {
      const dateString = '2024-06-15T12:00:00.000Z';
      
      expect(formatAlertDate(dateString)).toBe('15/06/2024 12:00:00');
      expect(formatAlertDateOnly(dateString)).toBe('15/06/2024');
      expect(formatAlertTimeOnly(dateString)).toBe('12:00:00');
    });
  });
});
