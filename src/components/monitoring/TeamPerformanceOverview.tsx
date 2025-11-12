import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity } from 'lucide-react';
import { teamStatsData } from '@/data/monitoring/mock-data';

export function TeamPerformanceOverview() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Team Performance Overview
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {teamStatsData.map((team) => (
                        <div key={team.team} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-medium">{team.team}</span>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">{team.activeRules} rules</Badge>
                                    <Badge variant={team.coverage >= 90 ? 'default' : team.coverage >= 75 ? 'secondary' : 'destructive'}>
                                        {team.coverage}% coverage
                                    </Badge>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">MTTR</span>
                                    <span className="font-medium">{team.mttr}m</span>
                                </div>
                                <Progress value={100 - (team.mttr / 30) * 100} className="h-2" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Firing Rate</span>
                                    <span className="font-medium">{team.firingRate}%</span>
                                </div>
                                <Progress value={Math.max(0, 100 - (team.firingRate / 50) * 100)} className="h-2" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}