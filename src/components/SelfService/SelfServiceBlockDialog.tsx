import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Play, History } from "lucide-react";
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
  historyCount?: number; // Optional: number of recent executions
  onOpenDialog: () => void;
  onCloseDialog: (open: boolean) => void;
  onFormChange: (elementId: string, value: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onHistoryClick?: () => void; // Optional: handler for history button (no parameters)
}

export default function SelfServiceBlockDialog({
  block,
  isOpen,
  isLoading,
  formData,
  jenkinsParameters,
  staticJobParameters,
  historyCount,
  onOpenDialog,
  onCloseDialog,
  onFormChange,
  onSubmit,
  onCancel,
  onHistoryClick
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
        <Card className="group cursor-pointer hover:shadow-lg hover:border-primary/20 transition-all duration-200 flex flex-col h-full bg-card">
          <CardContent className="p-6 flex flex-col flex-1 gap-4 relative">
            {/* Icon at top */}
            <div className="flex items-start justify-between">
              <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/15 transition-colors">
                <block.icon className="h-6 w-6 text-primary" />
              </div>
              <Badge variant="outline" className="text-xs">{block.category}</Badge>
            </div>

            {/* Title and Description */}
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-base text-foreground leading-tight">
                {block.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {block.description}
              </p>
            </div>

            {/* Bottom section with Launch button and History button */}
            <div className="flex items-center justify-between gap-2">
              {/* Launch Button - Half width */}
              <Button
                className="gap-2 bg-primary hover:bg-primary/90 flex-shrink-0"
                size="default"
                style={{ width: 'calc(50% - 0.25rem)' }}
              >
                <Play className="h-4 w-4 fill-current" />
                Launch
              </Button>

              {/* History button - positioned at right edge */}
              {historyCount !== undefined && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (historyCount > 0) {
                      onHistoryClick?.();
                    }
                  }}
                  disabled={historyCount === 0}
                  className={`flex items-center justify-center gap-1.5 px-3 h-10 rounded-lg transition-colors group/history flex-shrink-0 ${historyCount === 0
                      ? 'bg-muted/50 cursor-not-allowed opacity-60'
                      : 'bg-muted hover:bg-muted/80 cursor-pointer'
                    }`}
                  title={
                    historyCount === 0
                      ? 'No recent executions'
                      : `${historyCount} recent execution${historyCount !== 1 ? 's' : ''}`
                  }
                >
                  <History className={`h-4 w-4 flex-shrink-0 transition-colors ${historyCount === 0
                      ? 'text-muted-foreground/50'
                      : 'text-muted-foreground group-hover/history:text-foreground'
                    }`} />
                  <span className={`text-sm font-semibold flex-shrink-0 ${historyCount === 0
                      ? 'text-muted-foreground'
                      : 'text-foreground'
                    }`}>
                    {historyCount > 99 ? '99+' : historyCount}
                  </span>
                </button>
              )}
            </div>
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