import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, getSeverityColor, getStatusColor } from "@/utils/alertUtils";
import { ExternalLink } from "lucide-react";

// Generic alert data interface that can handle both alert types
interface GenericAlertData {
  // Common fields
  name: string;
  severity?: string;
  labels?: Record<string, any>;
  annotations?: Record<string, any>;
  
  // Prometheus alert specific fields
  expr?: string;
  for?: string;
  
  // Triggered alert specific fields
  status?: string;
  landscape?: string;
  region?: string;
  component?: string;
  startsAt?: string;
  endsAt?: string;
  
  // Context info (file info for prometheus alerts)
  contextInfo?: {
    fileName?: string;
    category?: string;
  };
}

interface AlertExpandedViewProps {
  alertData: GenericAlertData;
  projectId?: string; // Optional project ID for navigation
  onShowAlertDefinition?: (alertName: string) => void; // Optional function for showing alert definition
}

export function AlertExpandedView({ alertData, projectId, onShowAlertDefinition }: AlertExpandedViewProps) {
  const severityColorClasses = alertData.severity ? getSeverityColor(alertData.severity) : '';
  const statusColorClasses = alertData.status ? getStatusColor(alertData.status) : '';

  const handleShowAlertDefinition = () => {
    if (onShowAlertDefinition && alertData.name) {
      onShowAlertDefinition(alertData.name);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-l-4 border-l-blue-500">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {alertData.status && (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground font-medium">Status:</span>
                <Badge className={`${statusColorClasses} text-xs`}>
                  {alertData.status.toUpperCase()}
                </Badge>
              </div>
            )}

            {alertData.startsAt && (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground font-medium">Started:</span>
                <span className="font-mono text-foreground">{formatDateTime(alertData.startsAt)}</span>
              </div>
            )}

            {alertData.endsAt && (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground font-medium">Ended:</span>
                <span className="font-mono text-foreground">{formatDateTime(alertData.endsAt)}</span>
              </div>
            )}
          </div>

          {projectId && alertData.name && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowAlertDefinition}
              className="flex items-center gap-1.5 text-xs h-8 bg-background/80 hover:bg-background"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Show Definition
            </Button>
          )}
        </div>

        {/* Two-column grid layout matching YAML structure */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column - Technical Details */}
          <div className="space-y-3">
            {/* Expression */}
            {alertData.expr && (
              <div className="bg-background/80 backdrop-blur-sm rounded-lg border shadow-sm p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Expression
                  </h4>
                </div>
                <div className="bg-muted/50 rounded-md p-2.5">
                  <pre className="font-mono text-xs whitespace-pre-wrap break-words leading-relaxed">
                    {alertData.expr}
                  </pre>
                </div>
              </div>
            )}

            {/* Duration */}
            {alertData.for && (
              <div className="bg-background/80 backdrop-blur-sm rounded-lg border shadow-sm p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Duration
                  </h4>
                </div>
                <div>
                  <Badge variant="secondary" className="font-mono text-sm px-2.5 py-1">
                    {alertData.for}
                  </Badge>
                </div>
              </div>
            )}

            {/* Labels */}
            {alertData.labels && Object.keys(alertData.labels).length > 0 && (
              <div className="bg-background/80 backdrop-blur-sm rounded-lg border shadow-sm p-3.5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Labels
                  </h4>
                </div>
                <div className="space-y-2">
                  {Object.entries(alertData.labels).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground font-medium min-w-[80px]">{key}:</span>
                      <Badge variant="secondary" className="font-mono text-xs px-2 py-0.5">
                        {String(value)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Context */}
            {alertData.contextInfo && (
              <div className="bg-background/80 backdrop-blur-sm rounded-lg border shadow-sm p-3.5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    File Context
                  </h4>
                </div>
                <div className="space-y-2 text-sm">
                  {alertData.contextInfo?.fileName && (
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground font-medium min-w-[70px] shrink-0">File:</span>
                      <span className="font-mono break-all">{alertData.contextInfo.fileName}</span>
                    </div>
                  )}
                  {alertData.contextInfo?.category && (
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground font-medium min-w-[70px] shrink-0">Category:</span>
                      <span className="font-mono">{alertData.contextInfo.category}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Annotations (Human-readable descriptions) */}
          <div className="space-y-3">
            {alertData.annotations && Object.keys(alertData.annotations).length > 0 && (
              <div className="bg-background/80 backdrop-blur-sm rounded-lg border shadow-sm p-3.5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-pink-500"></div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Annotations
                  </h4>
                </div>
                <div className="space-y-3">
                  {Object.entries(alertData.annotations).map(([key, value]) => (
                    <div key={key}>
                      <div className="text-xs font-semibold text-muted-foreground mb-1.5 capitalize">
                        {key.replace(/_/g, ' ')}:
                      </div>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap pl-0.5">
                        {String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
