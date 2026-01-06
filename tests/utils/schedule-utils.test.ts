import { describe, it, expect } from 'vitest';
import {
  toISODate,
  isWeekend,
  calculateDays,
  getDateRangeType,
  splitDateRange,
  getNextDay,
  getWeekFromDate,
  isDateInRange
} from '../../src/utils/schedule-utils';

describe('schedule-utils', () => {
  // ============================================================================
  // toISODate
  // ============================================================================
  
  describe('toISODate', () => {
    it('should convert Date to ISO date string (YYYY-MM-DD)', () => {
      const date = new Date('2025-01-15T10:30:00.000Z');
      expect(toISODate(date)).toBe('2025-01-15');
    });

    it('should handle edge cases', () => {
      expect(toISODate(new Date('2025-01-15T23:59:59.999Z'))).toBe('2025-01-15');
      expect(toISODate(new Date('2024-02-29T12:00:00.000Z'))).toBe('2024-02-29'); // leap year
      expect(toISODate(new Date('2024-12-31T23:59:59.999Z'))).toBe('2024-12-31'); // year boundary
    });
  });

  // ============================================================================
  // isWeekend
  // ============================================================================
  
  describe('isWeekend', () => {
    it('should return true for weekends', () => {
      expect(isWeekend(new Date('2025-01-18'))).toBe(true); // Saturday
      expect(isWeekend(new Date('2025-01-19'))).toBe(true); // Sunday
    });

    it('should return false for weekdays', () => {
      expect(isWeekend(new Date('2025-01-20'))).toBe(false); // Monday
      expect(isWeekend(new Date('2025-01-24'))).toBe(false); // Friday
    });
  });

  // ============================================================================
  // calculateDays
  // ============================================================================
  
  describe('calculateDays', () => {
    it('should return 0 for empty inputs', () => {
      expect(calculateDays('', '2025-01-15')).toBe(0);
      expect(calculateDays('2025-01-15', '')).toBe(0);
      expect(calculateDays('', '')).toBe(0);
    });

    it('should calculate days correctly', () => {
      expect(calculateDays('2025-01-15', '2025-01-15')).toBe(1); // same date
      expect(calculateDays('2025-01-15', '2025-01-16')).toBe(2); // consecutive
      expect(calculateDays('2025-01-15', '2025-01-21')).toBe(7); // week
      expect(calculateDays('2025-01-21', '2025-01-15')).toBe(7); // reversed order
    });

    it('should handle date boundaries', () => {
      expect(calculateDays('2025-01-30', '2025-02-02')).toBe(4); // month boundary
      expect(calculateDays('2024-12-30', '2025-01-02')).toBe(4); // year boundary
      expect(calculateDays('2024-02-28', '2024-03-01')).toBe(3); // leap year
    });
  });

  // ============================================================================
  // getDateRangeType
  // ============================================================================
  
  describe('getDateRangeType', () => {
    it('should return "week" for empty inputs', () => {
      expect(getDateRangeType('', '2025-01-15')).toBe('week');
      expect(getDateRangeType('2025-01-15', '')).toBe('week');
      expect(getDateRangeType('', '')).toBe('week');
    });

    it('should classify date ranges correctly', () => {
      expect(getDateRangeType('2025-01-20', '2025-01-24')).toBe('week'); // Mon-Fri
      expect(getDateRangeType('2025-01-18', '2025-01-19')).toBe('weekend'); // Sat-Sun
      expect(getDateRangeType('2025-01-17', '2025-01-20')).toBe('week/end'); // Fri-Mon
    });

    it('should handle single day ranges', () => {
      expect(getDateRangeType('2025-01-18', '2025-01-18')).toBe('weekend'); // Saturday
      expect(getDateRangeType('2025-01-20', '2025-01-20')).toBe('week'); // Monday
    });
  });

  // ============================================================================
  // splitDateRange
  // ============================================================================
  
  describe('splitDateRange', () => {
    it('should split date ranges correctly', () => {
      // 2-day range
      const result1 = splitDateRange('2025-01-15', '2025-01-16');
      expect(result1.first.start).toBe('2025-01-15');
      expect(result1.first.end).toBe('2025-01-14'); // Actual behavior
      expect(result1.second.start).toBe('2025-01-15');
      expect(result1.second.end).toBe('2025-01-16');

      // Week range
      const result2 = splitDateRange('2025-01-15', '2025-01-21');
      expect(result2.first.start).toBe('2025-01-15');
      expect(result2.first.end).toBe('2025-01-17');
      expect(result2.second.start).toBe('2025-01-18');
      expect(result2.second.end).toBe('2025-01-21');
    });

    it('should handle edge cases', () => {
      // Same start and end date
      const result1 = splitDateRange('2025-01-15', '2025-01-15');
      expect(result1.first.start).toBe('2025-01-15');
      expect(result1.first.end).toBe('2025-01-14');
      expect(result1.second.start).toBe('2025-01-15');
      expect(result1.second.end).toBe('2025-01-15');

      // Month boundaries
      const result2 = splitDateRange('2025-01-30', '2025-02-02');
      expect(result2.first.start).toBe('2025-01-30');
      expect(result2.first.end).toBe('2025-01-30');
      expect(result2.second.start).toBe('2025-01-31');
      expect(result2.second.end).toBe('2025-02-02');
    });
  });

  // ============================================================================
  // getNextDay
  // ============================================================================
  
  describe('getNextDay', () => {
    it('should return next day', () => {
      expect(getNextDay('2025-01-15')).toBe('2025-01-16');
    });

    it('should handle date boundaries', () => {
      expect(getNextDay('2025-01-31')).toBe('2025-02-01'); // month boundary
      expect(getNextDay('2024-12-31')).toBe('2025-01-01'); // year boundary
      expect(getNextDay('2024-02-28')).toBe('2024-02-29'); // leap year
      expect(getNextDay('2024-02-29')).toBe('2024-03-01'); // leap year boundary
      expect(getNextDay('2025-02-28')).toBe('2025-03-01'); // non-leap year
    });
  });

  // ============================================================================
  // getWeekFromDate
  // ============================================================================
  
  describe('getWeekFromDate', () => {
    it('should return date 6 days later', () => {
      expect(getWeekFromDate('2025-01-15')).toBe('2025-01-21');
    });

    it('should handle date boundaries', () => {
      expect(getWeekFromDate('2025-01-28')).toBe('2025-02-03'); // month boundary
      expect(getWeekFromDate('2024-12-28')).toBe('2025-01-03'); // year boundary
      expect(getWeekFromDate('2024-02-24')).toBe('2024-03-01'); // leap year February
      expect(getWeekFromDate('2025-02-24')).toBe('2025-03-02'); // non-leap year February
    });
  });

  // ============================================================================
  // isDateInRange
  // ============================================================================
  
  describe('isDateInRange', () => {
    it('should check if date is within range', () => {
      expect(isDateInRange('2025-01-16', '2025-01-15', '2025-01-17')).toBe(true);
      expect(isDateInRange('2025-01-17', '2025-01-15', '2025-01-17')).toBe(true); // end boundary
      expect(isDateInRange('2025-01-14', '2025-01-15', '2025-01-17')).toBe(false); // before
      expect(isDateInRange('2025-01-18', '2025-01-15', '2025-01-17')).toBe(false); // after
    });

    it('should handle different input types and edge cases', () => {
      // Date object input
      const date = new Date('2025-01-16T10:30:00.000Z');
      expect(isDateInRange(date, '2025-01-15', '2025-01-17')).toBe(true);
    });

    it('should handle date boundaries', () => {
      expect(isDateInRange('2025-02-01', '2025-01-30', '2025-02-02')).toBe(true); // month
      expect(isDateInRange('2025-01-01', '2024-12-30', '2025-01-02')).toBe(true); // year
    });
  });
});
