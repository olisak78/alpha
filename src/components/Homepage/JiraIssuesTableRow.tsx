import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { ExternalLink, ChevronRight, ChevronDown, Minus } from "lucide-react";
import { JiraIssue } from "@/types/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";

// Helper function to get color for issue type
const getTypeColor = (type: string): string => {
  const typeLower = type.toLowerCase();
  if (typeLower.includes('bug')) return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800';
  if (typeLower.includes('story') || typeLower.includes('feature')) return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
  if (typeLower.includes('task')) return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800';
  if (typeLower.includes('epic')) return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800';
  if (typeLower.includes('subtask') || typeLower.includes('sub-task')) return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
};

// Helper function to get color for status
const getStatusColor = (status: string): string => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('done') || statusLower.includes('closed') || statusLower.includes('resolved')) {
    return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800';
  }
  if (statusLower.includes('progress') || statusLower.includes('development')) {
    return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
  }
  if (statusLower.includes('review') || statusLower.includes('testing')) {
    return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800';
  }
  if (statusLower.includes('todo') || statusLower.includes('open') || statusLower.includes('backlog')) {
    return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  }
  if (statusLower.includes('blocked')) {
    return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
};

// Helper function to get color for priority
const getPriorityColor = (priority: string): string => {
  const priorityLower = priority.toLowerCase();
  if (priorityLower.includes('highest') || priorityLower.includes('critical')) {
    return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800';
  }
  if (priorityLower.includes('high')) {
    return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800';
  }
  if (priorityLower.includes('medium')) {
    return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800';
  }
  if (priorityLower.includes('low')) {
    return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800';
  }
  if (priorityLower.includes('lowest')) {
    return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
  }
  return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
};

interface JiraIssuesTableRowProps {
  issue: JiraIssue;
  showAssignee?: boolean;
  isSubtask?: boolean;
}

export default function JiraIssuesTableRow({ issue, showAssignee = true, isSubtask = false }: JiraIssuesTableRowProps) {
  const [isExpanded, setIsExpanded] = useState(true); // Default to expanded
  const hasSubtasks = issue.fields?.subtasks && issue.fields.subtasks.length > 0;

  const renderIssueRow = (issueData: JiraIssue, indent: boolean = false) => (
    <TableRow key={issueData.id} className={indent ? "bg-muted/30" : ""}>
      <TableCell>
        <div className={`flex items-center gap-1 ${indent ? "pl-8" : ""}`}>
          {indent && (
            <Minus className="h-3 w-3 text-muted-foreground" />
          )}
          {!indent && hasSubtasks && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-transparent"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          {!indent && !hasSubtasks && <div className="w-6" />}
          <a
            href={issueData.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            {issueData.key} <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </TableCell>
      <TableCell className="max-w-[420px] truncate" title={issueData.fields?.summary}>
        {issueData.fields?.summary}
      </TableCell>
      <TableCell>
        <Badge className={`${getTypeColor(issueData.fields?.issuetype?.name || '')} border`}>
          {issueData.fields?.issuetype?.name}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge className={`${getStatusColor(issueData.fields?.status?.name || '')} border`}>
          {issueData.fields?.status?.name}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge className={`${getPriorityColor(issueData.fields?.priority?.name || 'N/A')} border`}>
          {issueData.fields?.priority?.name || 'N/A'}
        </Badge>
      </TableCell>
      {showAssignee && <TableCell>{issueData.fields?.assignee?.displayName || 'Unassigned'}</TableCell>}
      <TableCell className="whitespace-nowrap">
        {new Date(issueData.fields?.updated).toLocaleString('en-US')}
      </TableCell>
    </TableRow>
  );

  return (
    <>
      {renderIssueRow(issue)}
      {hasSubtasks && isExpanded && issue.fields.subtasks!.filter((subtask) => {
     
        const closedStatuses = ['resolved', 'closed', 'done', 'completed', 'cancelled', 'rejected'];
        const subtaskStatusLower = subtask.fields?.status?.name?.toLowerCase() || '';
        return !closedStatuses.some(closed => subtaskStatusLower.includes(closed));
      }).map((subtask) => {
        // Convert subtask to JiraIssue format for rendering
        const subtaskIssue: JiraIssue = {
          id: subtask.id,
          key: subtask.key,
          fields: {
            summary: subtask.fields.summary,
            status: subtask.fields.status,
            issuetype: subtask.fields.issuetype,
            priority: subtask.fields.priority,
            created: issue.fields.created, // Not available in subtask, use parent
            updated: issue.fields.updated, // Not available in subtask, use parent
          },
          project: issue.project,
          link: `${issue.link.split('/browse/')[0]}/browse/${subtask.key}`,
        };
        return renderIssueRow(subtaskIssue, true);
      })}
    </>
  );
}
