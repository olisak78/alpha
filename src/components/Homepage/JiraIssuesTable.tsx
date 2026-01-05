import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { JiraIssue } from "@/types/api";
import JiraIssuesTableRow from "./JiraIssuesTableRow";

interface JiraIssuesTableProps {
  issues: JiraIssue[];
  showAssignee?: boolean;
}

export default function JiraIssuesTable({ issues, showAssignee = true }: JiraIssuesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Key</TableHead>
          <TableHead>Summary</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          {showAssignee && <TableHead>Assignee</TableHead>}
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {issues.map((issue: JiraIssue) => (
          <JiraIssuesTableRow key={issue.id} issue={issue} showAssignee={showAssignee} />
        ))}
        {issues.length === 0 && (
          <TableRow>
            <TableCell colSpan={showAssignee ? 7 : 6} className="text-center text-muted-foreground py-8">
              No issues found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}