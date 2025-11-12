import { useState } from "react";
import { 
  Zap, 
  Filter, 
  Plus, 
  X, 
  Clock, 
  BarChart3, 
  Code, 
  Edit, 
  Trash2, 
  Globe 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RateLimitRule } from "@/types/developer-portal";

interface RateLimitTabProps {
  selectedComponent: string | null;
  selectedLandscape: string | null;
  selectedLandscapeName?: string;
  rateLimitRules: RateLimitRule[];
  onUpdateRules: (rules: RateLimitRule[]) => void;
}

export default function RateLimitTab({
  selectedComponent,
  selectedLandscape,
  selectedLandscapeName,
  rateLimitRules,
  onUpdateRules
}: RateLimitTabProps) {
  const [showCreateRuleDialog, setShowCreateRuleDialog] = useState(false);
  const [showEditRuleDialog, setShowEditRuleDialog] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [showEditConfirmDialog, setShowEditConfirmDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<RateLimitRule | null>(null);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [ruleFilters, setRuleFilters] = useState({
    endpoint: "all",
    method: "all", 
    identityType: "all"
  });
  const [newRule, setNewRule] = useState({
    method: "GET",
    period: 60,
    requestsLimit: 10,
    endpoint: "",
    identityType: "USERNAME"
  });

  const getFilteredRateLimitRules = () => {
    if (!selectedComponent || !selectedLandscape) return [];
    
    return rateLimitRules
      .filter(rule => 
        rule.componentId === selectedComponent && 
        rule.landscapes[selectedLandscape] &&
        (ruleFilters.endpoint === "all" || rule.endpoint === ruleFilters.endpoint) &&
        (ruleFilters.method === "all" || rule.method === ruleFilters.method) &&
        (ruleFilters.identityType === "all" || rule.identityType === ruleFilters.identityType)
      );
  };

  const getAvailableEndpoints = () => {
    if (!selectedComponent || !selectedLandscape) return [];
    
    const endpoints = rateLimitRules
      .filter(rule => rule.componentId === selectedComponent && rule.landscapes[selectedLandscape])
      .map(rule => rule.endpoint)
      .filter((endpoint, index, self) => endpoint && endpoint.trim() !== '' && self.indexOf(endpoint) === index)
      .sort();
    
    return endpoints;
  };

  const getAvailableMethods = () => {
    if (!selectedComponent || !selectedLandscape) return [];
    
    const methods = rateLimitRules
      .filter(rule => rule.componentId === selectedComponent && rule.landscapes[selectedLandscape])
      .map(rule => rule.method)
      .filter((method, index, self) => method && method.trim() !== '' && self.indexOf(method) === index)
      .sort();
    
    return methods;
  };

  const getAvailableIdentityTypes = () => {
    if (!selectedComponent || !selectedLandscape) return [];
    
    const identityTypes = rateLimitRules
      .filter(rule => rule.componentId === selectedComponent && rule.landscapes[selectedLandscape])
      .map(rule => rule.identityType)
      .filter((type, index, self) => type && type.trim() !== '' && self.indexOf(type) === index)
      .sort();
    
    return identityTypes;
  };

  const handleEditRule = (rule: RateLimitRule) => {
    setEditingRule({...rule});
    setShowEditRuleDialog(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    setDeletingRuleId(ruleId);
    setShowDeleteConfirmDialog(true);
  };

  const confirmDelete = () => {
    if (deletingRuleId) {
      onUpdateRules(rateLimitRules.filter(r => r.id !== deletingRuleId));
      setDeletingRuleId(null);
    }
    setShowDeleteConfirmDialog(false);
  };

  const confirmEdit = () => {
    if (editingRule) {
      onUpdateRules(rateLimitRules.map(r => r.id === editingRule.id ? editingRule : r));
      setEditingRule(null);
    }
    setShowEditRuleDialog(false);
    setShowEditConfirmDialog(false);
  };

  const handleCreateRule = () => {
    const landscapes = {
      "staging": false,
      "int": false, 
      "canary": false,
      "perf": false,
      "hotfix": false,
      "live": false,
      [selectedLandscape as string]: true
    };
    const newRuleWithId: RateLimitRule = {
      ...newRule,
      id: Date.now().toString(),
      componentId: selectedComponent || "",
      landscapes
    };
    onUpdateRules([...rateLimitRules, newRuleWithId]);
    setNewRule({
      method: "GET",
      period: 60,
      requestsLimit: 10,
      endpoint: "",
      identityType: "USERNAME"
    });
    setShowCreateRuleDialog(false);
  };

  if (!selectedLandscape) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <Globe className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-medium mb-2">Landscape Required</h3>
              <p className="text-muted-foreground">
                Please select a landscape to view and manage rate limit rules.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Endpoint</Label>
                <Select value={ruleFilters.endpoint} onValueChange={(value) => setRuleFilters({...ruleFilters, endpoint: value})}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Endpoints</SelectItem>
                    {getAvailableEndpoints().map(endpoint => (
                      <SelectItem key={endpoint} value={endpoint}>{endpoint}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Method</Label>
                <Select value={ruleFilters.method} onValueChange={(value) => setRuleFilters({...ruleFilters, method: value})}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    {getAvailableMethods().map(method => (
                      <SelectItem key={method} value={method}>{method}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Identity Type</Label>
                <Select value={ruleFilters.identityType} onValueChange={(value) => setRuleFilters({...ruleFilters, identityType: value})}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {getAvailableIdentityTypes().map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(ruleFilters.endpoint !== "all" || ruleFilters.method !== "all" || ruleFilters.identityType !== "all") && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setRuleFilters({endpoint: "all", method: "all", identityType: "all"})}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Rate Limit Rules
              <Badge variant="outline">{selectedLandscapeName}</Badge>
              <Badge variant="secondary">{getFilteredRateLimitRules().length} rules</Badge>
            </div>
            <Dialog open={showCreateRuleDialog} onOpenChange={setShowCreateRuleDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Rate Limit Rule</DialogTitle>
                  <DialogDescription>
                    Configure a new rate limit rule for this component.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="method">Method</Label>
                      <Select value={newRule.method} onValueChange={(value) => setNewRule({...newRule, method: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                          <SelectItem value="PATCH">PATCH</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="period">Period (seconds)</Label>
                      <Input
                        type="number"
                        value={newRule.period}
                        onChange={(e) => setNewRule({...newRule, period: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="limit">Requests Limit</Label>
                      <Input
                        type="number"
                        value={newRule.requestsLimit}
                        onChange={(e) => setNewRule({...newRule, requestsLimit: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="identity">Identity Type</Label>
                      <Select value={newRule.identityType} onValueChange={(value) => setNewRule({...newRule, identityType: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USERNAME">USERNAME</SelectItem>
                          <SelectItem value="IAS_EMAIL">IAS_EMAIL</SelectItem>
                          <SelectItem value="IP_ADDRESS">IP_ADDRESS</SelectItem>
                          <SelectItem value="API_KEY">API_KEY</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="endpoint">REST Endpoint</Label>
                    <Input
                      placeholder="/api/v1/endpoint"
                      value={newRule.endpoint}
                      onChange={(e) => setNewRule({...newRule, endpoint: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateRuleDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateRule}>
                      Create Rule
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getFilteredRateLimitRules().map((rule) => (
              <div key={rule.id} className="p-6 border rounded-lg bg-gradient-to-r from-background to-muted/30">
                <div className="flex items-start justify-between">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Zap className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">Rate Limit Rule</h4>
                        <p className="text-sm text-muted-foreground">ID: {rule.id}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Method</Label>
                        <div className="flex items-center gap-2">
                          <Badge variant={rule.method === 'GET' ? 'default' : rule.method === 'POST' ? 'destructive' : 'secondary'}>
                            {rule.method}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Time Window</Label>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{rule.period}s</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Max Requests</Label>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{rule.requestsLimit}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Identity Type</Label>
                        <Badge variant="outline">{rule.identityType}</Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">REST Endpoint</Label>
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                        <Code className="h-4 w-4 text-muted-foreground" />
                        <code className="text-sm font-mono">{rule.endpoint}</code>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditRule(rule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {getFilteredRateLimitRules().length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">No Rules Found</h3>
                <p>No rate limit rules match your current filters for {selectedLandscapeName}.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Rule Dialog */}
      <Dialog open={showEditRuleDialog} onOpenChange={setShowEditRuleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Rate Limit Rule</DialogTitle>
            <DialogDescription>
              Modify the rate limit rule configuration.
            </DialogDescription>
          </DialogHeader>
          {editingRule && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="method">Method</Label>
                  <Select value={editingRule.method} onValueChange={(value) => setEditingRule({...editingRule, method: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="period">Period (seconds)</Label>
                  <Input
                    type="number"
                    value={editingRule.period}
                    onChange={(e) => setEditingRule({...editingRule, period: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="limit">Requests Limit</Label>
                  <Input
                    type="number"
                    value={editingRule.requestsLimit}
                    onChange={(e) => setEditingRule({...editingRule, requestsLimit: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="identity">Identity Type</Label>
                  <Select value={editingRule.identityType} onValueChange={(value) => setEditingRule({...editingRule, identityType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USERNAME">USERNAME</SelectItem>
                      <SelectItem value="IAS_EMAIL">IAS_EMAIL</SelectItem>
                      <SelectItem value="IP_ADDRESS">IP_ADDRESS</SelectItem>
                      <SelectItem value="API_KEY">API_KEY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="endpoint">REST Endpoint</Label>
                <Input
                  value={editingRule.endpoint}
                  onChange={(e) => setEditingRule({...editingRule, endpoint: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditRuleDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowEditConfirmDialog(true)}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Confirmation Dialog */}
      <Dialog open={showEditConfirmDialog} onOpenChange={setShowEditConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Changes</DialogTitle>
            <DialogDescription>
              Are you sure you want to apply these changes to the rate limit rule? This action will affect the rate limiting behavior for this endpoint.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmEdit}>
              Apply Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this rate limit rule? This action cannot be undone and will immediately remove rate limiting for this endpoint.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirmDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Rule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
