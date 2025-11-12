import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { performanceTrendData } from '@/data/monitoring/mock-data';

export function PerformanceTrends() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Trends
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="mttr" stroke="#ef4444" name="MTTR (minutes)" />
                        <Line type="monotone" dataKey="mtta" stroke="#f59e0b" name="MTTA (minutes)" />
                        <Line type="monotone" dataKey="fires" stroke="#3b82f6" name="Weekly Fires" />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}