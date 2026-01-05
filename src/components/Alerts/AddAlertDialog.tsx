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
import { AlertCircle, GitPullRequest, X, Clock, Activity, Tag, Plus } from "lucide-react";
import { AlertFile, useCreateAlertPR } from "@/hooks/api/useAlerts";
import { useToast } from "@/hooks/use-toast";
import * as yaml from 'js-yaml';

interface AddAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: AlertFile[];
  projectId: string;
}

export function AddAlertDialog({
  open,
  onOpenChange,
  files,
  projectId,
}: AddAlertDialogProps) {
  // Form fields
  const [selectedFile, setSelectedFile] = useState("");
  const [alertName, setAlertName] = useState("");
  const [expression, setExpression] = useState("");
  const [duration, setDuration] = useState("5m");
  const [severity, setSeverity] = useState<string>("warning");
  const [labels, setLabels] = useState<Record<string, any>>({ severity: "warning" });
  const [annotations, setAnnotations] = useState<Record<string, any>>({});
  const [commitMessage, setCommitMessage] = useState("");
  const [prDescription, setPrDescription] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const { toast } = useToast();
  const createPRMutation = useCreateAlertPR(projectId);

  useEffect(() => {
    if (open) {
      // Reset form
      setSelectedFile(files.length > 0 ? files[0].name : "");
      setAlertName("");
      setExpression("");
      setDuration("5m");
      setSeverity("warning");
      setLabels({ severity: "warning" });
      setAnnotations({});
      setCommitMessage("[Add-Rule] ");
      setPrDescription("Add new Prometheus alert rule");
      setValidationError(null);
    }
  }, [open, files]);

  // Keep labels.severity in sync with severity dropdown
  useEffect(() => {
    setLabels(prev => ({ ...prev, severity }));
  }, [severity]);

  const validateForm = (): boolean => {
    if (!selectedFile) {
      setValidationError("Please select a file");
      return false;
    }
    if (!alertName.trim()) {
      setValidationError("Alert name is required");
      return false;
    }
    if (!expression.trim()) {
      setValidationError("Alert expression is required");
      return false;
    }
    if (!duration.trim()) {
      setValidationError("Duration is required");
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
    setLabels(prev => ({ [newKey]: "", ...prev }));
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
    setAnnotations(prev => ({ [newKey]: "", ...prev }));
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
      const selectedFileObj = files.find(f => f.name === selectedFile);
      if (!selectedFileObj) {
        throw new Error("Selected file not found");
      }

      const newAlert: any = {
        alert: alertName,
        expr: expression,
        for: duration,
      };

      if (Object.keys(labels).length > 0) {
        newAlert.labels = labels;
      }

      if (Object.keys(annotations).length > 0) {
        newAlert.annotations = annotations;
      }

      // Add the alert to the file content
      const updatedContent = addAlertToContent(selectedFileObj.content, newAlert);

      const result = await createPRMutation.mutateAsync({
        fileName: selectedFileObj.name,
        content: updatedContent,
        message: commitMessage,
        description: prDescription,
      });

      toast({
        title: "Pull Request Created",
        description: `Successfully created PR for ${alertName}`,
        className: "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50",
      });

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

  const addAlertToContent = (content: string, newAlert: any): string => {
    const lines = content.split('\n');

    // Find where to insert (at the end of the rules section, before {{- end }})
    let insertIdx = -1;
    let baseIndent = '';
    let inRulesSection = false;
    let rulesStartIdx = -1;
    let lastAlertIdx = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for rules: section
      if (line.match(/^\s*rules:\s*$/)) {
        inRulesSection = true;
        rulesStartIdx = i;
        baseIndent = line.match(/^(\s*)/)?.[1] || '';
        baseIndent += '  '; // Rules items are indented under rules:
        continue;
      }

      // Track the last alert in rules section
      if (inRulesSection && line.match(/^(\s*)-\s*alert:/)) {
        const alertIndent = line.match(/^(\s*)-/)?.[1] || '';
        if (!baseIndent) {
          baseIndent = alertIndent;
        }
        lastAlertIdx = i;
      }
    }

    // Now find where the last alert ends
    if (lastAlertIdx >= 0) {
      // Scan forward from the last alert to find where it ends
      insertIdx = lastAlertIdx + 1;
      for (let i = lastAlertIdx + 1; i < lines.length; i++) {
        const line = lines[i];

        // Stop if we hit {{- end }} or {{- else }}
        if (line.match(/^\s*\{\{-\s*(end|else)\s*\}\}/)) {
          insertIdx = i;
          break;
        }

        // Stop if we hit another alert (shouldn't happen, but safety check)
        if (line.match(/^\s*-\s*alert:/)) {
          insertIdx = i;
          break;
        }

        // If the line is part of the alert (properly indented), keep scanning
        if (line.trim() && line.startsWith(baseIndent)) {
          insertIdx = i + 1;
          continue;
        }

        // If we hit an empty line, keep it as part of the spacing
        if (!line.trim()) {
          insertIdx = i + 1;
          continue;
        }

        // Otherwise we've gone too far, insert before this line
        insertIdx = i;
        break;
      }
    } else if (rulesStartIdx >= 0) {
      // No alerts found, add right after rules: line
      insertIdx = rulesStartIdx + 1;
    } else {
      throw new Error("Could not find rules section in file");
    }

    if (insertIdx < 0) {
      throw new Error("Could not determine insertion point in file");
    }

    // Build the new alert YAML
    const indent1 = baseIndent + '  ';
    const indent2 = baseIndent + '    ';

    const newAlertLines: string[] = [];
    newAlertLines.push(`${baseIndent}- alert: ${newAlert.alert}`);
    newAlertLines.push(`${indent1}expr: ${newAlert.expr}`);
    newAlertLines.push(`${indent1}for: ${newAlert.for}`);

    if (newAlert.labels && Object.keys(newAlert.labels).length > 0) {
      newAlertLines.push(`${indent1}labels:`);
      Object.entries(newAlert.labels).forEach(([key, value]) => {
        newAlertLines.push(`${indent2}${key}: ${value}`);
      });
    }

    if (newAlert.annotations && Object.keys(newAlert.annotations).length > 0) {
      newAlertLines.push(`${indent1}annotations:`);
      Object.entries(newAlert.annotations).forEach(([key, value]) => {
        const strValue = String(value);
        const escapedValue = strValue.replace(/"/g, '\\"');
        newAlertLines.push(`${indent2}${key}: "${escapedValue}"`);
      });
    }

    // Insert the new alert
    const before = lines.slice(0, insertIdx);
    const after = lines.slice(insertIdx);

    return [...before, ...newAlertLines, ...after].join('\n');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add New Alert Rule
          </DialogTitle>
          <DialogDescription>
            Create a new Prometheus alert rule and submit a pull request
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto pr-2">
          {/* File Selection */}
          <div className="space-y-2">
            <Label htmlFor="file-select">Target File *</Label>
            <Select value={selectedFile} onValueChange={setSelectedFile}>
              <SelectTrigger id="file-select">
                <SelectValue placeholder="Select a file" />
              </SelectTrigger>
              <SelectContent>
                {files.map((file) => (
                  <SelectItem key={file.name} value={file.name}>
                    {file.name} ({file.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  Duration *
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
                  {Object.entries(labels).map(([key, value], index) => (
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
                  ))}
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
