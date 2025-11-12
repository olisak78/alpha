import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import accountsSpec from "@/data/apis/accounts-service.json";

interface ApiTabProps {
  componentId: string | null;
  componentName?: string;
  swaggerUrl?: string;
}

const ApiTab: React.FC<ApiTabProps> = ({ componentId, componentName, swaggerUrl }) => {
  // Use Accounts spec as a placeholder and swap the host to match the component
  const buildSpecFor = (id: string) => {
    try {
      const raw = JSON.stringify(accountsSpec);
      const swapped = raw.replace(/accounts-service/g, id);
      return JSON.parse(swapped);
    } catch (e) {
      console.error("Failed to build spec for component:", id, e);
      return accountsSpec as any;
    }
  };

  const spec = componentId ? buildSpecFor(componentId) : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">API Documentation{componentName ? ` — ${componentName}` : ""}</CardTitle>
          {swaggerUrl && (
            <Button asChild variant="outline" size="sm">
              <a href={swaggerUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Swagger
              </a>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {spec ? (
            <div className="rounded-md border overflow-hidden bg-background">
              {/* <SwaggerUI spec={spec as any} docExpansion="list" defaultModelExpandDepth={1} defaultModelsExpandDepth={1} /> */}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No OpenAPI spec available for this component yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiTab;
