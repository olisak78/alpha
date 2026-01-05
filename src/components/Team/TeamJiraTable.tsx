import JiraIssuesTable from "@/components/Homepage/JiraIssuesTable";
import type { JiraIssue } from "@/types/api";

interface TeamJiraTableProps {
  filteredIssues: JiraIssue[];
}

export function TeamJiraTable({
  filteredIssues
}: TeamJiraTableProps) {
  // Use the shared JiraIssuesTable component with showAssignee=true for teams
  return <JiraIssuesTable issues={filteredIssues} showAssignee={true} />;
}
