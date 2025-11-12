import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Code, Lightbulb, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mockComponents, mockMetrics, mockQueryTemplates, mockTeams } from '@/data/monitoring/mock-data';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface WizardState {
  step: number;
  team: string;
  component: string;
  metric: string;
  query: string;
  severity: string;
  forDuration: string;
  name: string;
  description: string;
  runbookUrl: string;
  labels: Record<string, string>;
  environment: string;
}

const initialState: WizardState = {
  step: 1,
  team: '',
  component: '',
  metric: '',
  query: '',
  severity: '',
  forDuration: '5m',
  name: '',
  description: '',
  runbookUrl: '',
  labels: {},
  environment: 'live'
};

interface CreateAlertWizardProps {
  onClose?: () => void;
  initialData?: any;
  mode?: 'create' | 'edit' | 'duplicate';
}

export function CreateAlertWizard({ onClose, initialData, mode = 'create' }: CreateAlertWizardProps) {
  const [state, setState] = useState<WizardState>(() => {
    if (initialData && (mode === 'edit' || mode === 'duplicate')) {
      return {
        step: 1,
        team: initialData.team || '',
        component: initialData.component || '',
        metric: initialData.query || '',
        query: initialData.query || '',
        severity: initialData.severity || 'warning',
        forDuration: initialData.for || '5m',
        name: mode === 'duplicate' ? '' : (initialData.name || ''),
        description: initialData.annotations?.description || '',
        runbookUrl: initialData.annotations?.runbook_url || '',
        labels: initialData.labels || {},
        environment: initialData.environment || 'live'
      };
    }
    return initialState;
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();
  const [showTeamChangeConfirmDialog, setShowTeamChangeConfirmDialog] = useState(false);
  const [pendingTeamChange, setPendingTeamChange] = useState('');

  const updateState = (updates: Partial<WizardState>) => {
    setState(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  const getAvailableComponents = () => {
    if (!state.team) return [];
    return mockComponents.filter(comp => comp.team === state.team);
  };

  const applyTemplate = (template: any) => {
    const populatedQuery = template.query
      .replace('$COMP', state.component)
      .replace('$TEAM', state.team);

    updateState({
      query: populatedQuery,
      severity: template.severity,
      name: `${mockComponents.find(c => c.id === state.component)?.name} - ${template.name}`,
      description: template.description
    });
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return state.team && state.component;
      case 2:
        return state.metric && state.query;
      case 3:
        return state.severity && state.name && state.description;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(state.step)) {
      updateState({ step: state.step + 1 });
    }
  };

  const prevStep = () => {
    updateState({ step: state.step - 1 });
  };

  const handleTeamChange = (team: string) => {
    if (hasUnsavedChanges && state.component) {
      setPendingTeamChange(team);
      setShowTeamChangeConfirmDialog(true);
    }
    updateState({ team, component: '' });
  };

  const confirmTeamChange = () => {
    updateState({ team: pendingTeamChange, component: '' });
    setShowTeamChangeConfirmDialog(false);
    setPendingTeamChange('');
  };

  const cancelTeamChange = () => {
    setShowTeamChangeConfirmDialog(false);
    setPendingTeamChange('');
  };

  const resetWizard = () => {
    setState(initialState);
    setHasUnsavedChanges(false);
    toast({
      title: "Wizard Reset",
      description: "All fields have been cleared.",
    });
  };

  const createAlert = () => {
    // In a real app, make API call
    const action = mode === 'edit' ? 'updated' : mode === 'duplicate' ? 'duplicated' : 'created';
    toast({
      title: `Alert ${action.charAt(0).toUpperCase() + action.slice(1)} Successfully`,
      description: `${state.name} has been ${action} and is now monitoring your component.`,
    });
    resetWizard();
    onClose?.();
  };

  const saveDraft = () => {
    toast({
      title: "Draft Saved",
      description: "Your alert rule has been saved as a draft.",
    });
    setHasUnsavedChanges(false);
  };

  const getStepTitle = () => {
    switch (state.step) {
      case 1: return 'Select Team & Component';
      case 2: return 'Configure Metric & Query';
      case 3: return 'Set Rule Properties';
      case 4: return 'Review & Create';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">{getStepTitle()}</h3>
              <span className="text-sm text-muted-foreground">Step {state.step} of 4</span>
            </div>
            <Progress value={(state.step / 4) * 100} className="w-full" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Team & Component</span>
              <span>Metric & Query</span>
              <span>Rule Settings</span>
              <span>Review</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {state.step === 1 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="team">Team *</Label>
                  <Select value={state.team} onValueChange={handleTeamChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockTeams.map(team => (
                        <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="component">Component *</Label>
                  <Select
                    value={state.component}
                    onValueChange={(value) => updateState({ component: value })}
                    disabled={!state.team}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a component" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableComponents().map(comp => (
                        <SelectItem key={comp.id} value={comp.id}>{comp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!state.team && (
                    <p className="text-xs text-muted-foreground mt-1">Select a team first</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="environment">Environment</Label>
                  <Select value={state.environment} onValueChange={(value) => updateState({ environment: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="canary">Canary</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {state.team && state.component && (
                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      Found {getAvailableComponents().length} component(s) for {mockTeams.find(t => t.id === state.team)?.name}.
                      Selected: {mockComponents.find(c => c.id === state.component)?.name}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}

          {state.step === 2 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="metric">Metric</Label>
                <Select value={state.metric} onValueChange={(value) => updateState({ metric: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockMetrics.map(metric => (
                      <SelectItem key={metric.id} value={metric.id}>
                        <div>
                          <div className="font-medium">{metric.name}</div>
                          <div className="text-xs text-muted-foreground">{metric.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="query">PromQL Query *</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      // Mock query validation
                      toast({
                        title: "Query Valid",
                        description: "PromQL syntax is correct.",
                      });
                    }}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Validate
                  </Button>
                </div>
                <Textarea
                  id="query"
                  value={state.query}
                  onChange={(e) => updateState({ query: e.target.value })}
                  placeholder="Enter PromQL query..."
                  className="font-mono text-sm min-h-[100px]"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  <Label className="text-sm font-medium">Popular Templates</Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {mockQueryTemplates.map(template => (
                    <Card key={template.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => applyTemplate(template)}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{template.name}</div>
                            <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
                            <Badge variant="outline" className="mt-2 text-xs">
                              {template.category}
                            </Badge>
                          </div>
                          <Badge variant={template.severity === 'critical' ? 'destructive' : template.severity === 'warning' ? 'secondary' : 'outline'} className="text-xs">
                            {template.severity}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {state.query && (
                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>Query preview: Last 6 hours data would show 2 potential alerts</span>
                      <Button variant="outline" size="sm">View Preview</Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {state.step === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="severity">Severity *</Label>
                  <Select value={state.severity} onValueChange={(value) => updateState({ severity: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="forDuration">For Duration</Label>
                  <Select value={state.forDuration} onValueChange={(value) => updateState({ forDuration: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1m">1 minute</SelectItem>
                      <SelectItem value="2m">2 minutes</SelectItem>
                      <SelectItem value="5m">5 minutes</SelectItem>
                      <SelectItem value="10m">10 minutes</SelectItem>
                      <SelectItem value="15m">15 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="name">Alert Name *</Label>
                <Input
                  id="name"
                  value={state.name}
                  onChange={(e) => updateState({ name: e.target.value })}
                  placeholder="Enter alert name..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={state.description}
                  onChange={(e) => updateState({ description: e.target.value })}
                  placeholder="Enter alert description..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="runbookUrl">Runbook URL</Label>
                <Input
                  id="runbookUrl"
                  value={state.runbookUrl}
                  onChange={(e) => updateState({ runbookUrl: e.target.value })}
                  placeholder="https://runbooks.example.com/..."
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {state.step === 4 && (
            <div className="space-y-6">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Review your alert rule configuration before creating.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span> {state.name}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Severity:</span>{' '}
                      <Badge variant={state.severity === 'critical' ? 'destructive' : state.severity === 'warning' ? 'secondary' : 'outline'}>
                        {state.severity}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Team:</span> {mockTeams.find(t => t.id === state.team)?.name}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Component:</span> {mockComponents.find(c => c.id === state.component)?.name}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Environment:</span> {state.environment}
                    </div>
                    <div>
                      <span className="text-muted-foreground">For Duration:</span> {state.forDuration}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Query</h4>
                  <div className="p-3 bg-muted rounded-md">
                    <code className="text-sm">{state.query}</code>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Generated YAML</h4>
                  <div className="p-3 bg-muted rounded-md">
                    <pre className="text-xs text-muted-foreground">
                      {`groups:
  - name: ${state.team}-${state.component}
    rules:
      - alert: ${state.name.replace(/\s+/g, '')}
        expr: ${state.query}
        for: ${state.forDuration}
        labels:
          severity: ${state.severity}
          team: ${state.team}
          component: ${state.component}
          environment: ${state.environment}
        annotations:
          summary: ${state.name}
          description: ${state.description}${state.runbookUrl ? `
          runbook_url: ${state.runbookUrl}` : ''}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {state.step > 1 && (
                <Button variant="outline" onClick={prevStep}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <Button variant="ghost" onClick={saveDraft}>
                  Save as Draft
                </Button>
              )}

              {state.step < 4 ? (
                <Button
                  onClick={nextStep}
                  disabled={!validateStep(state.step)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={createAlert} className="min-w-32">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {mode === 'edit' ? 'Update Alert' : mode === 'duplicate' ? 'Duplicate Alert' : 'Create Alert'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Change Confirmation Dialog */}
      <AlertDialog open={showTeamChangeConfirmDialog} onOpenChange={setShowTeamChangeConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Team Change</AlertDialogTitle>
            <AlertDialogDescription>
              Changing the team will clear your current component selection. You will need to select a new component from the new team. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelTeamChange}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmTeamChange}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}