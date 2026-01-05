import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import DOMPurify from 'dompurify';

interface FormElementProps {
  element: any;
  value: any;
  onChange: (value: any) => void;
}

const getElementId = (element: any): string => element.id || element.name || '';
const getElementTitle = (element: any): string => element.title || element.name || '';
const getDefaultValue = (element: any): any => element.defaultParameterValue?.value ?? element.defaultValue?.value ?? '';

export const FormElement = ({ element, value, onChange }: FormElementProps) => {
  const elementId = getElementId(element);
  const elementTitle = getElementTitle(element);
  const defaultValue = getDefaultValue(element);
  const currentValue = value !== undefined ? value : defaultValue;
  const isRequired = element.required === true;

  const renderLabel = (labelText: string) => {
    return (
      <>
        {labelText}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </>
    );
  };

  const renderDescription = () => {
    if (!element.description) return null;
    return (
      <p
        className="text-sm text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(element.description) }}
      />
    );
  };

  switch (element.type) {
    case 'checkbox':
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={elementId}
              checked={currentValue === true}
              onCheckedChange={(checked) => onChange(checked === true)}
            />
            <Label htmlFor={elementId} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
              {elementTitle}
            </Label>
          </div>
          {element.description && (
            <div className="ml-6">
              {renderDescription()}
            </div>
          )}
        </div>
      );

    case 'select':
      return (
        <div className="space-y-2">
          <Label htmlFor={elementId}>{renderLabel(elementTitle)}</Label>
          {renderDescription()}
          <Select value={currentValue || ''} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={element.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {element.options?.map((option: any) => (
                <SelectItem key={option.id} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'radio':
      // Find which option is currently selected based on the stored value
      const selectedOption = element.options?.find((opt: any) => opt.value === currentValue);
      const selectedId = selectedOption?.id || element.defaultValue?.id || '';

      return (
        <div className="space-y-2">
          <Label>{renderLabel(elementTitle)}</Label>
          {renderDescription()}
          <RadioGroup
            value={selectedId}
            onValueChange={(selectedId) => {
              // Find the selected option and store its value
              const option = element.options?.find((opt: any) => opt.id === selectedId);
              if (option) {
                onChange(option.value);
              }
            }}
          >
            {element.options?.map((option: any) => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem value={option.id} id={`${elementId}-${option.id}`} />
                <Label htmlFor={`${elementId}-${option.id}`}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );

    case 'text':
    default:
      const isClusterName = elementId === 'ClusterName';
      return (
        <div className="space-y-2">
          <Label htmlFor={elementId}>{renderLabel(elementTitle)}</Label>
          {renderDescription()}
          <Input
            id={elementId}
            placeholder={element.placeholder || `Enter ${elementTitle.toLowerCase()}`}
            value={currentValue || ''}
            onChange={(e) => onChange(e.target.value)}
            readOnly={isClusterName}      
            className={isRequired && !currentValue ? 'border-red-300 focus:border-red-500' : ''}
          />
          {isRequired && !currentValue && (
            <p className="text-xs text-red-500">This field is required</p>
          )}
        </div>
      );
  }
};
