import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LucideIcon } from "lucide-react";

export interface FilterOption<T extends string = string> {
  value: T;
  label: string;
  icon: LucideIcon;
  isDisabled?: boolean;
  tooltip?: string;
}

export interface QuickFilterButtonsProps<T extends string = string> {
  activeFilter: T;
  onFilterChange: (filter: T) => void;
  filters: FilterOption<T>[];
}

export default function QuickFilterButtons<T extends string = string>({ 
  activeFilter, 
  onFilterChange, 
  filters 
}: QuickFilterButtonsProps<T>) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {filters.map(({ value, label, icon: Icon, isDisabled, tooltip }) => {
          const button = (
            <Button
              key={value}
              variant={activeFilter === value ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange(value)}
              className="flex items-center gap-1"
              disabled={isDisabled}
            >
              <Icon className="h-3 w-3" />
              {label}
            </Button>
          );

          if (tooltip) {
            return (
              <Tooltip key={value}>
                <TooltipTrigger asChild>
                  <span>
                    {button}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          }

          return button;
        })}
      </div>
    </TooltipProvider>
  );
}
