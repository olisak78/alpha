import { JiraIssuesCountResponse, JiraIssuesParams, JiraIssuesResponse, MyJiraIssuesCountParams, MyJiraIssuesParams } from "@/types/api";
import { apiClient } from "./ApiClient";

/**
 * Fetch Jira issues for teams/projects
 * 
 * Endpoint: GET http://localhost:7008/api/v1/jira/issues
 * 
 * Query Parameters (all optional):
 * - project: string - Jira project key (e.g., "SAPBTPCFS", "PROJECT-ABC")
 * - status: string - Jira status values, comma-separated (e.g., "Open,In Progress,Re Opened")
 * - team: string - Team name for filtering issues assigned to team members
 * - assignee: string - Assignee username or "unassigned" or "all" (default: "all")
 * - type: string - Issue type (e.g., "bug", "task")
 * - summary: string - Search term for issue summary (partial match)
 * - key: string - Search term for issue key (partial match)
 * - page: number - Page number for pagination (default: 1)
 * - limit: number - Number of items per page (default: 50, max: 100)
 */
export async function fetchJiraIssues(params?: JiraIssuesParams): Promise<JiraIssuesResponse> {
  return apiClient.get<JiraIssuesResponse>(`/jira/issues`, { 
    params: params as unknown as Record<string, string | number | boolean | undefined>
  });
}

/**
 * Fetch my Jira issues
 */
export async function fetchMyJiraIssues(params: MyJiraIssuesParams): Promise<JiraIssuesResponse> {
  return apiClient.get<JiraIssuesResponse>(`/jira/issues/me`, { 
    params: params as unknown as Record<string, string | number | boolean | undefined>
  });
}

/**
 * Fetch count of my Jira issues by status
 */
export async function fetchMyJiraIssuesCount(params: MyJiraIssuesCountParams): Promise<JiraIssuesCountResponse> {
  return apiClient.get<JiraIssuesCountResponse>(`/jira/issues/me/count`, { 
    params: params as unknown as Record<string, string | number | boolean | undefined>
  });
}
