import { AlertCircle } from "lucide-react";
import type { Component } from "@/types/api";
import type { HealthResponse } from "@/types/health";
import { CircuitBreakerSection } from "@/components/CircuitBreakerSection";
import { ComponentHeader } from "./ComponentView/ComponentHeader";
import { HealthErrorDisplay } from "./ComponentView/HealthErrorDisplay";
import { ComponentHealthCard } from "./ComponentView/ComponentHealthCard";
import { InfrastructureCard } from "./ComponentView/InfrastructureCard";
import { CodeQualityCard } from "./ComponentView/CodeQualityCard";

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
    noCentralLandscapes: boolean;
    projectName: string | null;
}


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
    sonarLoading,
    projectName
}: ComponentViewOverviewProps) {
    // Health button functionality removed since direct health endpoint access is no longer available
    const handleHealthButtonClick = () => {        
        window.open(healthData?.healthURL, '_blank');
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
            <ComponentHeader
                component={component}
                selectedApiLandscape={selectedApiLandscape}
                healthData={healthData}
                healthLoading={healthLoading}
                healthError={healthError}
                responseTime={responseTime}
                statusCode={statusCode}
                onHealthButtonClick={handleHealthButtonClick}
            />

            {/* Error Display */}
            {healthError && <HealthErrorDisplay healthError={healthError} />}

            {/* Main Content Grid */}
            {healthData && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Component Health and Infrastructure blocks - only show for cis20 project */}
                        {projectName === 'cis20' && (
                            <>
                                <ComponentHealthCard healthData={healthData} />
                                <InfrastructureCard healthData={healthData} />
                            </>
                        )}

                        {/* Code Quality Metrics */}
                        {sonarData && !sonarLoading && (
                            <CodeQualityCard sonarData={sonarData} />
                        )}
                    </div>

                    {/* Circuit Breakers - Full Width Below */}
                    {healthData.details.components?.circuitBreakers && (
                        <CircuitBreakerSection circuitBreakers={healthData.details.components.circuitBreakers} />
                    )}
                </div>
            )}
        </div>
    );
}
