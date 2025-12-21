import { ExternalLink, Activity, Database, AlertCircle, CheckCircle, XCircle, Clock, Shield, Zap, Server, HardDrive, Info, ChevronDown, ChevronRight, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Component } from "@/types/api";
import type { HealthResponse } from "@/types/health";
import { CircuitBreakerSection } from "@/components/CircuitBreakerSection";
import { buildHealthEndpoint, buildHealthEndpointWithSubdomain } from "@/services/healthApi";
import { useState } from "react";

interface ComponentViewOverviewProps {
    component: Component | undefined;
    selectedLandscape: string | null;
    selectedApiLandscape: any;
    healthData: HealthResponse | null;
    healthLoading: boolean;
    healthError: string | null;
    responseTime: number | null;
    statusCode: number | null;
    sonarData: any;
    sonarLoading: boolean;
}

const NestedHealthComponent = ({ name, data, level = 0 }: { name: string; data: any; level?: number }) => {
    const [isOpen, setIsOpen] = useState(true);
    const hasComponents = data.components && Object.keys(data.components).length > 0;
    const hasDetails = data.details && Object.keys(data.details).length > 0;
    const paddingLeft = `${level * 1}rem`;

    // Helper to get status icon and color
    const getStatusDisplay = (status?: string) => {
        if (!status) return { icon: AlertCircle, color: "text-gray-500", bg: "bg-gray-100", dotColor: "bg-gray-400", shouldAnimate: false };

        switch (status.toUpperCase()) {
            case 'UP':
                return { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", dotColor: "bg-green-500", shouldAnimate: true };
            case 'DOWN':
                return { icon: XCircle, color: "text-red-600", bg: "bg-red-50", dotColor: "bg-red-500", shouldAnimate: true };
            default:
                return { icon: AlertCircle, color: "text-yellow-600", bg: "bg-yellow-50", dotColor: "bg-yellow-500", shouldAnimate: false };
        }
    };

    // Helper component for status indicator dot
    const StatusDot = ({ status }: { status?: string }) => {
        const { dotColor, shouldAnimate } = getStatusDisplay(status);
        return (
            <span className="relative flex h-2 w-2">
                {shouldAnimate && (
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75`}></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
            </span>
        );
    };

    return (
        <div style={{ paddingLeft }}>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-2">
                            {(hasComponents || hasDetails) && (
                                isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className="text-sm font-medium">{name}</span>
                            {data.description && (
                                <span className="text-xs text-muted-foreground italic">- {data.description}</span>
                            )}
                        </div>
                        <StatusDot status={data.status} />
                    </div>
                </CollapsibleTrigger>

                {(hasComponents || hasDetails) && (
                    <CollapsibleContent className="mt-1 space-y-1">
                        {/* Render details if present */}
                        {hasDetails && (
                            <div className="ml-6 space-y-1">
                                {Object.entries(data.details).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/30 text-xs">
                                        <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <span className="font-mono font-medium">
                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {hasComponents && (
                            <div className="space-y-1">
                                {Object.entries(data.components).map(([componentName, componentData]: [string, any]) => (
                                    <NestedHealthComponent
                                        key={componentName}
                                        name={componentName}
                                        data={componentData}
                                        level={level + 1}
                                    />
                                ))}
                            </div>
                        )}
                    </CollapsibleContent>
                )}
            </Collapsible>
        </div>
    );
};

// Helper component for status indicator dot (used in main component)
const StatusDot = ({ status }: { status?: string }) => {
    const getStatusDisplay = (status?: string) => {
        if (!status) return { dotColor: "bg-gray-400", shouldAnimate: false };

        switch (status.toUpperCase()) {
            case 'UP':
                return { dotColor: "bg-green-500", shouldAnimate: true };
            case 'DOWN':
                return { dotColor: "bg-red-500", shouldAnimate: true };
            default:
                return { dotColor: "bg-yellow-500", shouldAnimate: false };
        }
    };

    const { dotColor, shouldAnimate } = getStatusDisplay(status);
    return (
        <span className="relative flex h-2 w-2">
            {shouldAnimate && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75`}></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
        </span>
    );
};

export function ComponentViewOverview({
    component,
    selectedLandscape,
    selectedApiLandscape,
    healthData,
    healthLoading,
    healthError,
    responseTime,
    statusCode,
    sonarData,
    sonarLoading
}: ComponentViewOverviewProps) {
    // Extract health URL opening logic to a separate function
    const handleHealthButtonClick = () => {
        if (!component || !selectedApiLandscape) return;
        
        const subdomain = component.metadata?.subdomain;
        
        // Create LandscapeConfig object from selectedApiLandscape
        const landscapeConfig = {
            name: selectedApiLandscape.name,
            route: selectedApiLandscape.domain || selectedApiLandscape.route || 'sap.hana.ondemand.com'
        };
        
        // Use existing functions from healthApi.ts
        const healthUrl = subdomain && typeof subdomain === 'string'
            ? buildHealthEndpointWithSubdomain(component, landscapeConfig, subdomain)
            : buildHealthEndpoint(component, landscapeConfig);
        
        window.open(healthUrl, '_blank');
    };
    
    if (!component) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Component not found</p>
            </div>
        );
    }

    if (!selectedLandscape || !selectedApiLandscape) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Please select a landscape to view component health data</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Header Section */}
            <div className="space-y-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        {/* Component Type based on is-library property */}
                        <div className="mt-2">
                            <Badge variant="secondary" className="text-xs">
                                {component['is-library'] ? 'Library' : 'API Service'}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {selectedApiLandscape && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleHealthButtonClick}
                            >
                                <Heart className="h-3 w-3 mr-1" />
                                Health
                            </Button>
                        )}
                        {component.github && component.github !== '#' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(component.github, '_blank')}
                            >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                GitHub
                            </Button>
                        )}
                        {component.sonar && component.sonar !== '#' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(component.sonar, '_blank')}
                            >
                                <Shield className="h-3 w-3 mr-1" />
                                SonarQube
                            </Button>
                        )}
                    </div>
                </div>

                {/* Metadata Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">{selectedApiLandscape.name}</Badge>
                    {healthLoading ? (
                        <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1 animate-spin" />
                            Loading...
                        </Badge>
                    ) : healthData ? (
                        <Badge variant="outline" className="flex items-center gap-1.5">
                            <StatusDot status={healthData.status} />
                            <span className="text-xs font-medium">Health</span>
                        </Badge>
                    ) : healthError ? (
                        <Badge variant="outline" className="flex items-center gap-1.5 bg-red-50 border-red-200">
                            <StatusDot status="DOWN" />
                            <span className="text-xs font-medium text-red-600">Health Error</span>
                        </Badge>
                    ) : null}
                    {responseTime !== null && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-0">
                            <Clock className="h-3 w-3 mr-1" />
                            Response: {responseTime.toFixed(2)}ms
                        </Badge>
                    )}
                    {statusCode !== null && (
                        <Badge variant="outline" className={statusCode === 200 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}>
                            Status Code: {statusCode}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Error Display */}
            {healthError && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-red-600">
                            <XCircle className="h-5 w-5" />
                            <span className="font-medium">Failed to fetch health data: {healthError}</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main Content Grid */}
            {healthData && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Activity className="h-4 w-4" />
                                    Component Health
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {healthData.components?.ping && (
                                    <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="text-sm">Ping</span>
                                        </div>
                                        <StatusDot status={healthData.components.ping.status} />
                                    </div>
                                )}

                                {/* Scheduler */}
                                {healthData.components?.FetchAndRunJobsScheduler && (
                                    <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="text-sm">Jobs Scheduler</span>
                                        </div>
                                        <StatusDot status={healthData.components.FetchAndRunJobsScheduler.status} />
                                    </div>
                                )}

                                {/* Startup */}
                                {healthData.components?.startup && (
                                    <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="text-sm">Startup</span>
                                        </div>
                                        <StatusDot status={healthData.components.startup.status} />
                                    </div>
                                )}

                                {healthData.components?.discoveryComposite && (
                                    <NestedHealthComponent
                                        name="Discovery Composite"
                                        data={healthData.components.discoveryComposite}
                                    />
                                )}

                                {healthData.components?.reactiveDiscoveryClients && (
                                    <NestedHealthComponent
                                        name="Reactive Discovery Clients"
                                        data={healthData.components.reactiveDiscoveryClients}
                                    />
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Server className="h-4 w-4" />
                                    Infrastructure
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {healthData.components?.db && (
                                    <div>
                                        <Collapsible defaultOpen={true}>
                                            <CollapsibleTrigger className="w-full">
                                                <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                                                    <div className="flex items-center gap-2">
                                                        <Database className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span className="text-sm">Database</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <StatusDot status={healthData.components.db.status} />
                                                        {healthData.components.db.details && (
                                                            <Info className="h-3 w-3 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                </div>
                                            </CollapsibleTrigger>
                                            {healthData.components.db.details && (
                                                <CollapsibleContent className="mt-1">
                                                    <div className="ml-6 space-y-1">
                                                        {Object.entries(healthData.components.db.details).map(([key, value]) => (
                                                            <div key={key} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/30 text-xs">
                                                                <span className="text-muted-foreground capitalize">
                                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                                </span>
                                                                <span className="font-mono font-medium">
                                                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CollapsibleContent>
                                            )}
                                        </Collapsible>
                                    </div>
                                )}
                                {healthData.components?.kafka && (
                                    <NestedHealthComponent
                                        name="Kafka"
                                        data={healthData.components.kafka}
                                    />
                                )}
                                {healthData.components?.redis && (
                                    <div>
                                        <Collapsible defaultOpen={true}>
                                            <CollapsibleTrigger className="w-full">
                                                <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                                                    <div className="flex items-center gap-2">
                                                        <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span className="text-sm">Redis</span>
                                                        {healthData.components.redis.details?.version && (
                                                            <span className="text-xs text-muted-foreground">v{healthData.components.redis.details.version}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <StatusDot status={healthData.components.redis.status} />
                                                        {healthData.components.redis.details && Object.keys(healthData.components.redis.details).length > 1 && (
                                                            <Info className="h-3 w-3 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                </div>
                                            </CollapsibleTrigger>
                                            {healthData.components.redis.details && Object.keys(healthData.components.redis.details).length > 1 && (
                                                <CollapsibleContent className="mt-1">
                                                    <div className="ml-6 space-y-1">
                                                        {Object.entries(healthData.components.redis.details)
                                                            .filter(([key]) => key !== 'version') // Version already shown in header
                                                            .map(([key, value]) => (
                                                                <div key={key} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/30 text-xs">
                                                                    <span className="text-muted-foreground capitalize">
                                                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                                                    </span>
                                                                    <span className="font-mono font-medium">
                                                                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </CollapsibleContent>
                                            )}
                                        </Collapsible>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Code Quality Metrics */}
                        {sonarData && !sonarLoading && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <Shield className="h-4 w-4" />
                                        Code Quality
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {/* Coverage */}
                                    <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card">
                                        <span className="text-sm">Coverage</span>
                                        <span className="text-sm font-semibold text-green-600">
                                            {sonarData.coverage !== null ? `${sonarData.coverage.toFixed(1)}%` : 'N/A'}
                                        </span>
                                    </div>

                                    {/* Vulnerabilities */}
                                    <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card">
                                        <span className="text-sm">Vulnerabilities</span>
                                        <span className={`text-sm font-semibold ${sonarData.vulnerabilities === 0 ? 'text-green-600' : sonarData.vulnerabilities && sonarData.vulnerabilities > 5 ? 'text-red-600' : 'text-yellow-600'}`}>
                                            {sonarData.vulnerabilities !== null ? sonarData.vulnerabilities : 'N/A'}
                                        </span>
                                    </div>

                                    {/* Code Smells */}
                                    <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card">
                                        <span className="text-sm">Code Smells</span>
                                        <span className={`text-sm font-semibold ${sonarData.codeSmells === 0 ? 'text-green-600' : sonarData.codeSmells && sonarData.codeSmells > 20 ? 'text-red-600' : 'text-yellow-600'}`}>
                                            {sonarData.codeSmells !== null ? sonarData.codeSmells : 'N/A'}
                                        </span>
                                    </div>

                                    {/* Quality Gate */}
                                    <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card">
                                        <span className="text-sm">Quality Gate</span>
                                        <span className={`text-sm font-semibold ${sonarData.qualityGate === 'Passed' ? 'text-green-600' : 'text-red-600'}`}>
                                            {sonarData.qualityGate || 'N/A'}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Circuit Breakers - Full Width Below */}
                    {healthData.components?.circuitBreakers && (
                        <CircuitBreakerSection circuitBreakers={healthData.components.circuitBreakers} />
                    )}
                </div>
            )}
        </div>
    );
}
