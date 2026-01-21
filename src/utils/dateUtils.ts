/**
 * Formats a date string consistently across different environments
 * Uses UTC timezone to ensure consistent formatting regardless of local timezone
 */
export function formatAlertDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    
    // Check if the date is invalid
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date string provided');
    }
    
    // Extract UTC components
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Formats only the date part of a date string
 * Uses UTC timezone to ensure consistent formatting regardless of local timezone
 */
export function formatAlertDateOnly(dateString: string): string {
  try {
    const date = new Date(dateString);
    
    // Check if the date is invalid
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date string provided');
    }
    
    // Extract UTC components
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Formats only the time part of a date string
 * Uses UTC timezone to ensure consistent formatting regardless of local timezone
 */
export function formatAlertTimeOnly(dateString: string): string {
  try {
    const date = new Date(dateString);
    
    // Check if the date is invalid
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date string provided');
    }
    
    // Extract UTC components
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid Time';
  }
}
