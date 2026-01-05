import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HealthStatusFilterProps {
  hideDownComponents: boolean;
  onToggle: (hide: boolean) => void;
}

export function HealthStatusFilter({ hideDownComponents, onToggle }: HealthStatusFilterProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={hideDownComponents ? "default" : "outline"}
            size="sm"
            onClick={() => onToggle(!hideDownComponents)}
            className="h-8 px-3 gap-2"
          >
            {hideDownComponents ? (
              <>
                <EyeOff className="h-4 w-4" />
                
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />

              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {hideDownComponents
              ? "Click to show ALL components"
              : "Click to hide components which are not available for this Landscape"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}