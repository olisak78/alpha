import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';
import { componentStatsData } from '@/data/monitoring/mock-data';

export function ComponentAlertActivity() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Component Alert Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={componentStatsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="component" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="fires" fill="#ef4444" name="Fires (30d)" />
                        <Bar dataKey="alerts" fill="#3b82f6" name="Total Alerts" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}