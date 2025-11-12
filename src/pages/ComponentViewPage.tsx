import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { ExternalLink, Activity, Database, AlertCircle, CheckCircle, XCircle, Clock, Shield, Zap, Server, HardDrive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BreadcrumbPage } from "@/components/BreadcrumbPage";
import { useComponentsByProject } from "@/hooks/api/useComponents";
import { useLandscapesByProject } from "@/hooks/api/useLandscapes";
import { usePortalState } from "@/contexts/hooks";
import { useLandscapeManagement } from "@/contexts/hooks";
import { fetchHealthStatus, buildHealthEndpoint } from "@/services/healthApi";
import { useSonarMeasures } from "@/hooks/api/useSonarMeasures";
import type { Component } from "@/types/api";
import type { HealthResponse, ComponentHealth } from "@/types/health";
import { CircuitBreakerSection } from "@/components/CircuitBreakerSection";


export function ComponentViewPage() {
    const { componentId, tabId } = useParams<{ componentId: string; tabId?: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState("overview");
    const { selectedLandscape, setSelectedLandscape, setShowLandscapeDetails } = usePortalState();
    const { getLandscapeGroups } = useLandscapeManagement();

    // Get system from URL (cis, unified-services, etc.)
    const system = location.pathname.split('/')[1] || 'cis';
    const projectName = system === 'cis' ? 'cis20' : system === 'unified-services' ? 'usrv' : 'ca';
    const activeProject = system === 'cis' ? 'CIS@2.0' : system === 'unified-services' ? 'Unified Services' : 'Cloud Automation';

    // Fetch components and landscapes
    const { data: components } = useComponentsByProject(projectName);
    const { data: apiLandscapes } = useLandscapesByProject(projectName);

    // Find the current component
    const component = components?.find((c: Component) => c.name === componentId);

    // Get landscape groups from context (returns Record<string, Landscape[]>)
    const landscapeGroups = getLandscapeGroups(activeProject);

    // Find the selected landscape from API data
    const selectedApiLandscape = useMemo(() => {
        return apiLandscapes?.find((l: any) => l.id === selectedLandscape);
    }, [apiLandscapes, selectedLandscape]);

    // State for health data
    const [healthData, setHealthData] = useState<HealthResponse | null>(null);
    const [healthLoading, setHealthLoading] = useState(false);
    const [healthError, setHealthError] = useState<string | null>(null);
    const [responseTime, setResponseTime] = useState<number | null>(null);
    const [statusCode, setStatusCode] = useState<number | null>(null);

    // Fetch Sonar measures
    const { data: sonarData, isLoading: sonarLoading } = useSonarMeasures(
        component?.sonar || null,
        true
    );

    // Sync tab with URL parameter
    useEffect(() => {
        if (tabId && (tabId === 'overview' || tabId === 'api')) {
            setActiveTab(tabId);
        } else if (!tabId) {
            setActiveTab('overview');
        }
    }, [tabId]);

    // Fetch health data when component or landscape changes
    useEffect(() => {
        if (!component || !selectedApiLandscape) {
            setHealthData(null);
            return;
        }

        const fetchHealth = async () => {
            setHealthLoading(true);
            setHealthError(null);

            try {
                const healthUrl = buildHealthEndpoint(component, {
                    name: selectedApiLandscape.name,
                    route: (selectedApiLandscape as any).landscape_url || (selectedApiLandscape as any).domain || 'sap.hana.ondemand.com',
                });

                const result = await fetchHealthStatus(healthUrl);

                if (result.status === 'success' && result.data) {
                    setHealthData(result.data);
                    setResponseTime(result.responseTime || null);
                    setStatusCode((result.data as any).statusCode || 200);
                } else {
                    setHealthError(result.error || 'Failed to fetch health data');
                    setStatusCode((result as any).statusCode || null);
                }
            } catch (error) {
                setHealthError(error instanceof Error ? error.message : 'Unknown error');
            } finally {
                setHealthLoading(false);
            }
        };

        fetchHealth();
    }, [component, selectedApiLandscape]);

    // Update URL when tab changes
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        navigate(`/${system}/component/${componentId}/${value}`, { replace: true });
    };

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

    const renderOverviewTab = () => {
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
                            <h1 className="text-3xl font-bold">{component.title || component.name}</h1>
                            <p className="text-muted-foreground mt-1">{component.description}</p>

                            {/* Component Type based on metadata */}
                            <div className="mt-2">
                                {component.metadata?.isLibrary === true ? (
                                    <Badge variant="secondary" className="text-xs">
                                        Library
                                    </Badge>
                                ) : component.metadata?.isLibrary === false ? (
                                    <Badge variant="secondary" className="text-xs">
                                        API Service
                                    </Badge>
                                ) : null}
                            </div>
                        </div>
                        <div className="flex gap-2">
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
                        {/* Top Row: Component Health, Infrastructure, Code Quality - All Same Size */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Component Health Status */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <Activity className="h-4 w-4" />
                                        Component Health
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
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

                                    {/* Discovery Composite */}
                                    {healthData.components?.discoveryComposite && (
                                        <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                                            <span className="text-sm">Discovery Composite</span>
                                            <StatusDot status={healthData.components.discoveryComposite.status} />
                                        </div>
                                    )}

                                    {/* Reactive Discovery Clients */}
                                    {healthData.components?.reactiveDiscoveryClients && (
                                        <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                                            <span className="text-sm">Discovery Clients</span>
                                            <StatusDot status={healthData.components.reactiveDiscoveryClients.status} />
                                        </div>
                                    )}

                                    {/* Startup */}
                                    {healthData.components?.startup && (
                                        <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                                            <span className="text-sm">Startup</span>
                                            <StatusDot status={healthData.components.startup.status} />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Infrastructure Health */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <Server className="h-4 w-4" />
                                        Infrastructure
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {/* Database */}
                                    {healthData.components?.db && (
                                        <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <Database className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="text-sm">Database</span>
                                            </div>
                                            <StatusDot status={healthData.components.db.status} />
                                        </div>
                                    )}

                                    {/* Kafka */}
                                    {healthData.components?.kafka && (
                                        <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                                            <span className="text-sm">Kafka</span>
                                            <StatusDot status={healthData.components.kafka.status} />
                                        </div>
                                    )}

                                    {/* Redis */}
                                    {healthData.components?.redis && (
                                        <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="text-sm">Redis</span>
                                                {healthData.components.redis.details?.version && (
                                                    <span className="text-xs text-muted-foreground">v{healthData.components.redis.details.version}</span>
                                                )}
                                            </div>
                                            <StatusDot status={healthData.components.redis.status} />
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
    };

    const renderAPITab = () => (
        <div className="space-y-6 pb-8">
            <Card>
                <CardHeader>
                    <CardTitle>API Documentation</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        API documentation will be displayed here. You can integrate Swagger UI or other API documentation tools.
                    </p>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <BreadcrumbPage>
            <div className="space-y-6">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="api">API</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-6">
                        {renderOverviewTab()}
                    </TabsContent>

                    <TabsContent value="api" className="mt-6">
                        {renderAPITab()}
                    </TabsContent>
                </Tabs>
            </div>
        </BreadcrumbPage>
    );
}

export default ComponentViewPage;