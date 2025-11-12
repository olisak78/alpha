import React from 'react';
import { Brain } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { FoundationModel } from '@/services/aiPlatformApi';

interface ModelSummaryCardProps {
  model: FoundationModel;
}

export const ModelSummaryCard: React.FC<ModelSummaryCardProps> = ({ model }) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold">{model.displayName}</h3>
            <p className="text-sm text-gray-600">{model.provider}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
