import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Plus, BarChart3 } from 'lucide-react';
import { AlertsDashboard } from './AlertsDashboard';
import { AlertsInsights } from './AlertsInsights';

interface EnhancedMonitoringProps {
  selectedLandscapeData?: any;
}

export function EnhancedMonitoring({ selectedLandscapeData }: EnhancedMonitoringProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Alert Management
          {selectedLandscapeData && (
            <Badge variant="outline">{selectedLandscapeData.name}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <AlertsDashboard />
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <AlertsInsights />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
