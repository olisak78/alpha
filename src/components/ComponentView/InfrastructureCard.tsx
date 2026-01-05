import { Server, Database, HardDrive, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { HealthResponse } from "@/types/health";
import { StatusDot } from "./StatusDot";
import { NestedHealthComponent } from "./NestedHealthComponent";

interface InfrastructureCardProps {
    healthData: HealthResponse;
}

export function InfrastructureCard({ healthData }: InfrastructureCardProps) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Infrastructure
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {healthData.details.components?.db && (
                    <div>
                        <Collapsible defaultOpen={true}>
                            <CollapsibleTrigger className="w-full">
                                <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <Database className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-sm">Database</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <StatusDot status={healthData.details.components.db.status} />
                                        {healthData.details.components.db.details && (
                                            <Info className="h-3 w-3 text-muted-foreground" />
                                        )}
                                    </div>
                                </div>
                            </CollapsibleTrigger>
                            {healthData.details.components.db.details && (
                                <CollapsibleContent className="mt-1">
                                    <div className="ml-6 space-y-1">
                                        {Object.entries(healthData.details.components.db.details).map(([key, value]) => (
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
                {healthData.details.components?.kafka && (
                    <NestedHealthComponent
                        name="Kafka"
                        data={healthData.details.components.kafka}
                    />
                )}
                {healthData.details.components?.redis && (
                    <div>
                        <Collapsible defaultOpen={true}>
                            <CollapsibleTrigger className="w-full">
                                <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-sm">Redis</span>
                                        {healthData.details.components.redis.details?.version && (
                                            <span className="text-xs text-muted-foreground">v{healthData.details.components.redis.details.version}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <StatusDot status={healthData.details.components.redis.status} />
                                        {healthData.details.components.redis.details && Object.keys(healthData.details.components.redis.details).length > 1 && (
                                            <Info className="h-3 w-3 text-muted-foreground" />
                                        )}
                                    </div>
                                </div>
                            </CollapsibleTrigger>
                            {healthData.details.components.redis.details && Object.keys(healthData.details.components.redis.details).length > 1 && (
                                <CollapsibleContent className="mt-1">
                                    <div className="ml-6 space-y-1">
                                        {Object.entries(healthData.details.components.redis.details)
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
    );
}
