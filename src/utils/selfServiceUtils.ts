/**
 * Utility functions and types for Self Service features
 */

/**
 * Time period options for job history filtering
 */
export type TimePeriod = 'last24h' | 'last48h' | 'thisWeek' | 'thisMonth';

export interface TimePeriodOption {
  value: TimePeriod;
  label: string;
  hours: number | (() => number);
}

/**
 * Calculate hours since the start of Sunday (week start)
 */
export const getHoursSinceSundayStart = (): number => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Calculate start of Sunday
  const sundayStart = new Date(now);
  sundayStart.setDate(now.getDate() - dayOfWeek);
  sundayStart.setHours(0, 0, 0, 0);
  
  // Calculate hours difference
  const diffMs = now.getTime() - sundayStart.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60));
};

/**
 * Calculate hours since the start of the current month (1st day at 00:00)
 */
export const getHoursSinceMonthStart = (): number => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  
  // Calculate hours difference
  const diffMs = now.getTime() - monthStart.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60));
};

/**
 * Time period options configuration
 */
export const TIME_PERIODS: TimePeriodOption[] = [
  { value: 'last24h', label: 'Last 24 hours', hours: 24 },
  { value: 'last48h', label: 'Last 48 hours', hours: 48 },
  { value: 'thisWeek', label: 'This week', hours: getHoursSinceSundayStart },
  { value: 'thisMonth', label: 'This month', hours: getHoursSinceMonthStart },
];

/**
 * Get hours value for a time period
 */
export const getHoursForPeriod = (period: TimePeriod): number => {
  const option = TIME_PERIODS.find(p => p.value === period);
  if (!option) return 48; // Default fallback
  
  return typeof option.hours === 'function' ? option.hours() : option.hours;
};

/**
 * Format a date string to a readable format
 */
export const formatDateTime = (dateString: string): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch {
    return dateString;
  }
};

/**
 * Check if a parameter value is empty/null and should be filtered out
 */
export const isEmptyParameter = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (value === '') return true;
  if (typeof value === 'object') {
    if (Array.isArray(value) && value.length === 0) return true;
    if (Object.keys(value).length === 0) return true;
  }
  return false;
};

/**
 * Format duration in milliseconds to human-readable format
 */
export const formatDuration = (durationMs: number): string => {
  if (!durationMs) return '-';
  
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;
    return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Calculate time ago from lastPolledAt timestamp
 */
export const getTimeAgo = (lastPolledAt: string): string => {
  if (!lastPolledAt) return '-';
  
  const now = new Date();
  const polledTime = new Date(lastPolledAt);
  const diffMs = now.getTime() - polledTime.getTime();
  
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;  // ← No "ago" suffix
  } else if (minutes > 59) {  // ← Changed condition
    return `${hours}h ${minutes % 60}m`;  // ← "Nh Mm" format
  } else if (minutes > 0) {
    return `${minutes}m ago`;  // ← Keep "ago" for < 60 minutes
  } else {
    return 'Just now';
  }
};
