import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/utils/selfServiceUtils";
import { ParametersDisplay } from "./ParametersDisplay";
import { OutputDisplay } from "./OutputDisplay";
import type { JenkinsJobHistoryItem } from "@/services/SelfServiceApi";
import { useJenkinsJobOutput } from "@/hooks/api/useJenkinsJobOutput";

/**
 * Extract the base JAAS URL from the baseJobUrl
 * Example: https://atom.jaas-gcp.cloud.sap.corp/job/hello-deverloper-portal/
 *       -> https://atom.jaas-gcp.cloud.sap.corp/
 */
const getJaasUrl = (baseJobUrl: string | undefined): string | undefined => {
  if (!baseJobUrl) return undefined;
  
  try {
    // Find the first occurrence of "/job/"
    const jobIndex = baseJobUrl.indexOf('/job/');
    if (jobIndex === -1) return undefined;
    
    // Take everything before "/job/" and add trailing slash
    const jaasUrl = baseJobUrl.substring(0, jobIndex);
    return jaasUrl.endsWith('/') ? jaasUrl : jaasUrl + '/';
  } catch {
    return undefined;
  }
};

/**
 * Expanded row content component
 * Displays detailed job information including JAAS name, result, timestamps, and parameters
 */
interface ExpandedRowContentProps {
  job: JenkinsJobHistoryItem;
}

export const ExpandedRowContent = ({ job }: ExpandedRowContentProps) => {
  const jaasUrl = getJaasUrl(job.baseJobUrl);
  
  // Fetch job output
  const { data: outputData, isError } = useJenkinsJobOutput(
    job.jaasName,
    job.jobName,
    job.buildNumber
  );

  // Only show output section if there's data and no error
  const hasOutput = outputData && outputData.length > 0 && !isError;
  
  return (
    <div className="bg-muted/30 border-t border-b">
      <div className="px-6 py-4 space-y-4">
        {/* Top row - JAAS Name and Result */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase">JAAS Name</Label>
            {jaasUrl ? (
              <a
                href={jaasUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono mt-1 block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
              >
                {job.jaasName || '-'}
              </a>
            ) : (
              <p className="text-sm font-mono mt-1">{job.jaasName || '-'}</p>
            )}
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

        {/* Parameters and Output section - half width each */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Parameters</Label>
            <div className="bg-card rounded-md border p-4 max-h-[300px] overflow-y-auto">
              <ParametersDisplay parameters={job.parameters} />
            </div>
          </div>
          {hasOutput && (
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Output</Label>
              <div className="bg-card rounded-md border p-4 max-h-[300px] overflow-y-auto">
                <OutputDisplay output={outputData} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};