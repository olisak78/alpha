interface StepIndicatorProps {
  currentStepIndex: number;
  steps: Array<{
    id: string;
    title: string;
  }>;
}

export const StepIndicator = ({ currentStepIndex, steps }: StepIndicatorProps) => {

  return (
    <div className="flex justify-center mb-6">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          {/* Step circle and label column */}
          <div className="flex flex-col items-center">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-medium ${
                index === currentStepIndex
                  ? 'bg-primary text-primary-foreground'
                  : index < currentStepIndex
                  ? 'bg-primary text-white'
                  : 'bg-white text-muted-foreground border-2 border-gray-300'
              }`}
            >
              {index + 1}
            </div>
            
            {/* Step label centered on circle */}
            <div className="absolute mt-16">
            <span className={`text-sm mt-2 text-center w-14 ${
              index === currentStepIndex ? 'text-primary font-medium' : 'text-muted-foreground'
            }`}>
              {step.title}
            </span>
            </div>
          </div>
          
          {/* Connecting line (only show between steps, not after the last one) */}
          {index < steps.length - 1 && (
            <div 
              className={`h-0.5 w-24 transition-all duration-300 ease-in-out ${
                index < currentStepIndex ? 'bg-primary' : 'bg-gray-300'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};
