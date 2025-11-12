
export const PROJECT_API_NAMES: Record<string, string> = {
  'CIS@2.0': 'cis20',
  'Cloud Automation': 'ca',
  'Unified Services': 'usrv',
};

/**
 * Get API project name from display name
 */
export function getProjectApiName(projectDisplayName: string): string {
  return PROJECT_API_NAMES[projectDisplayName] || '';
}

/**
 * Get display name from API project name
 */
export function getProjectDisplayName(apiName: string): string {
  const entry = Object.entries(PROJECT_API_NAMES).find(([_, value]) => value === apiName);
  return entry ? entry[0] : '';
}