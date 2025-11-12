import React from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ModelSelectionCard } from './ModelSelectionCard';
import { FoundationModel } from '@/services/aiPlatformApi';

interface ModelSearchStepProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  models: FoundationModel[];
  filteredModels: FoundationModel[];
  isLoading: boolean;
  onModelSelect: (model: FoundationModel) => void;
}

export const ModelSearchStep: React.FC<ModelSearchStepProps> = ({
  searchTerm,
  onSearchChange,
  filteredModels,
  isLoading,
  onModelSelect,
}) => {
  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search models by name or provider..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Models List */}
      <div className="overflow-y-auto space-y-3 scrollbar-hide">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No models found matching your search' : 'No models available'}
          </div>
        ) : (
          filteredModels.map((model) => (
            <ModelSelectionCard
              key={model.id}
              model={model}
              onSelect={onModelSelect}
            />
          ))
        )}
      </div>
    </div>
  );
};
