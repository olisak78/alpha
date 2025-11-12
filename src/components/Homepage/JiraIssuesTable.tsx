import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { JiraIssue } from "@/types/api";
import JiraIssuesTableRow from "./JiraIssuesTableRow";
import { SortField, SortOrder } from "@/constants/developer-portal";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

interface JiraIssuesTableProps {
  issues: JiraIssue[];
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}

export default function JiraIssuesTable({ issues, sortField, sortOrder, onSort }: JiraIssuesTableProps) {
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    return sortOrder === 'asc'
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };
  return (
    <Table>
      <TableHeader>
        <TableRow>
         <TableHead 
            className="cursor-pointer select-none hover:bg-muted/50"
            onClick={() => onSort('key')}
          >
            <div className="flex items-center">
              Key
              <SortIcon field="key" />
            </div>
          </TableHead>
          <TableHead 
            className="cursor-pointer select-none hover:bg-muted/50"
            onClick={() => onSort('summary')}
          >
            <div className="flex items-center">
              Summary
              <SortIcon field="summary" />
            </div>
          </TableHead>
          <TableHead 
            className="cursor-pointer select-none hover:bg-muted/50"
            onClick={() => onSort('status')}
          >
            <div className="flex items-center">
              Status
              <SortIcon field="status" />
            </div>
          </TableHead>
          <TableHead 
            className="cursor-pointer select-none hover:bg-muted/50"
            onClick={() => onSort('priority')}
          >
            <div className="flex items-center">
              Priority
              <SortIcon field="priority" />
            </div>
          </TableHead>
          <TableHead 
            className="cursor-pointer select-none hover:bg-muted/50"
            onClick={() => onSort('updated')}
          >
            <div className="flex items-center">
              Updated
              <SortIcon field="updated" />
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {issues.map((issue: JiraIssue) => (
          <JiraIssuesTableRow key={issue.id} issue={issue} />
        ))}
        {issues.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
              No issues found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}