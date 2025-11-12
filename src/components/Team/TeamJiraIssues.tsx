import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QuickFilterButtons, { FilterOption } from "@/components/QuickFilterButtons";
import { QuickFilterType } from "@/hooks/team/useJiraFiltering";
import { TeamJiraTable } from "./TeamJiraTable";
import { TeamJiraFilters } from "./TeamJiraFilters";
import TablePagination from "@/components/TablePagination";
import { Bug, AlertCircle, List } from "lucide-react";
import { useTeamContext } from "@/contexts/TeamContext";

export function TeamJiraIssues() {
  const { members, jiraFilters } = useTeamContext();
  
  const {
    filteredIssues,
    quickFilter,
    setQuickFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    isLoading,
    error,
  } = jiraFilters;

  // Filter options for Jira issues
  const jiraFilterOptions: FilterOption<QuickFilterType>[] = [
    { value: "bugs" as const, label: "Bugs", icon: Bug },
    { value: "tasks" as const, label: "Tasks", icon: AlertCircle },
    { value: "both" as const, label: "Both", icon: List },
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bugs and Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Quick Filter Buttons */}
        <div className="mb-4">
          <QuickFilterButtons
            activeFilter={quickFilter}
            onFilterChange={setQuickFilter}
            filters={jiraFilterOptions}
          />
        </div>
        
        {/* Filter Controls */}
        <TeamJiraFilters />

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading issues...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-red-500">Failed to load issues: {error.message}</div>
          </div>
        ) : totalItems === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">No issues found</div>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <TeamJiraTable
                filteredIssues={filteredIssues}
              />
            </div>

            {/* Pagination */}
            <div className="mt-4">
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
