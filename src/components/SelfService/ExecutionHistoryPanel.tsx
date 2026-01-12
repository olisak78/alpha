import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, CheckCircle2, XCircle, Loader2, Clock, StopCircle, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { useJenkinsJobHistory } from "@/hooks/api/useJenkinsJobHistory";
import { useJenkinsJobOutput } from "@/hooks/api/useJenkinsJobOutput";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

interface ExecutionHistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
    jobName: string;
    serviceTitle: string;
}

export default function ExecutionHistoryPanel({
    isOpen,
    onClose,
    jobName,
    serviceTitle,
}: ExecutionHistoryPanelProps) {
    // State for expanded job output
    const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
    const [selectedJob, setSelectedJob] = useState<{
        jaasName: string;
        jobName: string;
        buildNumber: number;
    } | null>(null);

    // Fetch job history
    const { data: jobHistory, isLoading } = useJenkinsJobHistory(10, 0);

    // Fetch job output for selected job
    const { data: jobOutput, isLoading: isLoadingOutput, error: outputError } = useJenkinsJobOutput(
        selectedJob?.jaasName || '',
        selectedJob?.jobName || '',
        selectedJob?.buildNumber || 0,
        !!selectedJob // Only fetch when a job is selected
    );

    // Show error toast when output error occurs
    useEffect(() => {
        if (outputError) {
            toast({
                title: "Failed to Load Output",
                description: outputError instanceof Error ? outputError.message : "Could not fetch job output",
                variant: "destructive"
            });
        }
    }, [outputError]);

    // Filter jobs for this specific service
    const serviceJobs = jobHistory?.jobs.filter(job => job.jobName === jobName) || [];

    // Calculate statistics
    const total = serviceJobs.length;
    const successCount = serviceJobs.filter(job => job.status?.toLowerCase() === 'success').length;

    /**
     * Format duration from seconds to human readable format
     */
    const formatDuration = (seconds?: number): string => {
        if (!seconds) return '-';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    };

    /**
     * Format time ago
     */
    const formatTimeAgo = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            return formatDistanceToNow(date, { addSuffix: true });
        } catch (error) {
            return 'Unknown';
        }
    };

    /**
     * Get status icon
     */
    const getStatusIcon = (status: string) => {
        const statusLower = status.toLowerCase();

        switch (statusLower) {
            case 'success':
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'failure':
            case 'failed':
                return <XCircle className="h-5 w-5 text-red-500" />;
            case 'running':
                return <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />;
            case 'queued':
            case 'pending':
                return <Clock className="h-5 w-5 text-yellow-500" />;
            case 'aborted':
                return <StopCircle className="h-5 w-5 text-orange-500" />;
            default:
                return <Clock className="h-5 w-5 text-gray-400" />;
        }
    };

    /**
     * Get status badge
     */
    const getStatusBadge = (status: string) => {
        const statusLower = status.toLowerCase();

        switch (statusLower) {
            case 'success':
                return (
                    <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-0">
                        Success
                    </Badge>
                );
            case 'failure':
            case 'failed':
                return (
                    <Badge className="bg-red-500 hover:bg-red-600 text-white border-0">
                        Failed
                    </Badge>
                );
            case 'running':
                return (
                    <Badge className="bg-gray-500 hover:bg-gray-600 text-white border-0">
                        Running
                    </Badge>
                );
            case 'queued':
            case 'pending':
                return (
                    <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-0">
                        Queued
                    </Badge>
                );
            case 'aborted':
                return (
                    <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0">
                        Aborted
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="border-gray-400 text-gray-700">
                        {status}
                    </Badge>
                );
        }
    };

    /**
     * Handle Details button click
     */
    const handleDetailsClick = (job: any) => {
        // Only allow details for successful jobs
        if (job.status?.toLowerCase() !== 'success') {
            return;
        }

        // Verify required data is available
        if (!job.jaasName || !job.jobName || !job.buildNumber) {
            toast({
                title: "Error",
                description: "Missing job information (jaasName, jobName, or buildNumber)",
                variant: "destructive"
            });
            return;
        }

        const jobId = job.id;

        // If clicking the same job, collapse it
        if (expandedJobId === jobId) {
            setExpandedJobId(null);
            setSelectedJob(null);
        } else {
            // Expand this job and fetch output
            setExpandedJobId(jobId);
            setSelectedJob({
                jaasName: job.jaasName,
                jobName: job.jobName,
                buildNumber: job.buildNumber,
            });
        }
    };

    /**
     * Copy JSON to clipboard
     */
    const handleCopyOutput = () => {
        if (!jobOutput) return;

        const textToCopy = JSON.stringify(jobOutput, null, 2);
        navigator.clipboard.writeText(textToCopy);

        toast({
            title: "Copied!",
            description: "Job output copied to clipboard",
        });
    };

    /**
     * Render job output content
     */
    const renderJobOutput = (job: any) => {
        if (expandedJobId !== job.id) return null;

        // Show error from API call
        if (outputError) {
            // Only show toast once when error first occurs
            const errorMessage = outputError instanceof Error ? outputError.message : "Could not fetch job output";

            return (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <p className="font-medium">Error loading output</p>
                    <p className="text-xs mt-1">{errorMessage}</p>
                </div>
            );
        }

        // Show loading state
        if (isLoadingOutput) {
            return (
                <div className="mt-2 p-4 bg-muted rounded flex items-center justify-center text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading output...
                </div>
            );
        }

        // Show output - check if we have data
        if (jobOutput !== undefined && jobOutput !== null) {
            // Check if output is empty (works for both objects and arrays)
            const isArray = Array.isArray(jobOutput);
            const isObject = typeof jobOutput === 'object';
            const isEmpty = isArray
                ? jobOutput.length === 0
                : (isObject ? Object.keys(jobOutput).length === 0 : false);

            if (isEmpty) {
                return (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
                        <p className="font-medium">No output available</p>
                        <p className="text-xs mt-1">This job has not generated any output yet.</p>
                    </div>
                );
            }

            return (
                <div className="mt-2 border-t pt-3">
                    {/* Header with copy button */}
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">
                            Job Output: {isArray ? `Array (${jobOutput.length} items)` : 'Object'}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopyOutput}
                            className="h-7 text-xs"
                        >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                        </Button>
                    </div>

                    {/* Formatted output display */}
                    <div className="bg-muted rounded-lg p-3 max-h-96 overflow-auto">
                        <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                            {JSON.stringify(jobOutput, null, 2)}
                        </pre>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                {/* Header */}
                <SheetHeader className="border-b pb-4 mb-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <SheetTitle className="text-xl font-semibold text-foreground">
                                Execution History
                            </SheetTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                {jobName}
                            </p>
                        </div>

                    </div>

                    {/* Statistics */}
                    <div className="flex items-center gap-4 pt-3 text-sm">
                        <span className="text-foreground">
                            <span className="font-medium">Total:</span> {total}
                        </span>
                        <span className="text-foreground">
                            <span className="font-medium">Success:</span> {successCount}
                        </span>
                    </div>
                </SheetHeader>

                {/* Content */}
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                            Loading executions...
                        </div>
                    ) : serviceJobs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No executions found for this job
                        </div>
                    ) : (
                        serviceJobs.map((job) => (
                            <div
                                key={job.id}
                                className="border rounded-lg bg-card transition-all"
                            >
                                {/* Job Summary */}
                                <div className="flex items-center gap-3 p-4">
                                    {/* Status Icon */}
                                    <div className="flex-shrink-0">
                                        {getStatusIcon(job.status)}
                                    </div>

                                    {/* Execution Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-foreground">
                                                Execution #{job.buildNumber}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {formatTimeAgo(job.lastPolledAt)}
                                            </span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Duration: {formatDuration(job.duration)}
                                        </div>
                                    </div>

                                    {/* Status Badge and Details Button */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {getStatusBadge(job.status)}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={() => handleDetailsClick(job)}
                                            disabled={job.status?.toLowerCase() !== 'success'}
                                            title={job.status?.toLowerCase() !== 'success' ? 'Details only available for successful jobs' : ''}
                                        >
                                            {expandedJobId === job.id ? (
                                                <>
                                                    <ChevronUp className="h-4 w-4 mr-1" />
                                                    Hide
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="h-4 w-4 mr-1" />
                                                    Details
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* Job Output (expandable) */}
                                {renderJobOutput(job)}
                            </div>
                        ))
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}