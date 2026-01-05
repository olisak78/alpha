import { useState, useMemo } from 'react';
import { useGitHubPRs } from '@/hooks/api/useGitHubPRs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, GitPullRequest, ExternalLink, Clock, FileEdit, Plus } from 'lucide-react';
import { formatDistance } from 'date-fns';

interface PendingReviewPageProps {
  projectId: string;
  alertsRepoOwner?: string;
  alertsRepoName?: string;
}

export default function PendingReviewPage({
  projectId,
  alertsRepoOwner = 'cfs-platform-engineering',
  alertsRepoName = 'monitoring-configs'
}: PendingReviewPageProps) {
  const { data: prsData, isLoading, error } = useGitHubPRs({
    state: 'open',
    sort: 'updated',
    direction: 'desc',
    per_page: 100,
  });

  // Filter PRs by prefix
  const updateRulePRs = useMemo(() => {
    return prsData?.pull_requests.filter(pr =>
      pr.title.startsWith('[Update-Rule]')
    ) || [];
  }, [prsData]);

  const addRulePRs = useMemo(() => {
    return prsData?.pull_requests.filter(pr =>
      pr.title.startsWith('[Add-Rule]')
    ) || [];
  }, [prsData]);

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <span>Failed to load pending PRs: {error.message}</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Loading pending pull requests...
            </span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
            <div className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  const totalPRs = updateRulePRs.length + addRulePRs.length;

  return (
    <div className="space-y-4">
      {/* Summary Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold">Pending Alert Rule Changes</span>
          </div>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <FileEdit className="h-3.5 w-3.5 text-amber-600" />
              <span><span className="font-semibold">{updateRulePRs.length}</span> Updates</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5 text-green-600" />
              <span><span className="font-semibold">{addRulePRs.length}</span> New</span>
            </div>
            <div className="flex items-center gap-1.5">
              <GitPullRequest className="h-3.5 w-3.5 text-blue-600" />
              <span><span className="font-semibold">{totalPRs}</span> Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Update Rule PRs */}
      {updateRulePRs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground">
            <FileEdit className="h-4 w-4 text-amber-600" />
            Rule Updates ({updateRulePRs.length})
          </h3>
          <div className="space-y-2">
            {updateRulePRs.map(pr => (
              <Card key={pr.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {pr.title}
                        </h4>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs flex-shrink-0">
                          #{pr.number}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistance(new Date(pr.created_at), new Date(), { addSuffix: true })}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileEdit className="h-3 w-3" />
                          {formatDistance(new Date(pr.updated_at), new Date(), { addSuffix: true })}
                        </div>
                        <span>by {pr.user.login}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(pr.html_url, '_blank', 'noopener,noreferrer')}
                      className="flex items-center gap-1.5 h-8 text-xs flex-shrink-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View PR
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add Rule PRs */}
      {addRulePRs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground">
            <Plus className="h-4 w-4 text-green-600" />
            New Rules ({addRulePRs.length})
          </h3>
          <div className="space-y-2">
            {addRulePRs.map(pr => (
              <Card key={pr.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {pr.title}
                        </h4>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs flex-shrink-0">
                          #{pr.number}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistance(new Date(pr.created_at), new Date(), { addSuffix: true })}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileEdit className="h-3 w-3" />
                          {formatDistance(new Date(pr.updated_at), new Date(), { addSuffix: true })}
                        </div>
                        <span>by {pr.user.login}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(pr.html_url, '_blank', 'noopener,noreferrer')}
                      className="flex items-center gap-1.5 h-8 text-xs flex-shrink-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View PR
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No PRs Message */}
      {totalPRs === 0 && (
        <Card className="bg-muted/30">
          <CardContent className="p-8 text-center">
            <GitPullRequest className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm font-medium text-muted-foreground mb-1">No pending alert rule changes</p>
            <p className="text-xs text-muted-foreground">
              All alert rule PRs have been merged or there are no open PRs
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
