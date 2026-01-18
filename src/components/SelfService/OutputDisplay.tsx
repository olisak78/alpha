import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle, ExternalLink } from "lucide-react";
import type { JenkinsJobOutputItem } from "@/services/SelfServiceApi";

interface OutputDisplayProps {
  output: JenkinsJobOutputItem[];
}

export const OutputDisplay = ({ output }: OutputDisplayProps) => {
  if (!output || output.length === 0) {
    return <p className="text-sm text-muted-foreground">No output available</p>;
  }

  const renderValue = (item: JenkinsJobOutputItem) => {
    // If the type is link, render as a clickable link
    if (item.type === 'link' && item.value) {
      return (
        <a
          href={item.value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline inline-flex items-center gap-1"
        >
          {item.value}
          <ExternalLink className="h-3 w-3" />
        </a>
      );
    }

    // Otherwise, render as plain text
    return <p className="text-sm font-mono">{item.value || '-'}</p>;
  };

  return (
    <div className="space-y-3">
      {output.map((item) => (
        <div key={item.id} className="space-y-1">
          <div className="flex items-center gap-1">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">
              {item.displayName}
            </Label>
            {item.description && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{item.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {renderValue(item)}
        </div>
      ))}
    </div>
  );
};