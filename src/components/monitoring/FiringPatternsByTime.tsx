import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { firingHeatmapData } from '@/data/monitoring/mock-data';

export function FiringPatternsByTime() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Firing Patterns by Time
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">Peak hours: 12:00-14:00 (68% of daily alerts)</div>
                    <div className="grid grid-cols-7 gap-1 text-xs">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                            <div key={day} className="text-center font-medium text-muted-foreground">{day}</div>
                        ))}
                    </div>
                    {firingHeatmapData.map((row) => (
                        <div key={row.hour} className="grid grid-cols-8 gap-1 items-center">
                            <div className="text-xs text-muted-foreground font-medium">{row.hour}:00</div>
                            {Object.entries(row).filter(([key]) => key !== 'hour').map(([day, value]) => (
                                <div
                                    key={day}
                                    className={`h-6 rounded text-xs flex items-center justify-center text-white ${value === 0 ? 'bg-muted' :
                                            Number(value) <= 5 ? 'bg-green-500' :
                                                Number(value) <= 10 ? 'bg-yellow-500' :
                                                    'bg-red-500'
                                        }`}
                                >
                                    {value || ''}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}