import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectsContext } from '@/contexts/ProjectsContext';
import { useProjectVisibility } from '@/hooks/useProjectVisibility';
import { Settings, Layout } from 'lucide-react';
import ProjectVisibilitySettings from '../ProjectVisibilitySettings';
import { Project } from '@/types/api';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProjectVisibilityState {
  [projectId: string]: boolean;
}

const DEFAULT_VISIBLE_PROJECTS = ['cis20', 'usrv', 'ca'];

export default function SettingsDialog({ 
  open, 
  onOpenChange
}: SettingsDialogProps) {
  const { projects, isLoading } = useProjectsContext();
  const { isProjectVisible, updateProjectVisibility } = useProjectVisibility();
  const [hasChanges, setHasChanges] = useState(false);
  const [visibilityState, setVisibilityState] = useState<ProjectVisibilityState>({});

  // Initialize visibility state when projects change
  useEffect(() => {
    if (projects && projects.length > 0) {
      const initialState: ProjectVisibilityState = {};
      
      projects.forEach((project: Project) => {
        initialState[project.id] = isProjectVisible(project);
      });
      
      setVisibilityState(initialState);
    }
  }, [projects, isProjectVisible]);

  // Check for changes and notify parent
  useEffect(() => {
    if (projects && projects.length > 0) {
      const hasChanges = projects.some((project: Project) => {
        const currentVisibility = isProjectVisible(project);
        const newVisibility = visibilityState[project.id];
        return currentVisibility !== newVisibility;
      });
      setHasChanges(hasChanges);
    }
  }, [visibilityState, projects, isProjectVisible]);

  const handleVisibilityChange = (projectId: string, visible: boolean) => {
    setVisibilityState(prev => ({
      ...prev,
      [projectId]: visible
    }));
  };

  const handleSelectAll = () => {
    const newState: ProjectVisibilityState = {};
    projects.forEach((project: Project) => {
      newState[project.id] = true;
    });
    setVisibilityState(newState);
  };

  const handleDeselectAll = () => {
    const newState: ProjectVisibilityState = {};
    projects.forEach((project: Project) => {
      newState[project.id] = false;
    });
    setVisibilityState(newState);
  };

  const handleSave = () => {
    updateProjectVisibility(visibilityState);
    setHasChanges(false);
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Reset to original state
    if (projects && projects.length > 0) {
      const originalState: ProjectVisibilityState = {};
      projects.forEach((project: Project) => {
        originalState[project.id] = isProjectVisible(project);
      });
      setVisibilityState(originalState);
    }
    setHasChanges(false);
    onOpenChange(false);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </DialogTitle>
            <DialogDescription>
              Loading settings...
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] h-[min(800px,90vh)] flex flex-col p-0 overflow-hidden [&>button]:hidden">
        <div className="p-6 pb-4 flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </DialogTitle>
            <DialogDescription>
              Customize your developer portal experience.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-hidden min-h-0">
          <Tabs defaultValue="projects" className="h-full flex">
            <div className="w-48 flex-shrink-0 border-r bg-muted/30">
              <TabsList className="flex flex-col w-full bg-transparent p-2 space-y-1 h-auto">
                <TabsTrigger 
                  value="projects" 
                  className="w-full justify-start gap-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm h-auto py-2"
                >
                  <Layout className="h-3 w-3" />
                  Sidebar Settings
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <TabsContent value="projects" className="h-full m-0 p-6 overflow-hidden">
                <ProjectVisibilitySettings
                  visibilityState={visibilityState}
                  defaultProjects={DEFAULT_VISIBLE_PROJECTS}
                  onVisibilityChange={handleVisibilityChange}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                />
              </TabsContent>
            </div>
            
          </Tabs>
        </div>

        <div className="p-6 pt-4 flex-shrink-0 border-t">
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
