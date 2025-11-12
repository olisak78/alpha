import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Builds a JIRA issue creation URL with the specified parameters
 * @param params - JIRA issue parameters
 * @returns Complete JIRA URL
 */
export function buildJiraFeedbackUrl(params: {
  summary: string;
  description?: string;
  pid?: string;
  issuetype?: string;
  components?: string;
  priority?: string;
  customfield_25940?: string;
  customfield_10002?: string;
  customfield_22953?: string;
}): string {
  const baseUrl = 'https://jira.tools.sap/secure/CreateIssueDetails!init.jspa';
  
  const urlParams = new URLSearchParams({
    pid: params.pid || '91536',
    issuetype: params.issuetype || '1',
    components: params.components || '279344',
    priority: params.priority || '3', // (1=Highest, 2=High, 3=Medium, 4=Low)
    customfield_25940: params.customfield_25940 || '118860',
    customfield_10002: params.customfield_10002 || '74481',
    customfield_22953: params.customfield_22953 || '75567',
    summary: params.summary,
  });

  if (params.description) {
    urlParams.append('description', params.description);
  }

  return `${baseUrl}?${urlParams.toString()}`;
}
