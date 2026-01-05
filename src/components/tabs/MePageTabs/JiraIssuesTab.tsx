import { useState, useEffect, useMemo } from "react";
import { Bug, AlertCircle, List } from "lucide-react";
import { useMyJiraIssues } from "@/hooks/api/useJira";
import { JiraIssue } from "@/types/api";
import JiraIssuesTable from "@/components/Homepage/JiraIssuesTable";
import JiraIssuesFilter from "@/components/Homepage/JiraIssuesFilter";
import TablePagination from "@/components/TablePagination";
import QuickFilterButtons, { FilterOption } from "@/components/QuickFilterButtons";

type QuickFilterType = "bugs" | "tasks" | "both";
type SubtaskFilterType = "parents" | "all" | "subtasks";

export default function JiraIssuesTab() {
  const [search, setSearch] = useState<string>("");
  const [jiStatus, setJiStatus] = useState<string>("all");
  const [jiProject, setJiProject] = useState<string>("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>("both");
  const [subtaskFilter, setSubtaskFilter] = useState<SubtaskFilterType>("parents");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("updated_desc");
  const perPage = 10;

  // Filter options for Jira issues
  const jiraFilterOptions: FilterOption<QuickFilterType>[] = [
    { value: "bugs" as const, label: "Bugs", icon: Bug },
    { value: "tasks" as const, label: "Tasks", icon: AlertCircle },
    { value: "both" as const, label: "Both", icon: List },
  ];

  // Define open statuses (exclude resolved/closed/done statuses)
  const getOpenStatusFilter = () => {
    return "Open,In Progress,To Do,Backlog,Selected for Development,In Review,Testing,Blocked,Reopened";
  };

  // Fetch issue from API
  const { data: apiData, isLoading, error } = useMyJiraIssues({
    limit: 100, // Get a large number to get all user's issues
  });

  const allIssues = apiData?.issues || [];

  // Client-side filtering, searching, and sorting
  const filteredIssues = useMemo(() => {
    let filtered = allIssues;

    // First, filter out closed statuses
    const closedStatuses = ['resolved', 'closed', 'done', 'completed', 'cancelled', 'rejected'];
    filtered = filtered.filter((issue: JiraIssue) => {
      const statusName = issue.fields?.status?.name?.toLowerCase() || '';
      return !closedStatuses.some(closed => statusName.includes(closed));
    });

    // Apply subtask filtering based on subtaskFilter state
    if (subtaskFilter === "parents") {
      // Show only parent/regular tasks (filter out any issues that have a parent field)
      // This is the original behavior
      filtered = filtered.filter((issue: JiraIssue) => !issue.fields?.parent);

    } else if (subtaskFilter === "all") {
      // Show both parents and extract their subtasks as separate items
      const parentsAndSubtasks: JiraIssue[] = [];

      allIssues.forEach((issue: JiraIssue) => {
        // Add the parent/regular issue
        if (!issue.fields?.parent) {
          parentsAndSubtasks.push(issue);
        }

        // If it has subtasks, extract and add them as separate issues
        if (issue.fields?.subtasks && issue.fields.subtasks.length > 0) {
          issue.fields.subtasks.forEach((subtask) => {
            const closedStatuses = ['resolved', 'closed', 'done', 'completed', 'cancelled', 'rejected'];
            const subtaskStatusLower = subtask.fields?.status?.name?.toLowerCase() || '';
            const isClosedSubtask = closedStatuses.some(closed => subtaskStatusLower.includes(closed));

            if (isClosedSubtask) {
              return; // Skip this subtask
            }
            // Convert subtask to JiraIssue format
            const subtaskIssue: JiraIssue = {
              id: subtask.id,
              key: subtask.key,
              fields: {
                summary: subtask.fields.summary,
                status: subtask.fields.status,
                issuetype: subtask.fields.issuetype,
                priority: subtask.fields.priority,
                created: issue.fields.created,
                updated: issue.fields.updated,
                parent: {
                  id: issue.id,
                  key: issue.key,
                  fields: {
                    summary: issue.fields.summary,
                    status: issue.fields.status,
                    issuetype: issue.fields.issuetype,
                    priority: issue.fields.priority,
                  },
                },
              },
              project: issue.project,
              link: `${issue.link.split('/browse/')[0]}/browse/${subtask.key}`,
            };
            parentsAndSubtasks.push(subtaskIssue);
          });
        }
      });

      filtered = parentsAndSubtasks;

    } else if (subtaskFilter === "subtasks") {
      // Extract only subtasks from parent issues
      const subtasksOnly: JiraIssue[] = [];

      allIssues.forEach((issue: JiraIssue) => {
        if (issue.fields?.subtasks && issue.fields.subtasks.length > 0) {
          issue.fields.subtasks.forEach((subtask) => {
            const closedStatuses = ['resolved', 'closed', 'done', 'completed', 'cancelled', 'rejected'];
            const subtaskStatusLower = subtask.fields?.status?.name?.toLowerCase() || '';
            const isClosedSubtask = closedStatuses.some(closed => subtaskStatusLower.includes(closed));

            if (isClosedSubtask) {
              return; // Skip this subtask
            }
            // Convert subtask to JiraIssue format
            const subtaskIssue: JiraIssue = {
              id: subtask.id,
              key: subtask.key,
              fields: {
                summary: subtask.fields.summary,
                status: subtask.fields.status,
                issuetype: subtask.fields.issuetype,
                priority: subtask.fields.priority,
                created: issue.fields.created,
                updated: issue.fields.updated,
                parent: {
                  id: issue.id,
                  key: issue.key,
                  fields: {
                    summary: issue.fields.summary,
                    status: issue.fields.status,
                    issuetype: issue.fields.issuetype,
                    priority: issue.fields.priority,
                  },
                },
              },
              project: issue.project,
              link: `${issue.link.split('/browse/')[0]}/browse/${subtask.key}`,
            };
            subtasksOnly.push(subtaskIssue);
          });
        }
      });

      filtered = subtasksOnly;

    }

    // Filter by quick filter (bugs/tasks/both)
    if (quickFilter !== "both") {
      filtered = filtered.filter((issue: JiraIssue) => {
        const issueType = issue.fields?.issuetype?.name?.toLowerCase() || '';
        if (quickFilter === "bugs") {
          return issueType.includes('bug');
        } else if (quickFilter === "tasks") {
          return issueType.includes('task') ||
            issueType.includes('story') ||
            issueType.includes('backlog') ||
            issueType.includes('epic') ||
            issueType.includes('subtask') ||
            issueType.includes('sub-task');
        }
        return true;
      });
    }

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((issue: JiraIssue) =>
        issue.key.toLowerCase().includes(searchLower) ||
        issue.fields?.summary?.toLowerCase().includes(searchLower)
      );
    }

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

    // Sort based on sortBy
    const sorted = [...filtered].sort((a, b) => {
      const [field, order] = sortBy.split('_');
      let aValue: any = '';
      let bValue: any = '';

      switch (field) {
        case 'updated':
          aValue = new Date(a.fields?.updated || 0).getTime();
          bValue = new Date(b.fields?.updated || 0).getTime();
          break;
        case 'priority':
          const priorityOrder: Record<string, number> = {
            'highest': 1,
            'critical': 1,
            'high': 2,
            'medium': 3,
            'low': 4,
            'lowest': 5,
          };
          aValue = priorityOrder[a.fields?.priority?.name?.toLowerCase() || ''] || 99;
          bValue = priorityOrder[b.fields?.priority?.name?.toLowerCase() || ''] || 99;
          break;
      }

      if (order === 'desc') {
        return bValue - aValue;
      }
      return aValue - bValue;
    });

    return sorted;
  }, [allIssues, quickFilter, search, jiStatus, jiProject, sortBy, subtaskFilter]);

  // Client-side pagination
  const totalPages = Math.ceil(filteredIssues.length / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const paginatedIssues = filteredIssues.slice(startIndex, startIndex + perPage);

  // Reset to first page when filters change
  useEffect(() => setCurrentPage(1), [quickFilter, search, jiStatus, jiProject, sortBy, subtaskFilter]);

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
    <div className="flex flex-col px-6 pt-4 pb-6 space-y-3 h-full">
      {/* Quick Filter Buttons */}
      <div>
        <QuickFilterButtons
          activeFilter={quickFilter}
          onFilterChange={(filter) => setQuickFilter(filter as QuickFilterType)}
          filters={jiraFilterOptions}
        />
      </div>

      {/* Filter Controls */}
      <JiraIssuesFilter
        search={search}
        onSearchChange={setSearch}
        status={jiStatus}
        project={jiProject}
        availableStatuses={availableStatuses}
        availableProjects={availableProjects}
        onStatusChange={setJiStatus}
        onProjectChange={setJiProject}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        subtaskFilter={subtaskFilter}
        onSubtaskFilterChange={(filter) => setSubtaskFilter(filter as SubtaskFilterType)}
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
              showAssignee={false}
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
    </div>
  );
}