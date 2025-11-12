import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SelfServiceDialogButtons } from "./SelfServiceDialogButtons";
import { StepIndicator } from "./StepIndicator";
import { FormElement } from "./FormElement";
import { FormPreview } from "./FormPreview";

interface SelfServiceWizardProps {
  block: {
    icon?: any;
    title: string;
    description: string;
  };
  parameters?: any[];
  steps?: any[];
  formData: Record<string, any>;
  onElementChange: (elementId: string, value: any) => void;
  onCancel: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

export const SelfServiceWizard = ({
  block,
  parameters = [],
  steps: inputSteps = [],
  formData,
  onElementChange,
  onCancel,
  onSubmit,
  isLoading = false
}: SelfServiceWizardProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Simplify steps creation - use provided steps or create from parameters
  const createSteps = () => {
    if (inputSteps.length > 0) {
      // Use provided steps structure
      const wizardSteps = inputSteps.map(step => ({
        id: step.id || step.name,
        title: step.title || step.name,
        description: step.description,
        elements: step.fields?.filter((field: any) => field.type !== "WHideParameterDefinition") || []
      }));

      // Add review step
      wizardSteps.push({
        id: 'review',
        title: 'Review Details',
        description: 'Review your configuration before submission',
        elements: []
      });

      return wizardSteps;
    }

    // Create from parameters
    const visibleParams = parameters.filter(param => param.type !== "WHideParameterDefinition");
    
    if (visibleParams.length === 0) return [];

    const steps = [{
      id: 'configuration',
      title: 'Configuration',
      description: 'Configure your service parameters',
      elements: visibleParams
    }];

    // Add review step
    steps.push({
      id: 'review',
      title: 'Review Details',
      description: 'Review your configuration before submission',
      elements: []
    });

    return steps;
  };

  const steps = createSteps();
  const currentStep = steps[currentStepIndex];

  // Get all visible parameters for preview
  const getAllVisibleParameters = () => {
    if (inputSteps.length > 0) {
      const allFields: any[] = [];
      inputSteps.forEach(step => {
        if (step.fields) {
          step.fields.forEach((field: any) => {
            if (field.type !== "WHideParameterDefinition") {
              allFields.push(field);
            }
          });
        }
      });
      return allFields;
    }
    return parameters.filter(param => param.type !== "WHideParameterDefinition");
  };

  // Validation function to check if required fields are filled in current step
  const validateCurrentStep = () => {
    if (currentStep?.id === 'review') return true;
    
    const currentElements = currentStep?.elements || [];
    const requiredFields = currentElements.filter((el: any) => el.required === true);
    
    return requiredFields.every((field: any) => {
      const fieldName = field.id || field.name;
      const value = formData?.[fieldName];
      
      // Check if value exists and is not empty string
      if (typeof value === 'string') {
        return value.trim() !== '';
      }
      return value !== undefined && value !== null && value !== '';
    });
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleCancel = () => {
    setCurrentStepIndex(0);
    onCancel();
  };

  const hasParameters = parameters.length > 0 || inputSteps.some(step => step.fields?.length > 0);

  // No parameters case
  if (!hasParameters) {
    return (
      <>
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <block.icon className="h-5 w-5 text-primary" />
            {block.title}
          </DialogTitle>
          <DialogDescription>{block.description}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
          <Card className="border flex-1 flex flex-col min-h-0">
            <CardContent className="p-6 flex-1 flex flex-col min-h-0">
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">No parameters available for this service.</p>
              </div>
              <SelfServiceDialogButtons
                currentStep="configuration"
                isLoading={isLoading}
                hasParameters={false}
                onCancel={handleCancel}
                onPrevious={() => {}}
                onNext={() => {}}
                onSubmit={onSubmit}
              />
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <DialogHeader className="pb-4 border-b">
        <DialogTitle className="flex items-center gap-2">
          <block.icon className="h-5 w-5 text-primary" />
          {block.title}
        </DialogTitle>
        <DialogDescription>{block.description}</DialogDescription>
      </DialogHeader>
      <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
        {/* Step Indicator */}
        {steps.length > 1 && (
          <StepIndicator 
            currentStepIndex={currentStepIndex} 
            steps={steps.map(step => ({ id: step.id, title: step.title }))}
          />
        )}

        {/* Current Step Content */}
        <Card className="border flex-1 flex flex-col min-h-0">
          <CardContent className="p-6 flex-1 flex flex-col min-h-0">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">{currentStep?.title}</h3>
              {currentStep?.description && (
                <p className="text-sm text-muted-foreground">{currentStep.description}</p>
              )}
            </div>

            {/* Form Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <div className="h-full overflow-y-auto pr-2">
                <div className="space-y-4 pb-4">
                  {currentStep?.id === 'review' ? (
                    <FormPreview
                      parameters={getAllVisibleParameters()}
                      formData={formData}
                    />
                  ) : (
                    currentStep?.elements?.map((element: any) => (
                      <FormElement
                        key={element.id || element.name}
                        element={element}
                        value={formData?.[element.id || element.name]}
                        onChange={(value) => onElementChange(element.id || element.name, value)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <SelfServiceDialogButtons
              currentStep={currentStep?.id === 'review' ? 'preview' : 'configuration'}
              currentStepIndex={currentStepIndex}
              totalSteps={steps.length}
              isLoading={isLoading}
              hasParameters={hasParameters}
              canProceed={validateCurrentStep()}
              onCancel={handleCancel}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onSubmit={onSubmit}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
};
