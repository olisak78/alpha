import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { BreadcrumbPage } from "@/components/BreadcrumbPage";
import { useComponentsByProject } from "@/hooks/api/useComponents";
import { useLandscapesByProject } from "@/hooks/api/useLandscapes";
import { usePortalState } from "@/contexts/hooks";
import { useHeaderNavigation } from "@/contexts/HeaderNavigationContext";
import { useSonarMeasures } from "@/hooks/api/useSonarMeasures";
import { useComponentHealth } from "@/hooks/api/useComponentHealth";
import { getDefaultLandscapeId } from "@/services/LandscapesApi";
import type { Component } from "@/types/api";
import { useSwaggerUI } from "@/hooks/api/useSwaggerUI";
import { ComponentViewApi } from "@/components/ComponentViewApi";
import { ComponentViewOverview } from "@/components/ComponentViewOverview";
import { LandscapeFilter } from "@/components/LandscapeFilter";

export function ComponentViewPage() {
    const params = useParams<{ projectName?: string; componentName?: string; componentId?: string; tabId?: string }>();
    const componentName = params.componentName || params.componentId;
    const tabId = params.tabId;
    const navigate = useNavigate();
    const { getSelectedLandscapeForProject, setSelectedLandscapeForProject } = usePortalState();
    const { setTabs, activeTab, setActiveTab } = useHeaderNavigation();

    const projectName = params.projectName || 'cis20';
    
    // Fetch components and landscapes
    const { data: landscapesData, isLoading: isLoadingLandscapes } = useLandscapesByProject(projectName);
    const { data: components } = useComponentsByProject(projectName);
    const { data: apiLandscapes } = useLandscapesByProject(projectName);

    const landscapeGroupsRecord = useMemo(() => {
    if (!apiLandscapes) return {};
    
    // Group landscapes by their group property
    const grouped = apiLandscapes.reduce((acc: Record<string, any[]>, landscape: any) => {
        // You may need to adjust this based on your landscape data structure
        const groupName = landscape.group || 'Default';
        
        if (!acc[groupName]) {
            acc[groupName] = [];
        }
        
        acc[groupName].push({
            id: landscape.id,
            name: landscape.name,
            technical_name: landscape.technical_name,
            status: landscape.status || 'active',
            isCentral: landscape.isCentral || false,
            landscape_url: landscape.landscape_url
        });
        
        return acc;
    }, {});
    
    return grouped;
}, [apiLandscapes]);
    
    // Get project-specific selected landscape (reactive to changes)
    const effectiveSelectedLandscape = useMemo(() => {
        return getSelectedLandscapeForProject(projectName);
    }, [getSelectedLandscapeForProject, projectName]);

    const component = components?.find((c: Component) => c.name === componentName);


    // Find the selected landscape from API data
    const selectedApiLandscape = useMemo(() => {
        return apiLandscapes?.find((l: any) => l.id === effectiveSelectedLandscape);
    }, [apiLandscapes, effectiveSelectedLandscape]);

    // Calculate if component doesn't exist (central service not in central landscape)
    const isCentralLandscape = useMemo(() => {
        return selectedApiLandscape?.isCentral ?? false;
    }, [selectedApiLandscape]);

    // Check if there are no central landscapes available
    const noCentralLandscapes = useMemo(() => {
        if (!apiLandscapes || apiLandscapes.length === 0) return true;
        return !apiLandscapes.some((landscape: any) => landscape.isCentral === true);
    }, [apiLandscapes]);

    const isExistInLandscape = useMemo(() => {
        return component?.['central-service'] !== true || isCentralLandscape;
    }, [component, isCentralLandscape]);


    // Find the selected landscape data
    const landscapeConfig = useMemo(() => {
        if (!landscapesData || !effectiveSelectedLandscape) return null;
        const landscape = landscapesData.find(l => l.id === effectiveSelectedLandscape);
        if (!landscape) return null;
        return {
            id: effectiveSelectedLandscape,
            name: landscape.name,
            route: landscape.landscape_url || 'sap.hana.ondemand.com'
        };
    }, [landscapesData, effectiveSelectedLandscape]);

    // Use React Query hook for health data
    const {
        data: healthResult,
        isLoading: healthLoading,
        isError: healthHasError,
        error: healthQueryError
    } = useComponentHealth(
        component?.id,
        effectiveSelectedLandscape,
        component?.health === true,
        {
            enabled: !!component && !!effectiveSelectedLandscape && isExistInLandscape
        }
    );

    // Extract health data from the hook result
    const healthData = healthResult?.data || null;
    const healthError = healthHasError ? (healthQueryError?.message || healthResult?.error || 'Failed to fetch health data') : null;
    const responseTime = healthResult?.responseTime || null;
    const statusCode = healthResult?.status === 'error' ? 500 : (healthData ? 200 : null);

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

    // Set up header navigation tabs
    useEffect(() => {
        setTabs([
            { id: 'overview', label: 'Overview' },
            { id: 'api', label: 'API' }
        ]);
    }, []); // Remove setTabs from dependency array to prevent infinite loop

    // Set initial tab from URL
    useEffect(() => {
        if (tabId && ['overview', 'api'].includes(tabId)) {
            setActiveTab(tabId);
        }
    }, [tabId, setActiveTab]);

    // Set default landscape when landscapes are loaded
    useEffect(() => {
        if (apiLandscapes && apiLandscapes.length > 0) {
            // Check if the currently selected landscape is valid for this project
            const isSelectedLandscapeValid = effectiveSelectedLandscape && 
                apiLandscapes.some(landscape => landscape.id === effectiveSelectedLandscape);
            
            // If no landscape is selected or the selected one is invalid for this project,
            // set a default landscape
            if (!isSelectedLandscapeValid) {
                const defaultLandscapeId = getDefaultLandscapeId(apiLandscapes, projectName);
                if (defaultLandscapeId) {
                    setSelectedLandscapeForProject(projectName, defaultLandscapeId);
                }
            }
        }
    }, [apiLandscapes, effectiveSelectedLandscape, setSelectedLandscapeForProject, projectName]);


    // Handle error states after all hooks are called
    if (!component) {
        return (
            <BreadcrumbPage>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold mb-2">Component not found</h2>
                        <p className="text-muted-foreground mb-4">
                            The component "{componentName}" does not exist in this project.
                        </p>
                        <button
                            onClick={() => navigate(-1)}
                            className="text-primary hover:underline"
                        >
                            Go back
                        </button>
                    </div>
                </div>
            </BreadcrumbPage>
        );
    }

    return (
        <BreadcrumbPage>
        {/* Back to Components Link */}
        <div className="mb-4">
            <button
                onClick={() => navigate(`/${projectName}/components`)}
                className="text-primary hover:underline text-sm flex items-center gap-1"
            >
                ← Back to Components
            </button>
        </div>
        
        {/* Landscape Filter Section - Always displayed */}
        <div className="mb-6">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold text-foreground">
                    {component?.title || component?.name || 'Component'}
                </h1>
                <div className="flex items-center gap-2">
                    <LandscapeFilter
                        selectedLandscape={effectiveSelectedLandscape}
                        landscapeGroups={landscapeGroupsRecord}
                        onLandscapeChange={(landscapeId) => 
                            setSelectedLandscapeForProject(projectName, landscapeId)
                        }
                        onShowLandscapeDetails={() => {
                            // Optional: You can add a modal/dialog to show landscape details
                            // For now, this can be a no-op or navigate somewhere
                        }}
                        showClearButton={false}
                        showViewAllButton={false}
                        projectId={projectName}
                        disableNonCentral={component?.['central-service'] === true}
                    />
                </div>
            </div>
        </div>

        {/* Content Section */}
        {!isExistInLandscape ? (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center max-w-md mx-auto">
                    <h2 className="text-xl font-semibold mb-2 text-foreground">Component not available in this landscape</h2>
                    <p className="text-muted-foreground mb-4">
                        Please choose a landscape where this component exists
                    </p>
                </div>
            </div>
        ) : (
            <div className="space-y-6">
                {activeTab === 'overview' && (
                    <ComponentViewOverview
                        component={component}
                        selectedLandscape={effectiveSelectedLandscape}
                        selectedApiLandscape={selectedApiLandscape}
                        healthData={healthData}
                        healthLoading={healthLoading}
                        healthError={healthError}
                        responseTime={responseTime}
                        statusCode={statusCode}
                        sonarData={sonarData}
                        sonarLoading={sonarLoading}
                        noCentralLandscapes={noCentralLandscapes}
                        projectName={projectName}
                    />
                )}

                {activeTab === 'api' && (
                    <ComponentViewApi
                        isLoading={isLoadingSwagger}
                        error={swaggerError}
                        swaggerData={swaggerData}
                    />
                )}
            </div>
        )}
        </BreadcrumbPage>
    );
}

export default ComponentViewPage;
