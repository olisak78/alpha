import { JiraIssuesParams } from "@/types/api";
import { useEffect, useMemo, useState } from "react";
import { useJiraIssues } from "@/hooks/api/useJira";

//   Import from teamStore instead of defining locally
import {
  useJiraAssigneeFilter,
  useJiraStatusFilter,
  useJiraSortBy,
  useJiraSearch,
  useJiraQuickFilter,
  useJiraCurrentPage,
  useJiraItemsPerPage,
  useJiraFilterActions,
  type QuickFilterType,
} from '@/stores/teamStore';

interface UseJiraFilteringProps {
  teamName?: string;
}

export function useJiraFiltering({ teamName }: UseJiraFilteringProps = {}) {
  //   Get filter state from Zustand
  const assigneeFilter = useJiraAssigneeFilter();
  const statusFilter = useJiraStatusFilter();
  const sortBy = useJiraSortBy();
  const search = useJiraSearch();
  const quickFilter = useJiraQuickFilter();
  const currentPage = useJiraCurrentPage();
  const itemsPerPage = useJiraItemsPerPage();
  
  //   Get actions from Zustand (stable functions)
  const {
    setAssigneeFilter,
    setStatusFilter,
    setSortBy,
    setSearch,
    setQuickFilter,
    setCurrentPage,
  } = useJiraFilterActions();
  
  //  Local state for debounced search (component-specific, temporary)
  const [debouncedSearch, setDebouncedSearch] = useState("");

  //  Debounce logic  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [search]);

  //   Process team name  
  const processedTeamName = teamName ? teamName.replace(/-/g, '') : undefined;

  //   API parameters ( uses Zustand state)
  const apiParams = useMemo((): JiraIssuesParams => {
    const params: JiraIssuesParams = {
      team: processedTeamName,
      limit: 100, // Increase limit to get more results for client-side filtering
    };

    // Don't apply server-side type filtering - we'll do it client-side for better flexibility

    // Apply server-side status filtering if not "all"
    if (statusFilter !== "all") {
      params.status = statusFilter;
    }

    // Apply server-side assignee filtering if not "all"
    if (assigneeFilter !== "all") {
      params.assignee = assigneeFilter;
    }

    // Apply server-side search filtering for summary and key (using debounced search, minimum 8 characters)
    if (debouncedSearch.trim() && debouncedSearch.trim().length >= 8) {
      params.key = debouncedSearch.trim();
    }

    return params;
  }, [processedTeamName, statusFilter, assigneeFilter, debouncedSearch]);

  //   Fetch Jira issues 
  const { data: jiraResponse, isLoading, error } = useJiraIssues(apiParams);

  const tasks = jiraResponse?.issues || [];
  
  //  Filtering logic (  uses Zustand state)
  const allFilteredIssues = useMemo(() => {
    let list = tasks.slice();

    // Filter out issues that have a parent (they are subtasks)
    // They will be displayed under their parent issue instead
    list = list.filter(issue => !issue.fields?.parent);

    // Apply client-side quick filter (bugs/tasks/both)
    if (quickFilter !== "both") {
      list = list.filter(issue => {
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

    // Apply sorting
    switch (sortBy) {
      case "created_asc":
        list.sort((a, b) => (a.fields?.created || "").localeCompare(b.fields?.created || ""));
        break;
      case "created_desc":
        list.sort((a, b) => (b.fields?.created || "").localeCompare(a.fields?.created || ""));
        break;
      case "updated_asc":
        list.sort((a, b) => (a.fields?.updated || "").localeCompare(b.fields?.updated || ""));
        break;
      case "priority": {
        const order: Record<string, number> = { Blocker: 1, Critical: 2, High: 3, Medium: 4, Low: 5 } as const;
        list.sort((a, b) => (order[a.fields?.priority?.name || ""] || 99) - (order[b.fields?.priority?.name || ""] || 99));
        break;
      }
      case "updated_desc":
      default:
        list.sort((a, b) => (b.fields?.updated || "").localeCompare(a.fields?.updated || ""));
    }
    
    return list;
  }, [tasks, assigneeFilter, statusFilter, sortBy, search, quickFilter]);

 

  //   Pagination calculations  
  const totalItems = allFilteredIssues.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  //   Paginated issues  
  const paginatedIssues = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allFilteredIssues.slice(startIndex, endIndex);
  }, [allFilteredIssues, currentPage, itemsPerPage]);

  //   Return interface  
  return {
    // Filters (now from Zustand)
    assigneeFilter,
    setAssigneeFilter,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    search,
    setSearch,
    quickFilter,
    setQuickFilter,
    
    // Pagination (now from Zustand)
    currentPage,
    setCurrentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    
    // Computed values
    filteredIssues: paginatedIssues,
    allFilteredIssues,
    
    // API states
    isLoading,
    error,
  };
}

//   Re-export type from teamStore
export type { QuickFilterType };
