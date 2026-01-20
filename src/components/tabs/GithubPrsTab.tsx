import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wrench, Database, List, Trash2 } from "lucide-react";
import { GitHubPullRequest as PRType, GitHubPRQueryParams } from "@/types/developer-portal";
import QuickFilterButtons, { FilterOption } from "@/components/QuickFilterButtons";
import { useClosePullRequest } from "@/hooks/api/useClosePullRequest";
import { ClosePRDialog } from "@/components/dialogs/ClosePRDialog";
import { useQuery } from "@tanstack/react-query";
import { fetchGitHubPullRequests, fetchGitHubWdfPullRequests, fetchBothGitHubPullRequests } from "@/services/githubApi";
import { queryKeys } from "@/lib/queryKeys";

type GithubFilterType = "tools" | "wdf" | "both";

interface GithubPrsTabProps {
  prStatus: 'open' | 'closed' | 'all';
  setPrStatus: Dispatch<SetStateAction<'open' | 'closed' | 'all'>>;
  prPage: number;
  setPrPage: Dispatch<SetStateAction<number>>;
  perPage: number;
}

export default function GithubPrsTab({
  prStatus,
  setPrStatus,
  prPage,
  setPrPage,
  perPage,
}: GithubPrsTabProps) {

  // Repository filter state
  const [filter, setFilter] = useState<GithubFilterType>("tools");

  // Close PR dialog state
  const [closePRDialog, setClosePRDialog] = useState<{
    isOpen: boolean;
    pullRequest: PRType | null;
  }>({
    isOpen: false,
    pullRequest: null,
  });

  // Close PR mutation
  const closePRMutation = useClosePullRequest();

  // Query params for PR fetching
  const queryParams: GitHubPRQueryParams = {
    state: prStatus,
    page: prPage,
    per_page: perPage,
    sort: 'updated',
    direction: 'desc',
  };

  // Fetch data based on selected filter
  const { data, isLoading, error } = useQuery({
    queryKey: [...queryKeys.github.pullRequests(queryParams), filter],
    queryFn: () => {
      switch (filter) {
        case 'tools':
          return fetchGitHubPullRequests(queryParams);
        case 'wdf':
          return fetchGitHubWdfPullRequests(queryParams);
        case 'both':
          return fetchBothGitHubPullRequests(queryParams);
        default:
          return fetchGitHubPullRequests(queryParams);
      }
    },
  });

  // Filter options for repository type
  const repoFilterOptions: FilterOption<GithubFilterType>[] = [
    { value: "tools", label: "Tools", icon: Wrench },
    { value: "wdf", label: "WDF", icon: Database },
    { value: "both", label: "Both", icon: List },
  ];

  // Extract PRs and total from response
  const pullRequests = data?.pull_requests || [];
  const total = data?.total || 0;

  // Calculate total pages from API total
  const prTotalPages = Math.max(1, Math.ceil(total / perPage));

  // Reset to page 1 when filter or status changes
  useEffect(() => {
    setPrPage(1);
  }, [prStatus, filter, setPrPage]);

  /**
   * Get badge variant based on PR state
   */
  const getStatusBadgeVariant = (state: string, isDraft: boolean) => {
    if (isDraft) return 'secondary';
    if (state === 'open') return 'default';
    if (state === 'closed') return 'outline';
    return 'outline';
  };

  /**
   * Get display text for PR status
   */
  const getStatusText = (state: string, isDraft: boolean) => {
    if (isDraft) return 'Draft';
    return state.charAt(0).toUpperCase() + state.slice(1);
  };

  // Handle close PR button click
  const handleClosePRClick = (pr: PRType) => {
    setClosePRDialog({
      isOpen: true,
      pullRequest: pr,
    });
  };

  // Handle close PR confirmation
  const handleClosePRConfirm = (deleteBranch: boolean) => {
    if (!closePRDialog.pullRequest) return;

    closePRMutation.mutate({
      prNumber: closePRDialog.pullRequest.number,
      owner: closePRDialog.pullRequest.repository.owner,
      repo: closePRDialog.pullRequest.repository.name,
      delete_branch: deleteBranch,
    });

    setClosePRDialog({ isOpen: false, pullRequest: null });
  };

  return (
    <div className="flex flex-col px-6 pt-4 pb-6 space-y-3 h-full">
      <div className="flex items-center gap-4">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <div className="text-sm">Status</div>
          <Select value={prStatus} onValueChange={(value: 'open' | 'closed' | 'all') => setPrStatus(value)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <QuickFilterButtons
          activeFilter={filter}
          onFilterChange={(filter: GithubFilterType) => setFilter(filter)}
          filters={repoFilterOptions}
        />
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-hidden flex-1 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Repository</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Loading State */}
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-destructive py-8">
                  Error loading pull requests: {error.message}
                </TableCell>
              </TableRow>
            )}

            {/* Data Rows */}
            {!isLoading && !error && pullRequests.map((pr) => (
              <TableRow key={`${pr.repository.full_name}-${pr.id}`}>
                <TableCell className="font-medium">
                  {pr.repository.full_name || pr.repository.name || 'Unknown'}
                </TableCell>
                <TableCell>
                  <a
                    href={pr.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:text-primary"
                  >
                    {pr.title}
                  </a>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(pr.state, pr.draft)}>
                    {getStatusText(pr.state, pr.draft)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(pr.updated_at).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {/* Only show close button for open PRs */}
                  {pr.state === 'open' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleClosePRClick(pr)}
                      className="h-8 w-8 p-0 hover:text-destructive"
                      title="Close pull request"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {/* Empty State */}
            {!isLoading && !error && pullRequests.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No pull requests found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {prPage} / {prTotalPages} {total > 0 && `(${total} total)`}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={prPage <= 1 || isLoading}
            onClick={() => setPrPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={prPage >= prTotalPages || isLoading}
            onClick={() => setPrPage((p) => Math.min(prTotalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
      {/* Close PR Dialog */}
      <ClosePRDialog
        open={closePRDialog.isOpen}
        onOpenChange={(open) => setClosePRDialog({ isOpen: open, pullRequest: null })}
        pullRequest={closePRDialog.pullRequest}
        onConfirm={handleClosePRConfirm}
        isLoading={closePRMutation.isPending}
      />
    </div>
  );
}