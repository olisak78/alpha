import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { SelfServiceWizard } from "./SelfServiceWizard";
import type { SelfServiceDialog } from "@/data/self-service/selfServiceBlocks";

interface SelfServiceBlockDialogProps {
  block: SelfServiceDialog;
  isOpen: boolean;
  isLoading: boolean;
  formData: Record<string, any>;
  jenkinsParameters?: any;
  staticJobParameters?: any;
  currentStepIndex: number;
  currentStep?: any;
  steps: any[];
  onOpenDialog: () => void;
  onCloseDialog: (open: boolean) => void;
  onFormChange: (elementId: string, value: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function SelfServiceBlockDialog({ 
  block, 
  isOpen,
  isLoading,
  formData,
  jenkinsParameters,
  staticJobParameters,
  onOpenDialog,
  onCloseDialog,
  onFormChange,
  onSubmit,
  onCancel
}: SelfServiceBlockDialogProps) {

  // Prepare data for wizard
  const getWizardData = () => {
    if (staticJobParameters) {
      // Static job data
      if (Array.isArray(staticJobParameters)) {
        return { parameters: staticJobParameters, steps: [] };
      } else if (staticJobParameters.steps) {
        return { parameters: [], steps: staticJobParameters.steps };
      }
    }
    
    if (jenkinsParameters) {
      // Dynamic job data
      return {
        parameters: jenkinsParameters.parameterDefinitions || [],
        steps: jenkinsParameters.steps || []
      };
    }
    
    return { parameters: [], steps: [] };
  };

  const { parameters, steps } = getWizardData();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (open) {
        onOpenDialog();
      } else {
        onCloseDialog(open);
      }
    }}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow flex flex-col h-full">
          <CardContent className="p-6 flex flex-col flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <block.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{block.title}</h3>
                <Badge variant="outline" className="text-xs">{block.category}</Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4 flex-1">{block.description}</p>
            <Button className="w-full mt-auto" size="sm">Launch</Button>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl lg:max-w-4xl w-[65vw] lg:w-[80vw] h-[85vh] flex flex-col [&>button]:hidden">
        <SelfServiceWizard
          block={block}
          parameters={parameters}
          steps={steps}
          formData={formData}
          onElementChange={onFormChange}
          onCancel={onCancel}
          onSubmit={onSubmit}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}