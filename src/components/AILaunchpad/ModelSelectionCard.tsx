import React from 'react';
import { Brain } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FoundationModel } from '@/services/aiPlatformApi';

interface ModelSelectionCardProps {
  model: FoundationModel;
  onSelect: (model: FoundationModel) => void;
}

export const ModelSelectionCard: React.FC<ModelSelectionCardProps> = ({ 
  model, 
  onSelect 
}) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onSelect(model)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{model.displayName}</h3>
                <p className="text-sm text-gray-600">{model.name}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-3">{model.description}</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{model.provider}</Badge>
              {model.capabilities && model.capabilities.slice(0, 3).map((capability, index) => (
                <Badge key={`capability-${index}`} variant="outline" className="text-xs">
                  {capability}
                </Badge>
              ))}
              {model.capabilities && model.capabilities.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{model.capabilities.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
