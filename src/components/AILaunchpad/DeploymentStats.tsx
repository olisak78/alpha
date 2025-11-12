import React from 'react';
import { Play, Cloud, Brain, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Deployment } from '@/services/aiPlatformApi';

interface DeploymentStatsProps {
  deployments: Deployment[];
}

export const DeploymentStats: React.FC<DeploymentStatsProps> = ({ deployments }) => {
  const runningDeployments = deployments.filter(d => d.status === 'RUNNING').length;
  const totalDeployments = deployments.length;
  const problemDeployments = deployments.filter(d => d.status === 'DEAD' || d.status === 'UNKNOWN').length;
  
  // Count unique models
  const uniqueModels = new Set<string>();
  deployments.forEach(deployment => {
    const modelName = deployment.details?.resources?.backendDetails?.model?.name ||
                     deployment.details?.resources?.backend_details?.model?.name ||
                     deployment.configurationName ||
                     'Unknown Model';
    uniqueModels.add(modelName);
  });

  const stats = [
    {
      label: 'Running',
      value: runningDeployments,
      icon: Play,
      color: 'bg-green-100 text-green-800 border-green-200',
    },
    {
      label: 'Total',
      value: totalDeployments,
      icon: Cloud,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      label: 'Model Types',
      value: uniqueModels.size,
      icon: Brain,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    ...(problemDeployments > 0 ? [{
      label: 'Issues',
      value: problemDeployments,
      icon: TrendingUp,
      color: 'bg-red-100 text-red-800 border-red-200',
    }] : []),
  ];

  if (totalDeployments === 0) {
    return null;
  }

  return (
    <div className="deployment-overview mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Deployment Summary</h3>
        <div className="flex items-center gap-3 flex-wrap">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            
            return (
              <Badge 
                key={index} 
                variant="outline" 
                className={`${stat.color} px-3 py-2 text-sm font-medium flex items-center gap-2 border`}
              >
                <IconComponent className="h-4 w-4" />
                <span className="font-semibold">{stat.value}</span>
                <span className="font-normal">{stat.label}</span>
              </Badge>
            );
          })}
        </div>
      </div>
      <div className="h-px bg-border"></div>
    </div>
  );
};
