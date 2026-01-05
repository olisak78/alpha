import { Heart, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import type { Component } from "@/types/api";
import type { HealthResponse } from "@/types/health";
import { GithubIcon } from "../icons/GithubIcon";
import { StatusDot } from "./StatusDot";

interface ComponentHeaderProps {
    component: Component;
    selectedApiLandscape: any;
    healthData: HealthResponse | null;
    healthLoading: boolean;
    healthError: string | null;
    responseTime: number | null;
    statusCode: number | null;
    onHealthButtonClick: () => void;
}

export function ComponentHeader({
    component,
    selectedApiLandscape,
    healthData,
    healthLoading,
    healthError,
    responseTime,
    statusCode,
    onHealthButtonClick
}: ComponentHeaderProps) {
    return (
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
                            onClick={onHealthButtonClick}
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
                            <GithubIcon className="h-3 w-3 mr-1" />
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
                        <StatusDot status={healthData.healthy} />
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
    );
}
