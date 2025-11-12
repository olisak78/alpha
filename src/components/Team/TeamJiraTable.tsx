import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import type { JiraIssue } from "@/types/api";

interface TeamJiraTableProps {
  filteredIssues: JiraIssue[];
}

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

export function TeamJiraTable({
  filteredIssues
}: TeamJiraTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Key</TableHead>
          <TableHead>Summary</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Assignee</TableHead>
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredIssues.map((issue:JiraIssue) => {
          return (
            <TableRow key={issue.id}>
              <TableCell>
                <a 
                  href={issue.link} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {issue.key} <ExternalLink className="h-3 w-3" />
                </a>
              </TableCell>
              <TableCell className="max-w-[420px] truncate" title={issue.fields?.summary}>
                {issue.fields?.summary}
              </TableCell>
              <TableCell>
                <Badge className={`${getTypeColor(issue.fields?.issuetype?.name || '')} border`}>
                  {issue.fields?.issuetype?.name}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={`${getStatusColor(issue.fields?.status?.name || '')} border`}>
                  {issue.fields?.status?.name}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={`${getPriorityColor(issue.fields?.priority?.name || 'N/A')} border`}>
                  {issue.fields?.priority?.name || 'N/A'}
                </Badge>
              </TableCell>
              <TableCell>{issue.fields?.assignee?.displayName || 'Unassigned'}</TableCell>
              <TableCell className="whitespace-nowrap">
                {new Date(issue.fields?.updated).toLocaleString('en-US')}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
