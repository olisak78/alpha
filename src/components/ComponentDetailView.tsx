import { useState } from "react";
import { 
  ArrowLeft,
  Globe,
  X,
  Activity,
  Monitor,
  CheckCircle,
  Play,
  BarChart3,
  FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OverviewTab from "@/components/OverviewTab";
import ApiTab from "@/components/ApiTab";
import CloudFoundryTab from "@/components/CloudFoundryTab";
import RateLimitTab from "@/components/tabs/RateLimitTab";
import LogLevelTab from "@/components/tabs/LogLevelTab";
import { Component, Landscape, RateLimitRule } from "@/types/developer-portal";


interface ComponentDetailViewProps {
  component: Component;
  selectedLandscape: string | null;
  landscapes: Landscape[];
  landscapeGroups: Record<string, Landscape[]>;
  activeProject: string;
  rateLimitRules: RateLimitRule[];
  onRateLimitRulesChange: (rules: RateLimitRule[]) => void;
  logLevels: Record<string, string>;
  onLogLevelsChange: (levels: Record<string, string>) => void;
  mockLogLevelsAcrossLandscapes: Record<string, Record<string, string>>;
  onBack: () => void;
  onLandscapeChange: (landscape: string | null) => void;
  getDeployedVersion: (componentId: string, landscape: string | null) => string | null;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "healthy":
    case "active":
    case "deployed":
      return "bg-success text-white";
    case "warning":
    case "deploying":
      return "bg-warning text-white";
    case "error":
    case "inactive":
    case "failed":
      return "bg-destructive text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function ComponentDetailView({
  component,
  selectedLandscape,
  landscapes,
  landscapeGroups,
  activeProject,
  rateLimitRules,
  onRateLimitRulesChange,
  logLevels,
  onLogLevelsChange,
  mockLogLevelsAcrossLandscapes,
  onBack,
  onLandscapeChange,
  getDeployedVersion
}: ComponentDetailViewProps) {
  const selectedLandscapeData = selectedLandscape ? landscapes.find(l => l.id === selectedLandscape) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">{component.name}</h1>
              <p className="text-muted-foreground">{component.description}</p>
              {selectedLandscapeData && (
                <p className="text-sm text-muted-foreground">
                  Filtered by: {selectedLandscapeData.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Landscape Filter */}
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(component.status)}>
                {component.status}
              </Badge>
              <Globe className="h-4 w-4 text-muted-foreground ml-4" />
              <Select value={selectedLandscape || "none"} onValueChange={(value) => onLandscapeChange(value === "none" ? null : value)}>
                <SelectTrigger className="w-60">
                  <SelectValue placeholder="Select Landscape" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Landscape Selected</SelectItem>
                  {Object.entries(landscapeGroups).map(([groupName, landscapes]) => (
                    <div key={groupName}>
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {groupName}
                      </div>
                      {landscapes.map((landscape) => (
                        <SelectItem key={landscape.id} value={landscape.id}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(landscape.status).replace('text-white', '')}`} />
                            {landscape.name}
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={() => onLandscapeChange(null)}
              disabled={!selectedLandscape}
              className="ml-2"
              aria-label="Clear selection"
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Component Details */}
      <div className="p-6">

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            {activeProject === "CIS@2.0" && (
              <TabsTrigger value="overview">Overview</TabsTrigger>
            )}
            {activeProject !== "CIS@2.0" && (<TabsTrigger value="cicd">CI/CD</TabsTrigger>)}
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="ratelimit">Rate Limit</TabsTrigger>
            <TabsTrigger value="loglevel">Log Level</TabsTrigger>
            {activeProject === "CIS@2.0" && (
              <TabsTrigger value="cloudfoundry">Cloud Foundry</TabsTrigger>
            )}
          </TabsList>

          {activeProject === "CIS@2.0" && (
            <TabsContent value="overview" className="mt-6">
              <OverviewTab
                componentId={component.id}
                componentName={component.name}
                description={component.description}
                landscapeId={selectedLandscape}
                links={component.links}
                status={component.status}
                coverage={component.coverage}
                vulnerabilities={component.vulnerabilities}
                deployedVersion={getDeployedVersion(component.id, selectedLandscape)}
              />
            </TabsContent>
          )}

          <TabsContent value="api" className="mt-6">
            <ApiTab componentId={component.id} componentName={component.name} swaggerUrl={component.links?.swagger} />
          </TabsContent>

          {activeProject !== "CIS@2.0" && (
            <TabsContent value="cicd" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    GitHub Actions Pipeline
                    {selectedLandscapeData && (
                      <Badge variant="outline">{selectedLandscapeData.name}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-success" />
                        <div>
                          <p className="font-medium">Build & Test</p>
                          <p className="text-sm text-muted-foreground">Completed 2 minutes ago</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Logs
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-success" />
                        <div>
                          <p className="font-medium">Security Scan</p>
                          <p className="text-sm text-muted-foreground">Completed 5 minutes ago</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Report
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Play className="h-5 w-5 text-warning animate-pulse" />
                        <div>
                          <p className="font-medium">Deploy to {selectedLandscapeData?.name || 'Staging'}</p>
                          <p className="text-sm text-muted-foreground">Running...</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Progress
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          <TabsContent value="monitoring" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Component Monitoring
                  {selectedLandscapeData && (
                    <Badge variant="outline">{selectedLandscapeData.name}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span className="font-medium">Health Status</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Service is running normally</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <span className="font-medium">Performance</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Response time: 120ms</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="ratelimit" className="mt-6">
            <RateLimitTab
              selectedComponent={component.id}
              selectedLandscape={selectedLandscape}
              selectedLandscapeName={selectedLandscapeData?.name}
              rateLimitRules={rateLimitRules}
              onUpdateRules={onRateLimitRulesChange}
            />
          </TabsContent>
          
          <TabsContent value="loglevel" className="mt-6">
            <LogLevelTab
              selectedLandscape={selectedLandscape}
              selectedLandscapeName={selectedLandscapeData?.name}
              logLevels={logLevels}
              onUpdateLogLevels={onLogLevelsChange}
              mockLogLevelsAcrossLandscapes={mockLogLevelsAcrossLandscapes}
            />
          </TabsContent>

          {activeProject === "CIS@2.0" && (
            <TabsContent value="cloudfoundry" className="mt-6">
              <CloudFoundryTab componentId={component.id} landscapeId={selectedLandscape} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
