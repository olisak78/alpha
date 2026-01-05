import { Activity, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HealthResponse } from "@/types/health";
import { StatusDot } from "./StatusDot";
import { NestedHealthComponent } from "./NestedHealthComponent";

interface ComponentHealthCardProps {
    healthData: HealthResponse;
}

export function ComponentHealthCard({ healthData }: ComponentHealthCardProps) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Component Health
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {healthData.details.components?.ping && (
                    <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-2">
                            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">Ping</span>
                        </div>
                        <StatusDot status={healthData.details.components.ping.status} />
                    </div>
                )}

                {/* Scheduler */}
                {healthData.details.components?.FetchAndRunJobsScheduler && (
                    <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-2">
                            <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">Jobs Scheduler</span>
                        </div>
                        <StatusDot status={healthData.details.components.FetchAndRunJobsScheduler.status} />
                    </div>
                )}

                {/* Startup */}
                {healthData.details.components?.startup && (
                    <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-2">
                            <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">Startup</span>
                        </div>
                        <StatusDot status={healthData.details.components.startup.status} />
                    </div>
                )}

                {healthData.details.components?.discoveryComposite && (
                    <NestedHealthComponent
                        name="Discovery Composite"
                        data={healthData.details.components.discoveryComposite}
                    />
                )}

                {healthData.details.components?.reactiveDiscoveryClients && (
                    <NestedHealthComponent
                        name="Reactive Discovery Clients"
                        data={healthData.details.components.reactiveDiscoveryClients}
                    />
                )}
            </CardContent>
        </Card>
    );
}
