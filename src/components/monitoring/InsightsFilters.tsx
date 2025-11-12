import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Filter } from 'lucide-react';
import { mockTeams } from '@/data/monitoring/mock-data';

interface InsightsFilters {
    team: string;
    timeRange: string;
    environment: string;
}

interface InsightsFiltersProps {
    filters: InsightsFilters;
    onFiltersChange: (filters: InsightsFilters) => void;
}

export function InsightsFilters({ filters, onFiltersChange }: InsightsFiltersProps) {
    const updateFilter = (key: keyof InsightsFilters, value: string) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Filters:</span>
                    </div>

                    <div>
                        <Label className="text-xs text-muted-foreground">Team</Label>
                        <Select value={filters.team} onValueChange={(value) => updateFilter('team', value)}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Teams</SelectItem>
                                {mockTeams.map(team => (
                                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label className="text-xs text-muted-foreground">Time Range</Label>
                        <Select value={filters.timeRange} onValueChange={(value) => updateFilter('timeRange', value)}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7d">7 days</SelectItem>
                                <SelectItem value="30d">30 days</SelectItem>
                                <SelectItem value="90d">90 days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label className="text-xs text-muted-foreground">Environment</Label>
                        <Select value={filters.environment} onValueChange={(value) => updateFilter('environment', value)}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="live">Live</SelectItem>
                                <SelectItem value="canary">Canary</SelectItem>
                                <SelectItem value="staging">Staging</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}