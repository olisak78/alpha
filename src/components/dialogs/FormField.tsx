import { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface BaseFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  showError?: boolean;
  onBlur?: () => void;
  className?: string;
  disabled?: boolean; 
}

interface TextFieldProps extends BaseFieldProps {
  type?: "text" | "email" | "url";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  validationMessage?: string;
  showValidation?: boolean;
}

interface SelectFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  loading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
}

// Base field wrapper component
const FieldWrapper = ({ 
  children, 
  id, 
  label, 
  required = false 
}: { 
  children: ReactNode; 
  id: string; 
  label: string; 
  required?: boolean; 
}) => (
  <div className="grid gap-1">
    <Label htmlFor={id} className="text-sm font-medium">
      {label} {required && <span className="text-destructive">*</span>}
    </Label>
    {children}
  </div>
);

// Text input field component
export const TextField = ({
  id,
  label,
  required = false,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  showError = false,
  validationMessage,
  showValidation = false,
  onBlur,
  className,
  disabled = false,
}: TextFieldProps) => {
  const hasError = showError && error;
  const inputClassName = hasError 
    ? "border-destructive focus-visible:ring-destructive" 
    : "";

  return (
    <FieldWrapper id={id} label={label} required={required}>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`${inputClassName} ${className || ""}`}
        placeholder={placeholder}
        disabled={disabled}
      />
      
    </FieldWrapper>
  );
};

// Select dropdown field component
export const SelectField = ({
  id,
  label,
  required = false,
  value,
  onChange,
  placeholder = "Select an option",
  options = [],
  loading = false,
  loadingMessage = "Loading...",
  emptyMessage = "No options available",
  error,
  showError = false,
  onBlur,
  disabled = false,
}: SelectFieldProps) => {
  const hasError = showError && error;
  const selectClassName = hasError 
    ? "border-destructive focus-visible:ring-destructive" 
    : "";

  return (
    <FieldWrapper id={id} label={label} required={required}>
      {loading ? (
        <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">{loadingMessage}</span>
        </div>
      ) :  (
        <Select
          value={value}
          onValueChange={(selectedValue) => {
            onChange(selectedValue);
            onBlur?.();
          }}
        >
          <SelectTrigger className={selectClassName} disabled={disabled}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.length === 0 ? (
              <div className="p-2 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}
      {hasError && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </FieldWrapper>
  );
};