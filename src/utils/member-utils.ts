/**
 * Utility functions for member-related operations
 */

// Constants
export const SAP_PEOPLE_BASE_URL = "https://people.wdf.sap.corp";

/**
 * Opens a Microsoft Teams chat with the specified email address
 * @param email - The email address to start a chat with
 */
export const openTeamsChat = (email: string) => {
  // Microsoft Teams deep link format
  const teamsUrl = `msteams:/l/chat/0/0?users=${encodeURIComponent(email)}`;
  window.open(teamsUrl, '_blank');
};

/**
 * Opens the SAP People picture editing page for a given member ID
 * @param memberId - The member's ID to open the profile for
 */
export const openSAPProfile = (memberId: string) => {
  window.open(`${SAP_PEOPLE_BASE_URL}/profiles/${memberId}#?profile_tab=organization`, '_blank');
};

/**
 * Opens the SAP People profile for a given member ID
 * @param memberId - The member's ID to open the profile for
 */
export const openEditPicture = (memberId: string) => {
  window.open(`${SAP_PEOPLE_BASE_URL}/pictures/${memberId}`, '_blank');
};

/**
 * Opens Outlook with a new email compose window
 * @param email - The email address to send to
 */
export const openEmailClient = (email: string) => {
  // Open Outlook web with new compose window
  const outlookWebUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(email)}`;
  window.open(outlookWebUrl, '_blank');
};

/**
 * Formats a birth date from MM-DD format to a readable format
 * @param birthDate - Birth date in MM-DD format (no year)
 * @returns Formatted birth date string or original input if not MM-DD format
 */
export const formatBirthDate = (birthDate?: string): string => {
  // Handle undefined, null, or empty input
  if (!birthDate) {
    return birthDate || '';
  }

  // Check if it's in MM-DD format (1-2 digits, dash, 1-2 digits, nothing else)
  const mmddPattern = /^(\d{1,2})-(\d{1,2})$/;
  const match = birthDate.match(mmddPattern);
  
  if (match) {
    const [, monthStr, dayStr] = match;
    const month = parseInt(monthStr);
    const day = parseInt(dayStr);
    
    // Validate month range (1-12)
    if (month < 1 || month > 12) {
      return birthDate; // Return original if invalid month
    }
    
    // Validate day range (1-31, with month-specific validation)
    if (day < 1 || day > 31) {
      return birthDate; // Return original if obviously invalid day
    }
    
    // Create date and validate it matches the input (catches rollover)
    const date = new Date(2000, month - 1, day);
    
    // Check if the date is valid and matches the input values
    if (isNaN(date.getTime()) || 
        date.getMonth() !== month - 1 || 
        date.getDate() !== day) {
      return birthDate; // Return original if invalid date or rollover occurred
    }
    
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }
  
  // Return original input if not MM-DD format
  return birthDate;
};

/**
 * Formats a phone number for display
 * @param phoneNumber - The phone number to format (optional)
 * @returns Formatted phone number string or "Not specified" if not provided
 */
export const formatPhoneNumber = (phoneNumber: string | undefined): string => {
  if (!phoneNumber) return "Not specified";
  
  // Format international phone numbers: add dash after 4th digit for numbers starting with +
  if (phoneNumber.startsWith('+') && phoneNumber.length > 4) {
    return `${phoneNumber.substring(0, 4)}-${phoneNumber.substring(4)}`;
  }
  
  return phoneNumber;
};

/**
 * Copies text to the clipboard
 * @param e - Event object to stop propagation
 * @param text - The text to copy to clipboard
 */
export const copyToClipboard = async (e: React.MouseEvent, text: string) => {
  e.stopPropagation();
  try {
    await navigator.clipboard.writeText(text);
    // You could add a toast notification here if needed
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
};
