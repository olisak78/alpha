import React from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useProjectsContext } from '@/contexts/ProjectsContext';
import { Project } from '@/types/api';
import { Eye, EyeOff } from 'lucide-react';

interface ProjectVisibilitySettingsProps {
  visibilityState: { [projectId: string]: boolean };
  defaultProjects: string[];
  onVisibilityChange: (projectId: string, visible: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export default function ProjectVisibilitySettings({
  visibilityState,
  defaultProjects,
  onVisibilityChange,
  onSelectAll,
  onDeselectAll
}: ProjectVisibilitySettingsProps) {
  const { projects, isLoading } = useProjectsContext();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Main Title Section */}
      <div className="mb-6 flex-shrink-0">
        <h3 className="text-lg font-semibold mb-2">Sidebar Settings</h3>
        <Separator className="mt-4" />
      </div>
      
      {/* Project Visibility Section */}
      <div className="flex flex-col h-[315px] bg-muted/20 rounded-lg p-4 border overflow-hidden">
        <div className="flex-shrink-0">          
          <div className="flex items-center justify-between py-2">
            <h4 className="text-md font-medium mb-2">Project Visibility</h4>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={onSelectAll}
                className="text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDeselectAll}
                className="text-xs"
              >
                <EyeOff className="h-3 w-3 mr-1" />
                None
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Control which projects appear in the sidebar.
          </p>
        </div>

        <Separator className="mb-4 flex-shrink-0" />

        <div className="overflow-auto flex-1 min-h-0">
          <div className="grid grid-cols-2 gap-3 py-2 pr-4">
            {projects?.map((project: Project) => {
              const isVisible = visibilityState[project.id] || false;              
              return (
                <div
                  key={project.id}
                  className="flex items-center space-x-2 p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={`project-${project.id}`}
                    checked={isVisible}
                    onCheckedChange={(checked) => 
                      onVisibilityChange(project.id, checked as boolean)
                    }
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor={`project-${project.id}`}
                        className="text-sm font-medium cursor-pointer truncate"
                      >
                        {project.title || project.name}
                      </label>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isVisible ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
