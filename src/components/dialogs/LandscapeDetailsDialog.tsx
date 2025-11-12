import { Github, ExternalLink, Activity, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Landscape } from "@/types/developer-portal";

interface LandscapeDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  landscapeGroups: Record<string, Landscape[]>;
  onSelectLandscape: (landscapeId: string) => void;
  getStatusColor: (status: string) => string;
}

export default function LandscapeDetailsDialog({
  open,
  onOpenChange,
  landscapeGroups,
  onSelectLandscape,
  getStatusColor,
}: LandscapeDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            All Landscapes Overview
          </DialogTitle>
          <DialogDescription>
            Complete view of all environments and their current status
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {Object.entries(landscapeGroups).map(([groupName, landscapes]) => (
            <div key={groupName}>
              <h3 className="font-semibold text-lg mb-4 text-muted-foreground uppercase tracking-wider">
                {groupName} Environments
              </h3>
              <div className="grid gap-4">
                {landscapes.map((landscape) => (
                  <Card key={landscape.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold mb-1">{landscape.name}</h4>
                          <p className="text-muted-foreground">AWS Account: {landscape.awsAccount}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(landscape.status)}>
                            {landscape.status}
                          </Badge>
                          <Badge className={getStatusColor(landscape.deploymentStatus)}>
                            {landscape.deploymentStatus}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => window.open(landscape.githubConfig)}>
                          <Github className="h-4 w-4 mr-2" />
                          GitHub Config
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => window.open(`https://console.aws.amazon.com/console/home?region=us-east-1#account=${landscape.awsAccount}`)}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          AWS Console
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => window.open(landscape.camProfile)}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          CAM Profile
                        </Button>
                        <Button variant="outline" size="sm">
                          <Activity className="h-4 w-4 mr-2" />
                          Deployment Jobs
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            onSelectLandscape(landscape.id);
                            onOpenChange(false);
                          }}
                        >
                          <Filter className="h-4 w-4 mr-2" />
                          Filter By This
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
