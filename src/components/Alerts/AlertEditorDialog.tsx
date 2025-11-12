import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert as AlertComponent, AlertDescription } from "@/components/ui/alert";
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
  const [labels, setLabels] = useState<Record<string, any>>({});
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
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
      setLabels(alert.labels || {});
      setSummary(alert.annotations?.summary || "");
      setDescription(alert.annotations?.description || "");
      setCommitMessage(`Update alert: ${alert.alert || "unnamed"}`);
      setPrDescription(`Update Prometheus alert configuration for **${alert.alert || "unnamed"}**`);
      setValidationError(null);
    }
  }, [open, alert]);

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
    const newKey = `label${Object.keys(labels).length + 1}`;
    setLabels(prev => ({ ...prev, [newKey]: "" }));
  };

  const removeLabel = (key: string) => {
    setLabels(prev => {
      const newLabels = { ...prev };
      delete newLabels[key];
      return newLabels;
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
      const updatedAlert = {
        ...originalAlert, // Start with all original data
        alert: alertName,
        expr: expression,
        ...(duration && { for: duration }),
        labels: {
          ...(originalAlert?.labels || {}), // Preserve all original labels
          ...labels, // Apply updated labels
        },
        annotations: {
          ...(originalAlert?.annotations || {}), // Preserve all original annotations
          ...(summary && { summary }),
          ...(description && { description }),
        },
      };

      // Remove empty labels/annotations objects
      if (Object.keys(updatedAlert.labels).length === 0) {
        delete updatedAlert.labels;
      }
      if (Object.keys(updatedAlert.annotations).length === 0) {
        delete updatedAlert.annotations;
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
  const replaceAlertInContent = (content: string, oldAlertName: string | undefined, newAlert: any): string => {
    if (!oldAlertName) {
      return content;
    }

    try {
      // Try to parse as proper YAML first
      const parsed = yaml.load(content) as any;

      // Navigate through the structure to find and replace the alert
      let replaced = false;

      // Check different possible structures
      if (parsed?.spec?.groups) {
        // PrometheusRule structure: spec.groups[].rules[]
        parsed.spec.groups.forEach((group: any) => {
          if (group.rules) {
            const index = group.rules.findIndex((rule: any) => rule.alert === oldAlertName);
            if (index !== -1) {
              group.rules[index] = newAlert;
              replaced = true;
            }
          }
        });
      } else if (parsed?.groups) {
        // Simple groups structure: groups[].rules[]
        parsed.groups.forEach((group: any) => {
          if (group.rules) {
            const index = group.rules.findIndex((rule: any) => rule.alert === oldAlertName);
            if (index !== -1) {
              group.rules[index] = newAlert;
              replaced = true;
            }
          }
        });
      } else if (Array.isArray(parsed?.rules)) {
        // Flat rules structure: rules[]
        const index = parsed.rules.findIndex((rule: any) => rule.alert === oldAlertName);
        if (index !== -1) {
          parsed.rules[index] = newAlert;
          replaced = true;
        }
      }

      if (replaced) {
        return yaml.dump(parsed, { indent: 2, lineWidth: -1 });
      }
    } catch (e) {
      console.log('YAML parsing failed, using surgical text-based replacement for Helm template');
    }

    // Fallback for Helm templates: surgical text-based replacement
    // Only replace the specific fields that changed, preserving original structure
    let modifiedContent = content;

    // Find the alert block
    const alertPattern = new RegExp(
      `(\\s*-\\s*alert:\\s*)${oldAlertName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s*\\n(?:(?!\\s*-\\s*alert:).)*?)(?=\\s*-\\s*alert:|$)`,
      'gs'
    );

    const match = alertPattern.exec(content);
    if (!match) {
      console.warn(`Could not find alert "${oldAlertName}" in content`);
      return content;
    }

    const alertBlockStart = match.index;
    const alertBlockEnd = match.index + match[0].length;
    const alertBlock = match[0];

    // Replace alert name if changed
    if (newAlert.alert && newAlert.alert !== oldAlertName) {
      const alertNamePattern = new RegExp(
        `(\\s*-\\s*alert:\\s*)${oldAlertName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
        'g'
      );
      modifiedContent = modifiedContent.replace(alertNamePattern, `$1${newAlert.alert}`);
    }

    // Replace expr if changed
    if (newAlert.expr !== undefined && originalAlert?.expr !== newAlert.expr) {
      const exprPattern = /(\s*expr:\s*)(?:\|[\s\S]*?(?=\n\s{0,4}\w)|.+)/;
      const exprMatch = alertBlock.match(exprPattern);
      if (exprMatch) {
        const oldExpr = exprMatch[0];
        const indent = exprMatch[1];
        const hasHelmVars = /{{.*?}}/.test(newAlert.expr);
        const newExpr = hasHelmVars ? `${indent}${newAlert.expr}` : `${indent}${newAlert.expr}`;

        // Find and replace within the alert block
        const beforeExpr = modifiedContent.substring(0, alertBlockStart);
        const afterAlert = modifiedContent.substring(alertBlockEnd);
        const blockWithNewExpr = alertBlock.replace(exprPattern, newExpr);
        modifiedContent = beforeExpr + blockWithNewExpr + afterAlert;
      }
    }

    // Replace for duration if changed
    if (newAlert.for !== undefined && originalAlert?.for !== newAlert.for) {
      const forPattern = /(\s*for:\s*).+/;
      const forMatch = alertBlock.match(forPattern);
      if (forMatch) {
        const oldFor = forMatch[0];
        const newFor = `${forMatch[1]}${newAlert.for}`;
        modifiedContent = modifiedContent.replace(oldFor, newFor);
      }
    }

    // Replace labels individually
    if (newAlert.labels && originalAlert?.labels) {
      Object.entries(newAlert.labels).forEach(([key, value]) => {
        if (originalAlert.labels[key] !== value) {
          const labelPattern = new RegExp(`(\\s*${key}:\\s*).+`, 'g');
          const labelMatch = alertBlock.match(labelPattern);
          if (labelMatch) {
            labelMatch.forEach(oldLabel => {
              const indent = oldLabel.match(/^(\s*)/)?.[1] || '';
              const newLabel = `${indent}${key}: ${value}`;
              modifiedContent = modifiedContent.replace(oldLabel, newLabel);
            });
          }
        }
      });
    }

    // Replace annotations individually (preserving quotes if they exist)
    if (newAlert.annotations && originalAlert?.annotations) {
      Object.entries(newAlert.annotations).forEach(([key, value]) => {
        if (originalAlert.annotations[key] !== value && value) {
          // Match annotation with optional multi-line quoted strings
          const annotationPattern = new RegExp(
            `(\\s*${key}:\\s*)"[\\s\\S]*?"`,
            'g'
          );
          const annotationMatch = alertBlock.match(annotationPattern);
          if (annotationMatch) {
            annotationMatch.forEach(oldAnnotation => {
              const indent = oldAnnotation.match(/^(\s*)/)?.[1] || '';
              const escapedValue = String(value).replace(/"/g, '\\"');
              const newAnnotation = `${indent}${key}: "${escapedValue}"`;
              modifiedContent = modifiedContent.replace(oldAnnotation, newAnnotation);
            });
          }
        }
      });
    }

    return modifiedContent;
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
                    <span className="text-xs text-muted-foreground font-normal">(key-value pairs)</span>
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
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3 bg-muted/30">
                  {Object.keys(labels).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No labels defined. Click "Add Label" to create one.
                    </p>
                  ) : (
                    Object.entries(labels).map(([key, value]) => (
                      <div key={key} className="flex gap-2 items-center">
                        <Input
                          value={key}
                          onChange={(e) => {
                            const newKey = e.target.value;
                            setLabels(prev => {
                              const newLabels = { ...prev };
                              delete newLabels[key];
                              if (newKey.trim()) {
                                newLabels[newKey] = value;
                              }
                              return newLabels;
                            });
                          }}
                          placeholder="key"
                          className="font-mono text-xs flex-1"
                        />
                        <span className="text-muted-foreground">=</span>
                        <Input
                          value={String(value)}
                          onChange={(e) => handleLabelChange(key, e.target.value)}
                          placeholder="value"
                          className="font-mono text-xs flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLabel(key)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <Label htmlFor="summary">Summary (Annotation)</Label>
                <Input
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Brief description of the alert"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Annotation)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description and remediation steps..."
                  className="min-h-[100px] resize-none text-sm"
                />
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
