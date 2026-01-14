import { isEmptyParameter } from "@/utils/selfServiceUtils";

/**
 * Component to display job parameters in a nice format
 */
interface ParametersDisplayProps {
  parameters: Record<string, any>;
}

export const ParametersDisplay = ({ parameters }: ParametersDisplayProps) => {
  if (!parameters || Object.keys(parameters).length === 0) {
    return <span className="text-sm text-muted-foreground italic">No parameters</span>;
  }

  // Filter out empty/null parameters
  const filteredParameters = Object.entries(parameters).filter(([_, value]) => !isEmptyParameter(value));

  if (filteredParameters.length === 0) {
    return <span className="text-sm text-muted-foreground italic">No parameters</span>;
  }

  return (
    <div className="space-y-2">
      {filteredParameters.map(([key, value]) => (
        <div key={key} className="flex gap-3 text-sm">
          <span className="font-medium text-foreground min-w-[140px] break-words">{key}:</span>
          <span className="text-muted-foreground break-all flex-1">
            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
};