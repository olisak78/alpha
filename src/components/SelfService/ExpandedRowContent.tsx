import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/utils/selfServiceUtils";
import { ParametersDisplay } from "./ParametersDisplay";
import type { JenkinsJobHistoryItem } from "@/services/SelfServiceApi";

/**
 * Expanded row content component
 * Displays detailed job information including JAAS name, result, timestamps, and parameters
 */
interface ExpandedRowContentProps {
  job: JenkinsJobHistoryItem;
}

export const ExpandedRowContent = ({ job }: ExpandedRowContentProps) => {
  return (
    <div className="bg-muted/30 border-t border-b">
      <div className="px-6 py-4 space-y-4">
        {/* Top row - JAAS Name and Result */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase">JAAS Name</Label>
            <p className="text-sm font-mono mt-1">{job.jaasName || '-'}</p>
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Result</Label>
            <p className="text-sm font-mono mt-1">{job.result || '-'}</p>
          </div>
        </div>

        {/* Timestamps row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Started at</Label>
            <p className="text-sm mt-1">{formatDateTime(job.createdAt)}</p>
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Ended at</Label>
            <p className="text-sm mt-1">{formatDateTime(job.completedAt)}</p>
          </div>
        </div>

        {/* Parameters section - full width */}
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Parameters</Label>
          <div className="bg-card rounded-md border p-4 max-h-[300px] overflow-y-auto">
            <ParametersDisplay parameters={job.parameters} />
          </div>
        </div>
      </div>
    </div>
  );
};