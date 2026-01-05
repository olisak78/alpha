import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert as AlertComponent, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, GitPullRequest, X, Clock, Activity, Tag } from "lucide-react";
import { Alert, AlertFile, useCreateAlertPR } from "@/hooks/api/useAlerts";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import * as yaml from 'js-yaml';

interface AlertEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alert: Alert;
  file: AlertFile;
  projectId: string;
}

export function AlertEditorDialog({
  open,
  onOpenChange,
  alert,
  file,
  projectId,
}: AlertEditorDialogProps) {
  // Form fields for specific alert properties
  const [alertName, setAlertName] = useState("");
  const [expression, setExpression] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState<string>("warning");
  const [labels, setLabels] = useState<Record<string, any>>({});
  const [annotations, setAnnotations] = useState<Record<string, any>>({});
  const [commitMessage, setCommitMessage] = useState("");
  const [prDescription, setPrDescription] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const { toast } = useToast();
  const createPRMutation = useCreateAlertPR(projectId);

  // Store original alert to preserve all fields
  const [originalAlert, setOriginalAlert] = useState<Alert | null>(null);

  useEffect(() => {
    if (open && alert) {
      // Store original alert for merging later
      setOriginalAlert(alert);

      // Populate form with alert data
      setAlertName(alert.alert || "");
      setExpression(alert.expr || "");
      setDuration(alert.for || "");
      setSeverity(alert.labels?.severity || "warning");
      setLabels(alert.labels || {});
      setAnnotations(alert.annotations || {});
      setCommitMessage(`[Update-Rule] ${alert.alert || "unnamed"}`);
      setPrDescription(`Update Prometheus alert configuration for **${alert.alert || "unnamed"}**`);
      setValidationError(null);
    }
  }, [open, alert]);

  // Keep labels.severity in sync with severity dropdown
  useEffect(() => {
    setLabels(prev => ({ ...prev, severity }));
  }, [severity]);

  const validateForm = (): boolean => {
    if (!alertName.trim()) {
      setValidationError("Alert name is required");
      return false;
    }
    if (!expression.trim()) {
      setValidationError("Alert expression is required");
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleLabelChange = (key: string, value: string) => {
    setLabels(prev => {
      const newLabels = { ...prev };
      if (value.trim() === "") {
        delete newLabels[key];
      } else {
        newLabels[key] = value;
      }
      return newLabels;
    });
  };

  const addLabel = () => {
    const newKey = "<new label name>";
    setLabels(prev => ({ [newKey]: "", ...prev })); // Add at top
  };

  const removeLabel = (key: string) => {
    if (key === "severity") return; // Can't remove severity
    setLabels(prev => {
      const newLabels = { ...prev };
      delete newLabels[key];
      return newLabels;
    });
  };

  const updateLabelKey = (oldKey: string, newKey: string) => {
    if (oldKey === "severity") return; // Can't rename severity
    if (oldKey === newKey) return;
    setLabels(prev => {
      const entries = Object.entries(prev);
      const newLabels: Record<string, any> = {};
      entries.forEach(([k, v]) => {
        if (k === oldKey) {
          if (newKey.trim()) {
            newLabels[newKey] = v;
          }
        } else {
          newLabels[k] = v;
        }
      });
      return newLabels;
    });
  };

  const handleAnnotationChange = (key: string, value: string) => {
    setAnnotations(prev => {
      const newAnnotations = { ...prev };
      if (value.trim() === "") {
        delete newAnnotations[key];
      } else {
        newAnnotations[key] = value;
      }
      return newAnnotations;
    });
  };

  const addAnnotation = () => {
    const newKey = "<new annotation name>";
    setAnnotations(prev => ({ [newKey]: "", ...prev })); // Add at top
  };

  const removeAnnotation = (key: string) => {
    setAnnotations(prev => {
      const newAnnotations = { ...prev };
      delete newAnnotations[key];
      return newAnnotations;
    });
  };

  const updateAnnotationKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    setAnnotations(prev => {
      const entries = Object.entries(prev);
      const newAnnotations: Record<string, any> = {};
      entries.forEach(([k, v]) => {
        if (k === oldKey) {
          if (newKey.trim()) {
            newAnnotations[newKey] = v;
          }
        } else {
          newAnnotations[k] = v;
        }
      });
      return newAnnotations;
    });
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: validationError || "Please fill in all required fields.",
      });
      return;
    }

    if (!commitMessage.trim()) {
      toast({
        variant: "destructive",
        title: "Commit message required",
        description: "Please provide a commit message.",
      });
      return;
    }

    try {
      // Merge updated values with original alert to preserve all fields
      const updatedAlert: any = {
        ...originalAlert, // Start with all original data
        alert: alertName,
        expr: expression,
        ...(duration && { for: duration }),
      };

      // Add labels if any
      if (Object.keys(labels).length > 0) {
        updatedAlert.labels = labels;
      }

      // Add annotations if any
      if (Object.keys(annotations).length > 0) {
        updatedAlert.annotations = annotations;
      }

      // Find and replace the alert in the original file content
      const updatedContent = replaceAlertInContent(file.content, alert.alert, updatedAlert);

      const result = await createPRMutation.mutateAsync({
        fileName: file.name,
        content: updatedContent,
        message: commitMessage,
        description: prDescription,
      });

      toast({
        title: "Pull Request Created",
        description: `Successfully created PR for ${alertName}`,
        className: "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50",
      });

      // Open PR URL in new tab
      if (result.prUrl) {
        window.open(result.prUrl, "_blank", "noopener,noreferrer");
      }

      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create PR",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  // Helper function to replace alert in the original content
  // Uses surgical text-based replacement to preserve original formatting
  const replaceAlertInContent = (content: string, oldAlertName: string | undefined, newAlert: any): string => {
    if (!oldAlertName || !originalAlert) {
      return content;
    }

    // Find and extract the specific alert block by matching multiple properties
    const lines = content.split('\n');
    let alertStartIdx = -1;
    let alertEndIdx = -1;
    let baseIndent = '';

    // Find all potential alert matches by name first
    const potentialMatches: Array<{startIdx: number, endIdx: number, indent: string}> = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Find alert start
      if (line.match(new RegExp(`^(\\s*)-\\s*alert:\\s*${oldAlertName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`))) {
        const startIdx = i;
        const indent = line.match(/^(\s*)-/)?.[1] || '';
        
        // Find the end of this alert block
        let endIdx = -1;
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];
          if (nextLine.match(/^\s*-\s*alert:/) || (nextLine.trim() && !nextLine.startsWith(indent + '  ') && !nextLine.startsWith(indent + '-'))) {
            endIdx = j;
            break;
          }
        }
        
        if (endIdx < 0) {
          endIdx = lines.length;
        }
        
        potentialMatches.push({ startIdx, endIdx, indent });
      }
    }

    // If only one match, use it (backward compatibility)
    if (potentialMatches.length === 1) {
      alertStartIdx = potentialMatches[0].startIdx;
      alertEndIdx = potentialMatches[0].endIdx;
      baseIndent = potentialMatches[0].indent;
    } else if (potentialMatches.length > 1) {
      // Multiple matches found - need to find the exact one by comparing properties
      for (const match of potentialMatches) {
        
        // Parse this alert block to compare with originalAlert
        try {
          // Extract key properties from the block for comparison
          const blockLines = lines.slice(match.startIdx, match.endIdx);
          let blockExpr = '';
          let blockSeverity = '';
          let blockFor = '';
          
          for (const blockLine of blockLines) {
            const exprMatch = blockLine.match(/^\s+expr:\s*(.+)$/);
            if (exprMatch) {
              blockExpr = exprMatch[1].trim();
            }
            
            const severityMatch = blockLine.match(/^\s+severity:\s*(.+)$/);
            if (severityMatch) {
              blockSeverity = severityMatch[1].trim();
            }
            
            const durationMatch = blockLine.match(/^\s+for:\s*(.+)$/);
            if (durationMatch) {
              blockFor = durationMatch[1].trim();
            }
          }
          
          // Compare with original alert properties (before any edits)
          const exprMatches = blockExpr === (originalAlert.expr || '');
          const severityMatches = blockSeverity === (originalAlert.labels?.severity || '');
          const forMatches = blockFor === (originalAlert.for || '');
          
          // If this block matches the original alert's key properties, use it
          if (exprMatches && severityMatches && forMatches) {
            alertStartIdx = match.startIdx;
            alertEndIdx = match.endIdx;
            baseIndent = match.indent;
            break;
          }
        } catch (error) {
          console.warn('Error parsing alert block for comparison:', error);
          continue;
        }
      }
      
      // If no exact match found, fall back to first match with a warning
      if (alertStartIdx < 0) {
        console.warn(`Multiple alerts named "${oldAlertName}" found, but could not determine exact match.`);
      }
    }

    if (alertStartIdx < 0) {
      console.warn(`Could not find alert "${oldAlertName}" in content`);
      return content;
    }

    // Manually build YAML for the alert to maintain proper structure
    const indent1 = baseIndent + '  '; // First level indent
    const indent2 = baseIndent + '    '; // Second level indent (for nested objects)

    const newAlertLines: string[] = [];
    newAlertLines.push(`${baseIndent}- alert: ${newAlert.alert}`);
    newAlertLines.push(`${indent1}expr: ${newAlert.expr}`);

    if (newAlert.for) {
      newAlertLines.push(`${indent1}for: ${newAlert.for}`);
    }

    // Add labels
    if (newAlert.labels && Object.keys(newAlert.labels).length > 0) {
      newAlertLines.push(`${indent1}labels:`);
      Object.entries(newAlert.labels).forEach(([key, value]) => {
        newAlertLines.push(`${indent2}${key}: ${value}`);
      });
    }

    // Add annotations (always quoted)
    if (newAlert.annotations && Object.keys(newAlert.annotations).length > 0) {
      newAlertLines.push(`${indent1}annotations:`);
      Object.entries(newAlert.annotations).forEach(([key, value]) => {
        const strValue = String(value);
        // Always quote annotation values and escape any quotes inside
        const escapedValue = strValue.replace(/"/g, '\\"');
        newAlertLines.push(`${indent2}${key}: "${escapedValue}"`);
      });
    }

    // Replace the alert block
    const before = lines.slice(0, alertStartIdx);
    const after = lines.slice(alertEndIdx);

    return [...before, ...newAlertLines, ...after].join('\n');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Edit Alert Configuration
          </DialogTitle>
          <DialogDescription>
            Modify the alert properties and create a pull request with your changes
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto pr-2">
          {/* Alert Info Card */}
          <div className="bg-muted/50 rounded-lg p-4 border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">File</span>
              <span className="text-sm font-mono">{file.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Category</span>
              <Badge variant="outline">{file.category}</Badge>
            </div>
          </div>

          {/* Alert Configuration Form */}
          <div className="space-y-4">
            <div className="grid gap-4">
              {/* Alert Name */}
              <div className="space-y-2">
                <Label htmlFor="alert-name" className="flex items-center gap-2">
                  Alert Name *
                  <span className="text-xs text-muted-foreground font-normal">(Unique identifier)</span>
                </Label>
                <Input
                  id="alert-name"
                  value={alertName}
                  onChange={(e) => setAlertName(e.target.value)}
                  placeholder="e.g., HighMemoryUsage"
                  className="font-mono"
                />
              </div>

              {/* Expression */}
              <div className="space-y-2">
                <Label htmlFor="expression" className="flex items-center gap-2">
                  PromQL Expression *
                  <span className="text-xs text-muted-foreground font-normal">(Query condition)</span>
                </Label>
                <Textarea
                  id="expression"
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  placeholder="e.g., node_memory_usage_bytes > 0.9"
                  className="font-mono text-sm min-h-[80px] resize-none"
                />
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration" className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  Duration
                  <span className="text-xs text-muted-foreground font-normal">(e.g., 5m)</span>
                </Label>
                <Input
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="5m"
                  className="font-mono"
                />
              </div>

              {/* Labels Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5" />
                    Labels
                    <span className="text-xs text-muted-foreground font-normal">(severity is required)</span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLabel}
                    className="h-7 text-xs"
                  >
                    + Add Label
                  </Button>
                </div>
                <div className="space-y-2 border rounded-lg p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                  {Object.keys(labels).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No labels defined. Click "Add Label" to create one.
                    </p>
                  ) : (
                    Object.entries(labels).map(([key, value], index) => (
                      <div key={`label-${index}`} className="bg-background/80 backdrop-blur-sm rounded-lg border shadow-sm p-3 flex gap-2 items-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                        {key === "severity" ? (
                          <>
                            <Input
                              value="severity"
                              disabled
                              className="font-mono text-xs h-8 flex-1 border-0 bg-transparent opacity-60"
                            />
                            <span className="text-muted-foreground text-sm">=</span>
                            <Select value={severity} onValueChange={setSeverity}>
                              <SelectTrigger className="h-8 flex-1 font-mono text-xs border-0 bg-muted/50 focus:ring-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="warning">warning</SelectItem>
                                <SelectItem value="critical">critical</SelectItem>
                                <SelectItem value="info">info</SelectItem>
                              </SelectContent>
                            </Select>
                          </>
                        ) : (
                          <>
                            <Input
                              value={key}
                              onChange={(e) => updateLabelKey(key, e.target.value)}
                              placeholder="key"
                              className="font-mono text-xs h-8 flex-1 border-0 bg-transparent focus-visible:ring-1"
                            />
                            <span className="text-muted-foreground text-sm">=</span>
                            <Input
                              value={String(value)}
                              onChange={(e) => handleLabelChange(key, e.target.value)}
                              placeholder="value"
                              className="font-mono text-xs h-8 flex-1 border-0 bg-muted/50 focus-visible:ring-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLabel(key)}
                              className="h-7 w-7 p-0 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Annotations Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Annotations
                    <span className="text-xs text-muted-foreground font-normal">(summary, description, impact, etc.)</span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAnnotation}
                    className="h-7 text-xs"
                  >
                    + Add Annotation
                  </Button>
                </div>
                <div className="space-y-3 border rounded-lg p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                  {Object.keys(annotations).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No annotations defined. Click "Add Annotation" to create one.
                    </p>
                  ) : (
                    Object.entries(annotations).map(([key, value], index) => (
                      <div key={`annotation-${index}`} className="bg-background/80 backdrop-blur-sm rounded-lg border shadow-sm p-3.5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-pink-500"></div>
                          <Input
                            value={key}
                            onChange={(e) => updateAnnotationKey(key, e.target.value)}
                            placeholder="key (e.g., summary, description, impact)"
                            className="font-mono text-xs h-7 flex-1 border-0 bg-transparent focus-visible:ring-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAnnotation(key)}
                            className="h-7 w-7 p-0 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <Textarea
                          value={String(value)}
                          onChange={(e) => handleAnnotationChange(key, e.target.value)}
                          placeholder="Annotation value..."
                          className="text-sm resize-none min-h-[80px] bg-muted/50 border-0 focus-visible:ring-1"
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {validationError && (
              <AlertComponent variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{validationError}</AlertDescription>
              </AlertComponent>
            )}
          </div>

          {/* PR Details */}
          <div className="border-t pt-4 space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <GitPullRequest className="h-4 w-4" />
              Pull Request Details
            </h4>

            {/* Commit Message */}
            <div className="space-y-2">
              <Label htmlFor="commit-message">Commit Message *</Label>
              <Input
                id="commit-message"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Brief description of changes..."
              />
            </div>

            {/* PR Description */}
            <div className="space-y-2">
              <Label htmlFor="pr-description">Pull Request Description</Label>
              <Textarea
                id="pr-description"
                value={prDescription}
                onChange={(e) => setPrDescription(e.target.value)}
                className="min-h-[120px] resize-none text-sm"
                placeholder="Detailed description for the pull request..."
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createPRMutation.isPending}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={createPRMutation.isPending || !!validationError || !commitMessage.trim()}
          >
            {createPRMutation.isPending ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating PR...
              </>
            ) : (
              <>
                <GitPullRequest className="h-4 w-4 mr-2" />
                Create Pull Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
