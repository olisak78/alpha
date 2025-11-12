import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Shield } from 'lucide-react';
import { flappyAlerts, staleAlerts, alertGaps } from '@/data/monitoring/mock-data';

export function ReliabilitySignals() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Flappy Alerts */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        Flappy Alerts
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {flappyAlerts.map((alert, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <div className="font-medium text-sm">{alert.name}</div>
                                    <div className="text-xs text-muted-foreground">{alert.component}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-orange-600">{alert.fires} fires</div>
                                    <div className="text-xs text-muted-foreground">Avg: {alert.avgDuration}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Stale Rules */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-gray-500" />
                        Stale Rules
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {staleAlerts.map((alert, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <div className="font-medium text-sm">{alert.name}</div>
                                    <div className="text-xs text-muted-foreground">{alert.component}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-600">{alert.lastFired}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Alert Coverage Gaps */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-red-500" />
                        Alert Coverage Gaps
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {alertGaps.map((gap, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg border-red-200">
                                <div>
                                    <div className="font-medium text-sm">{gap.component}</div>
                                    <div className="text-xs text-muted-foreground">{gap.team}</div>
                                </div>
                                <div className="text-right">
                                    <Badge variant="destructive" className="text-xs">
                                        {gap.criticalAlerts} critical
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}