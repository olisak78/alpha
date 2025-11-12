import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { ExternalLink } from "lucide-react";
import { JiraIssue } from "@/types/api";

// Function to get badge variant and color based on status
const getStatusBadgeProps = (status: string) => {
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('done') || statusLower.includes('resolved') || statusLower.includes('closed')) {
    return { variant: "outline" as const, className: "border-green-500 text-green-700 bg-green-50" };
  }
  
  if (statusLower.includes('progress') || statusLower.includes('development') || statusLower.includes('review')) {
    return { variant: "outline" as const, className: "border-blue-500 text-blue-700 bg-blue-50" };
  }
  
  if (statusLower.includes('todo') || statusLower.includes('open') || statusLower.includes('new') || statusLower.includes('backlog')) {
    return { variant: "outline" as const, className: "border-gray-500 text-gray-700 bg-gray-50" };
  }
  
  if (statusLower.includes('blocked') || statusLower.includes('impediment')) {
    return { variant: "outline" as const, className: "border-red-500 text-red-700 bg-red-50" };
  }
  
  if (statusLower.includes('testing') || statusLower.includes('qa')) {
    return { variant: "outline" as const, className: "border-yellow-500 text-yellow-700 bg-yellow-50" };
  }
  
  // Default for unknown statuses
  return { variant: "outline" as const, className: "border-purple-500 text-purple-700 bg-purple-50" };
};

interface JiraIssuesTableRowProps {
  issue: JiraIssue;
}

export default function JiraIssuesTableRow({ issue }: JiraIssuesTableRowProps) {
  return (
    <TableRow key={issue.id}>
      <TableCell className="font-medium">
        <a 
          href={issue.link}
          target="_blank" 
          rel="noreferrer" 
          className="flex items-center gap-1 underline underline-offset-2 hover:text-primary"
        >
          {issue.key}
          <ExternalLink className="h-3 w-3" />
        </a>
      </TableCell>
      <TableCell className="max-w-xs truncate" title={issue.fields?.summary || 'No summary'}>
        {issue.fields?.summary || 'No summary'}
      </TableCell>
      <TableCell>
        {(() => {
          const statusName = issue.fields?.status?.name || 'Unknown';
          const badgeProps = getStatusBadgeProps(statusName);
          return (
            <Badge 
              variant={badgeProps.variant} 
              className={badgeProps.className}
            >
              {statusName}
            </Badge>
          );
        })()}
      </TableCell>
      <TableCell>{issue.fields?.priority?.name || 'Unknown'}</TableCell>
      <TableCell>
        {issue.fields?.updated ? new Date(issue.fields.updated).toLocaleString() : 'Unknown'}
      </TableCell>
    </TableRow>
  );
}
