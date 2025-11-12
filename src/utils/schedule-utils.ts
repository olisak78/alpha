// Shared utilities for schedule operations

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function calculateDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

export function getDateRangeType(start: string, end: string): string {
  if (!start || !end) return "week";
  
  const startDate = new Date(start);
  const endDate = new Date(end);
  const dates = [];
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }
  
  const weekdays = dates.filter(d => d.getDay() !== 0 && d.getDay() !== 6);
  const weekends = dates.filter(d => d.getDay() === 0 || d.getDay() === 6);
  
  if (weekdays.length > 0 && weekends.length > 0) return "week/end";
  if (weekends.length > 0) return "weekend";
  return "week";
}

export function splitDateRange(start: string, end: string): {
  first: { start: string; end: string };
  second: { start: string; end: string };
} {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const midTime = (startDate.getTime() + endDate.getTime()) / 2;
  const midDate = new Date(midTime);
  const midDay = new Date(midDate.toISOString().slice(0, 10));
  const prevDay = new Date(midDay.getTime() - 24 * 3600 * 1000);
  
  return {
    first: { start, end: prevDay.toISOString().slice(0, 10) },
    second: { start: midDay.toISOString().slice(0, 10), end }
  };
}

export function getNextDay(date: string): string {
  const nextDay = new Date(new Date(date).getTime() + 24 * 3600 * 1000);
  return nextDay.toISOString().slice(0, 10);
}

export function getWeekFromDate(date: string): string {
  const endDate = new Date(new Date(date).getTime() + 6 * 24 * 3600 * 1000);
  return endDate.toISOString().slice(0, 10);
}

export function isDateInRange(date: Date | string, startDate: string, endDate: string): boolean {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  // Normalize to start of day to avoid time zone issues
  const normalizedDate = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return normalizedDate >= start && normalizedDate <= end;
}
