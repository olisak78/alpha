import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BreadcrumbPage } from "@/components/BreadcrumbPage";
import { useComponentsByProject } from "@/hooks/api/useComponents";
import { useLandscapesByProject } from "@/hooks/api/useLandscapes";
import { usePortalState } from "@/contexts/hooks";
import { fetchHealthStatus, buildHealthEndpoint } from "@/services/healthApi";
import { useSonarMeasures } from "@/hooks/api/useSonarMeasures";
import type { Component } from "@/types/api";
import type { HealthResponse } from "@/types/health";
import { useSwaggerUI } from "@/hooks/api/useSwaggerUI";
import { ComponentViewApi } from "@/components/ComponentViewApi";
import { ComponentViewOverview } from "@/components/ComponentViewOverview";

export function ComponentViewPage() {
    const { componentId, tabId } = useParams<{ componentId: string; tabId?: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState("overview");
    const { selectedLandscape } = usePortalState();

    // Get system from URL (cis, unified-services, etc.)
    const system = location.pathname.split('/')[1] || 'cis';
    const projectName = system === 'cis' ? 'cis20' : system === 'unified-services' ? 'usrv' : 'ca';

    // Fetch components and landscapes
    const { data: landscapesData, isLoading: isLoadingLandscapes } = useLandscapesByProject(projectName);

    // Fetch components and landscapes
    const { data: components } = useComponentsByProject(projectName);
    const { data: apiLandscapes } = useLandscapesByProject(projectName);

    // Find the current component
    const component = components?.find((c: Component) => c.name === componentId);

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

    // Find the selected landscape data
    const landscapeConfig = useMemo(() => {
        if (!landscapesData || !selectedLandscape) return null;
        const landscape = landscapesData.find(l => l.id === selectedLandscape);
        if (!landscape) return null;
        return {
            name: landscape.name,
            route: landscape.landscape_url || 'sap.hana.ondemand.com'
        };
    }, [landscapesData, selectedLandscape]);

    // Fetch Swagger data
    const { data: swaggerData, isLoading: isLoadingSwagger, error: swaggerError } = useSwaggerUI(
        component,
        landscapeConfig,
        {
            enabled: activeTab === 'api' && !!component && !!landscapeConfig
        }
    );

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

    return (
        <BreadcrumbPage>
            <div className="space-y-6">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="api">API</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-6">
                        <ComponentViewOverview
                            component={component}
                            selectedLandscape={selectedLandscape}
                            selectedApiLandscape={selectedApiLandscape}
                            healthData={healthData}
                            healthLoading={healthLoading}
                            healthError={healthError}
                            responseTime={responseTime}
                            statusCode={statusCode}
                            sonarData={sonarData}
                            sonarLoading={sonarLoading}
                        />
                    </TabsContent>

                    <TabsContent value="api" className="mt-6">
                        <ComponentViewApi  
                            isLoading={isLoadingSwagger}
                            error={swaggerError}
                            swaggerData={swaggerData}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </BreadcrumbPage>
    );
}

export default ComponentViewPage;