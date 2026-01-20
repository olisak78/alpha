import { Card, CardContent } from "@/components/ui/card";
import { Component } from "@/types/api";
import { cn } from "@/lib/utils";
import { ComponentHeader } from "./ComponentCard/ComponentHeader";
import { ActionButtons } from "./ComponentCard/ActionButtons";
import { QualityMetricsGrid } from "./ComponentCard/QualityMetricsGrid";
import { useComponentDisplay } from "@/contexts/ComponentDisplayContext";
import { toast } from "@/hooks/use-toast";

interface ComponentCardProps {
  component: Component;
  onClick?: () => void;
}

export default function ComponentCard({
  component,
  onClick,
}: ComponentCardProps) {
  const {
    isCentralLandscape,
    noCentralLandscapes,
    teamNamesMap,
    teamColorsMap,
    componentHealthMap,
    componentSystemInfoMap,
    isLoadingSystemInfo,
  } = useComponentDisplay();

  // Get team info from context
  const teamName = component.owner_id ? teamNamesMap[component.owner_id] : undefined;
  const teamColor = component.owner_id ? teamColorsMap[component.owner_id] : undefined;
  const healthCheck = componentHealthMap[component.id];
  const systemInfo = componentSystemInfoMap[component.id] || null;
  const isDisabled = component['central-service'] === true && !isCentralLandscape && !noCentralLandscapes;
  const isClickable = onClick && component.health === true; // Only clickable when health is true

  // Handle card click - only navigate if not clicking on buttons
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if(!isClickable){
      toast({
        title: "No component page available",
        variant: "destructive",
      });
      return;
    }

    if (!target.closest('button') && !target.closest('a') && onClick) {
      onClick();
    }
  };

  return (
    <Card 
      style={isClickable ? { cursor: 'pointer' } : undefined}
      onClick={handleCardClick} 
      className={cn(
        "group transition-all duration-200 border-border/60",
        isDisabled && "border-gray-300 dark:border-gray-600 bg-muted/50",
        !isDisabled && !healthCheck?.response?.healthy,
        !isDisabled && "hover:shadow-lg hover:border-border"
      )}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className={cn(
          isDisabled && "opacity-50"
        )}>
          <ComponentHeader
            component={component}
            teamName={teamName}
            teamColor={teamColor}
            systemInfo={systemInfo}
            loadingSystemInfo={isLoadingSystemInfo}
            isDisabled={isDisabled}
          />
        </div>

        {/* Action Buttons */}
        <ActionButtons component={component} />

        {/* Quality Metrics Grid */}
        <div className={cn(
          isDisabled && "opacity-50"
        )}>
          <QualityMetricsGrid component={component} />
        </div>
      </CardContent>
    </Card>
  );
}
