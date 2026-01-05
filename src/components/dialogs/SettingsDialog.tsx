import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, User as UserIcon, Palette } from 'lucide-react';
import CustomizationAppearanceSettings from '../settings/CustomizationAppearanceSettings';
import UserInformationSettings from '../UserInformationSettings';
import { useSettings } from '@/hooks/useSettings';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsDialog({ 
  open, 
  onOpenChange
}: SettingsDialogProps) {
  const {
    hasChanges,
    visibilityState,
    processedUserInfo,
    isLoading,
    handleVisibilityChange,
    handleSelectAll,
    handleDeselectAll,
    handleSave: saveSettings,
    handleCancel: cancelSettings,
  } = useSettings();

  const handleSave = () => {
    saveSettings();
    onOpenChange(false);
  };

  const handleCancel = () => {
    cancelSettings();
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
          <Tabs defaultValue="user-info" className="h-full flex">
            <div className="w-60 flex-shrink-0 border-r bg-muted/30">
              <TabsList className="flex flex-col w-full bg-transparent p-2 space-y-1 h-auto">
                <TabsTrigger 
                  value="user-info" 
                  className="w-full justify-start gap-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm h-auto py-4"
                >
                  <UserIcon className="h-4 w-4" />
                  User Information
                </TabsTrigger>
                <TabsTrigger 
                  value="projects" 
                  className="w-full justify-start gap-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm h-auto py-4"
                >
                  <Palette className="h-4 w-4" />
                  Customization/Appearance
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <TabsContent value="user-info" className="h-full m-0 p-6 overflow-hidden">
                <UserInformationSettings
                  fullName={processedUserInfo.fullName}
                  email={processedUserInfo.email}
                  team={processedUserInfo.team}
                  role={processedUserInfo.role}
                />
              </TabsContent>
              <TabsContent value="projects" className="h-full m-0 p-6 overflow-hidden">
                <CustomizationAppearanceSettings
                  visibilityState={visibilityState}
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
