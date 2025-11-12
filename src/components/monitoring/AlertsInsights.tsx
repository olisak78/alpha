import React, { useState } from 'react';
import { InsightsFilters } from './InsightsFilters';
import { TeamPerformanceOverview } from './TeamPerformanceOverview';
import { ComponentAlertActivity } from './ComponentAlertActivity';
import { PerformanceTrends } from './PerformanceTrends';
import { AlertSeverityDistribution } from './AlertSeverityDistribution';
import { FiringPatternsByTime } from './FiringPatternsByTime';
import { ReliabilitySignals } from './ReliabilitySignals';


interface InsightsFiltersType {
    team: string;
    timeRange: string;
    environment: string;
}

export function AlertsInsights() {
    const [filters, setFilters] = useState<InsightsFiltersType>({
        team: 'all',
        timeRange: '30d',
        environment: 'all'
    });

    return (
        <div className="space-y-6">
            {/* Filters */}
            <InsightsFilters filters={filters} onFiltersChange={setFilters} />

            {/* Team Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TeamPerformanceOverview />
                <ComponentAlertActivity />
            </div>

            {/* Performance Trends */}
            <PerformanceTrends />

            {/* Severity Distribution & Firing Patterns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AlertSeverityDistribution />
                <FiringPatternsByTime />
            </div>

            {/* Reliability Signals */}
            <ReliabilitySignals />
        </div>
    );
}