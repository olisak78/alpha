import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bug } from "lucide-react";
import { useMyJiraIssues } from "@/hooks/api/useJira";
import { JiraIssue } from "@/types/api";
import JiraIssuesTable from "@/components/Homepage/JiraIssuesTable";
import JiraIssuesFilter from "@/components/Homepage/JiraIssuesFilter";
import TablePagination from "@/components/TablePagination";
import { SortField, SortOrder } from "@/constants/developer-portal";


export default function JiraIssuesTab() {
  const [jiStatus, setJiStatus] = useState<string>("all");
  const [jiProject, setJiProject] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('updated');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const perPage = 10;

  // Define open statuses (exclude resolved/closed/done statuses)
  const getOpenStatusFilter = () => {
    return "Open,In Progress,To Do,Backlog,Selected for Development,In Review,Testing,Blocked,Reopened";
  };

  // Fetch issue from API
  const { data: apiData, isLoading, error } = useMyJiraIssues({
    status: getOpenStatusFilter(),
    limit: 100, // Get a large number to get all user's issues
  });

  const allIssues = apiData?.issues || [];

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Client-side filtering and sorting
  const filteredIssues = useMemo(() => {
    let filtered = allIssues;

    // Filter by status
    if (jiStatus !== "all") {
      filtered = filtered.filter((issue: JiraIssue) =>
        issue.fields?.status?.name === jiStatus
      );
    }

    // Filter by project
    if (jiProject !== "all") {
      filtered = filtered.filter((issue: JiraIssue) =>
        issue.project === jiProject
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortField) {
        case 'key':
          aValue = a.key || '';
          bValue = b.key || '';
          break;
        case 'summary':
          aValue = a.fields?.summary?.toLowerCase() || '';
          bValue = b.fields?.summary?.toLowerCase() || '';
          break;
        case 'status':
          aValue = a.fields?.status?.name?.toLowerCase() || '';
          bValue = b.fields?.status?.name?.toLowerCase() || '';
          break;
        case 'priority':
          const priorityOrder: Record<string, number> = {
            'blocker': 1,
            'critical': 2,
            'very high': 3,
            'high': 4,
            'medium': 5,
            'low': 6,
            'unknown': 7
          };
          aValue = priorityOrder[a.fields?.priority?.name?.toLowerCase() || ''] || 99;
          bValue = priorityOrder[b.fields?.priority?.name?.toLowerCase() || ''] || 99;
          break;
        case 'updated':
          aValue = a.fields?.updated || '';
          bValue = b.fields?.updated || '';
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return sorted;
  }, [allIssues, jiStatus, jiProject, sortField, sortOrder]);

  // Client-side pagination
  const totalPages = Math.ceil(filteredIssues.length / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const paginatedIssues = filteredIssues.slice(startIndex, startIndex + perPage);

  // Reset to first page when filters change
  useEffect(() => setCurrentPage(1), [jiStatus, jiProject]);

  // Get unique statuses and projects from all issues for filter options
  const availableStatuses = useMemo(() => {
    const statusSet = new Set<string>();
    const closedStatuses = ['resolved', 'closed', 'done', 'completed', 'cancelled', 'rejected'];

    allIssues.forEach((issue: JiraIssue) => {
      if (issue.fields?.status?.name) {
        const statusName = issue.fields.status.name;
        const isClosedStatus = closedStatuses.some(closedStatus =>
          statusName.toLowerCase().includes(closedStatus)
        );

        // Only add open statuses to the dropdown
        if (!isClosedStatus) {
          statusSet.add(statusName);
        }
      }
    });

    return Array.from(statusSet).sort();
  }, [allIssues]);

  const availableProjects = useMemo(() => {
    const projectSet = new Set<string>();
    allIssues.forEach((issue: JiraIssue) => {
      if (issue.project && typeof issue.project === 'string') {
        projectSet.add(issue.project);
      }
    });
    return Array.from(projectSet).sort();
  }, [allIssues]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bug className="h-4 w-4 text-primary" /> Jira Issues
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 overflow-hidden space-y-3">
        <JiraIssuesFilter
          status={jiStatus}
          project={jiProject}
          availableStatuses={availableStatuses}
          availableProjects={availableProjects}
          onStatusChange={setJiStatus}
          onProjectChange={setJiProject}
        />
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading issues...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-red-500">Failed to load issues: {error.message}</div>
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-hidden flex-1 overflow-y-auto">
              <JiraIssuesTable
                issues={paginatedIssues}
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
            </div>
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredIssues.length}
              onPageChange={setCurrentPage}
              itemsPerPage={perPage}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
