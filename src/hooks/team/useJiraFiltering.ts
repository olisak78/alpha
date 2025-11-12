import { JiraIssuesParams } from "@/types/api";
import { useEffect, useMemo, useState } from "react";
import { useJiraIssues } from "@/hooks/api/useJira";

export type QuickFilterType = "bugs" | "tasks" | "both";

interface UseJiraFilteringProps {
  teamName?: string;
}

export function useJiraFiltering({ teamName }: UseJiraFilteringProps = {}) {
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("updated_desc");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>("both");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Debounce search input to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [search]);

  // Process team name to remove dashes for API call
  const processedTeamName = teamName ? teamName.replace(/-/g, '') : undefined;

  // Prepare API parameters for server-side filtering
  const apiParams = useMemo((): JiraIssuesParams => {
    const params: JiraIssuesParams = {
      team: processedTeamName,
      limit: 100, // Increase limit to get more results for client-side filtering
    };

    // Apply server-side type filtering based on quickFilter
    if (quickFilter === "bugs") {
      params.type = "bug";
    } else if (quickFilter === "tasks") {
      params.type = "task";
    }

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
  }, [processedTeamName, statusFilter, assigneeFilter, quickFilter, debouncedSearch]);

  // Fetch Jira issues using the API with server-side filtering
  const { data: jiraResponse, isLoading, error } = useJiraIssues(apiParams);

  const tasks = jiraResponse?.issues || [];
  
  const allFilteredIssues = useMemo(() => {
    let list = tasks.slice();

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
      case "priority":
        const order: Record<string, number> = { Blocker: 1, Critical: 2, High: 3, Medium: 4, Low: 5 } as const;
        list.sort((a, b) => (order[a.fields?.priority?.name || ""] || 99) - (order[b.fields?.priority?.name || ""] || 99));
        break;
      case "updated_desc":
      default:
        list.sort((a, b) => (b.fields?.updated || "").localeCompare(a.fields?.updated || ""));
    }
    
    return list;
  }, [tasks, assigneeFilter, statusFilter, sortBy, search, quickFilter]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [assigneeFilter, statusFilter, sortBy, search, quickFilter]);

  // Calculate pagination values
  const totalItems = allFilteredIssues.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Get paginated issues
  const paginatedIssues = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allFilteredIssues.slice(startIndex, endIndex);
  }, [allFilteredIssues, currentPage, itemsPerPage]);

  return {
    // Filters
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
    
    // Pagination
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
