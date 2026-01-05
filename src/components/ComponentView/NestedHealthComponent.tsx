import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { StatusDot } from "./StatusDot";

interface NestedHealthComponentProps {
    name: string;
    data: any;
    level?: number;
}

export function NestedHealthComponent({ name, data, level = 0 }: NestedHealthComponentProps) {
    const [isOpen, setIsOpen] = useState(true);
    const hasComponents = data.components && Object.keys(data.components).length > 0;
    const hasDetails = data.details && Object.keys(data.details).length > 0;
    const paddingLeft = `${level * 1}rem`;

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
}
