import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface StaticFormButtonsProps {
  currentStep: 'configuration' | 'preview';
  currentStepIndex?: number;
  totalSteps?: number;
  isLoading: boolean;
  hasParameters: boolean;
  canProceed?: boolean;
  onCancel: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export const SelfServiceDialogButtons = ({
  currentStep,
  currentStepIndex = 0,
  totalSteps = 1,
  isLoading,
  hasParameters,
  canProceed = true,
  onCancel,
  onPrevious,
  onNext,
  onSubmit
}: StaticFormButtonsProps) => {
  const isConfigurationStep = currentStep === 'configuration';
  const isPreviewStep = currentStep === 'preview';
  const canGoBack = currentStepIndex > 0;

  return (
    <div className="flex justify-end items-center gap-2 pt-4 border-t mt-1 flex-shrink-0">
      <Button
        variant="outline"
        onClick={onCancel}
        size="sm"
        className="flex items-center gap-1"
      >
        <X className="h-3 w-3" />
        Cancel
      </Button>
      
      {canGoBack && (
        <Button
          variant="outline"
          onClick={onPrevious}
          size="sm"
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-3 w-3" />
          Previous
        </Button>
      )}
      
      {isConfigurationStep ? (
        <Button
          onClick={onNext}
          size="sm"
          disabled={isLoading || !hasParameters || !canProceed}
          className="flex items-center gap-1"
          title={!canProceed ? "Please fill in all required fields" : undefined}
        >
          Next
          <ChevronRight className="h-3 w-3" />
        </Button>
      ) : (
        <Button
          onClick={onSubmit}
          size="sm"
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          {isLoading ? "Loading..." : "Submit"}
        </Button>
      )}
    </div>
  );
};
