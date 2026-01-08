import { useEffect, useRef, useState } from "react";
import { Loader2, Code2, ExternalLink, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { SwaggerUIResponse } from "@/hooks/api/useSwaggerUI";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import "rapidoc";

const RapiDoc: any = 'rapi-doc';

interface ComponentViewApiProps {
    isLoading: boolean;
    error: Error | null;
    swaggerData: SwaggerUIResponse | undefined;
}

export function ComponentViewApi({ isLoading, error, swaggerData }: ComponentViewApiProps) {
    const [useRapiDoc, setUseRapiDoc] = useState(false);
    const rapiDocRef = useRef<any>(null);

    // Update RapiDoc spec when swaggerData changes
    useEffect(() => {
        if (rapiDocRef.current && swaggerData?.schema && useRapiDoc) {
            rapiDocRef.current.loadSpec(swaggerData.schema);
        }
    }, [swaggerData, useRapiDoc]);

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading API documentation...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !swaggerData) {
        return (
            <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        <span className="text-yellow-900">API Documentation Not Available</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-yellow-800">
                        {error ? error.message : 'Unable to load API documentation for this component.'}
                    </p>
                </CardContent>
            </Card>
        );
    }

    const { schema, swaggerUiUrl } = swaggerData;

    return (
        <div className="space-y-4">
            {/* Header Card with Info, Viewer Toggle, and Action Button */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Code2 className="h-5 w-5" />
                                {schema.info?.title || 'API Documentation'}
                            </CardTitle>
                            {schema.info?.version && (
                                <p className="text-sm text-muted-foreground mt-1">Version {schema.info.version}</p>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Viewer Toggle */}
                            <div className="flex items-center gap-2">
                               <Label
                                    onClick={() => setUseRapiDoc(false)}
                                    className={`text-sm font-medium cursor-pointer transition-colors ${!useRapiDoc ? 'text-foreground' : 'text-muted-foreground'
                                        }`}
                                >
                                    Swagger UI
                                </Label>
                                <Switch
                                    id="viewer-toggle"
                                    checked={useRapiDoc}
                                    onCheckedChange={setUseRapiDoc}
                                    className="data-[state=unchecked]:bg-green-500"
                                />
                                <Label
                                    onClick={() => setUseRapiDoc(true)}
                                    className={`text-sm font-medium cursor-pointer transition-colors ${useRapiDoc ? 'text-foreground' : 'text-muted-foreground'
                                        }`}
                                >
                                    RapiDoc
                                </Label>
                            </div>

                            {/* Open in New Tab Button */}
                            {swaggerUiUrl && (
                                <Button
                                    onClick={() => window.open(swaggerUiUrl, '_blank')}
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Open in New Tab
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Conditional Rendering: RapiDoc or Swagger UI */}
            {useRapiDoc ? (
                <div className="rapidoc-container">
                    <RapiDoc
                        ref={rapiDocRef}
                        spec={JSON.stringify(schema)}
                        theme="light"
                        render-style="read"
                        show-header="false"
                        allow-try="true"
                        allow-server-selection="true"
                        allow-authentication="true"
                        default-schema-tab="model"
                        schema-style="tree"
                        schema-expand-level="1"
                        schema-description-expanded="true"
                        api-key-name="Authorization"
                        api-key-location="header"
                        api-key-value=""
                        layout="row"
                        sort-tags="true"
                        sort-endpoints-by="path"
                        primary-color="#2563eb"
                        bg-color="#ffffff"
                        text-color="#1f2937"
                        header-color="#1f2937"
                        nav-bg-color="#f9fafb"
                        nav-text-color="#374151"
                        nav-hover-bg-color="#e5e7eb"
                        nav-hover-text-color="#111827"
                        nav-accent-color="#2563eb"
                        font-size="default"
                    />
                </div>
            ) : (
                <div className="swagger-ui-container">
                    <SwaggerUI spec={schema} />
                </div>
            )}
        </div>
    );
}
