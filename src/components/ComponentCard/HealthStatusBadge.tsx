import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useComponentHealth } from "@/hooks/api/useComponentHealth";
import { Component } from "@/types/api";
import { useComponentDisplay } from "@/contexts/ComponentDisplayContext";

interface HealthStatusBadgeProps {
  component: Component;
  isDisabled: boolean;
}

export function HealthStatusBadge({ 
  component, 
  isDisabled 
}: HealthStatusBadgeProps) {
  const { selectedLandscape } = useComponentDisplay();
  const { data: componentHealthResult, isLoading: isLoadingComponentHealth } = useComponentHealth(
    component.id,
    selectedLandscape,
    component.health ?? false
  );

  if (!selectedLandscape || isDisabled) {
    return null;
  }

  // Check if component has health field set to true
  if (component.health !== true) {
    return null;
  }

  // Show loading state while fetching health data
  if (isLoadingComponentHealth) {
    return (
      <Badge variant="outline" className="inline-flex items-center gap-1 text-xs px-2 py-0.5 w-fit border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Checking</span>
      </Badge>
    );
  }

  // If no health check data available, don't show badge
  if (!componentHealthResult) {
    return null;
  }

  const status = componentHealthResult?.status;

  // Render appropriate badge based on health status
  switch (status) {
    case 'success':
      return (
        <Badge variant="outline" className="inline-flex items-center gap-1 text-xs px-2 py-0.5 w-fit border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span>UP</span>
        </Badge>
      );
    case 'error':
      return (
        <Badge variant="outline" className="inline-flex items-center gap-1 text-xs px-2 py-0.5 w-fit border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 dark:border-red-800">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <span>DOWN</span>
        </Badge>
      );
    default:
      return null;
  }
}
