import {
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useSonarMeasures } from "@/hooks/api/useSonarMeasures";
import { Component } from "@/types/api";
import { MetricItem } from "./MetricItem";

interface QualityMetricsGridProps {
  component: Component;
}

export function QualityMetricsGrid({ component }: QualityMetricsGridProps) {
  const { data: sonarMetrics, isLoading: sonarLoading } = useSonarMeasures(
    component.sonar || null,
    true
  );

  const formatMetric = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    return value.toString();
  };

  return (
    <div className="grid grid-cols-4 gap-2">
      <MetricItem
        icon={Shield}
        iconColor="text-blue-600"
        value={`${formatMetric(sonarMetrics?.coverage)}%`}
        label="Coverage"
        isLoading={sonarLoading}
      />
      <MetricItem
        icon={AlertTriangle}
        iconColor="text-yellow-600"
        value={formatMetric(sonarMetrics?.vulnerabilities)}
        label="Vulns"
        isLoading={sonarLoading}
      />
      <MetricItem
        icon={Activity}
        iconColor="text-orange-600"
        value={formatMetric(sonarMetrics?.codeSmells ?? null)}
        label="Smells"
        isLoading={sonarLoading}
      />
      <MetricItem
        icon={CheckCircle}
        iconColor={sonarMetrics?.qualityGate === 'Passed' ? 'text-green-600' : 'text-red-500'}
        value={sonarMetrics?.qualityGate ?? 'N/A'}
        label="Gate"
        isLoading={sonarLoading}
      />
    </div>
  );
}
