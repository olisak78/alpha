import { Label } from "@/components/ui/label";
import type { JenkinsJobField } from "@/types/api";

interface StaticFormPreviewProps {
  parameters: JenkinsJobField[];
  formData: Record<string, any>;
}

export const FormPreview = ({
  parameters,
  formData
}: StaticFormPreviewProps) => {
  
  const renderPreviewElement = (param: JenkinsJobField) => {
    const value = formData[param.name] !== undefined 
      ? formData[param.name] 
      : param.defaultParameterValue?.value;
    
    const displayValue = param.type === 'checkbox' 
      ? (value ? 'true' : 'false')
      : (value || '(empty)');
    
    return (
      <div key={param.name} className="grid grid-cols-2 gap-4 py-2 border-b border-border/50 last:border-b-0">
        <Label className="text-sm font-medium">
          {param.name}
        </Label>
        <span className="text-sm text-muted-foreground">
          {displayValue}
        </span>
      </div>
    );
  };

  // Filter out boolean parameters with false values and empty strings from preview
  const filteredParameters = parameters.filter(param => {
    const paramKey = param.name;
    const value = formData[paramKey] !== undefined 
      ? formData[paramKey] 
      : param.defaultParameterValue?.value;
    
    // Don't show boolean parameters if they are false
    if (param.type === 'checkbox') {
      return value === true;
    }
    
    // Don't show string parameters if they are empty or only whitespace
    if (typeof value === 'string') {
      return value.trim() !== '';
    }
    
    // Don't show parameters with null, undefined, or empty values
    return value !== null && value !== undefined && value !== '';
  });

  return (
    <div className="space-y-1">
      {filteredParameters.map(renderPreviewElement)}
    </div>
  );
};
