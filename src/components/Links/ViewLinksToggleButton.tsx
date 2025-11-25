import { LayoutGrid, List } from "lucide-react";
import { useLinksPageContext } from "@/contexts/LinksPageContext";
import { useQuickLinksContext } from "@/contexts/QuickLinksContext";
import { cn } from "@/lib/utils";

interface ViewLinksToggleButtonProps {
  context?: 'links' | 'quicklinks';
}

export function ViewLinksToggleButton({ context = 'links' }: ViewLinksToggleButtonProps) {
  // Use the appropriate context based on the prop
  const linksContext = context === 'links' ? useLinksPageContext() : null;
  const quickLinksContext = context === 'quicklinks' ? useQuickLinksContext() : null;
  
  const viewMode = linksContext?.viewMode || quickLinksContext?.viewMode || 'collapsed';
  const setViewMode = linksContext?.setViewMode || quickLinksContext?.setViewMode || (() => {});

  return (
    <div className="flex items-center bg-muted rounded-lg p-1">
      <button
        onClick={() => setViewMode('collapsed')}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
          viewMode === 'collapsed'
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
        )}
        title="Collapsed grid view"
      >
        <List className="h-4 w-4" />
      </button>
      
      <button
        onClick={() => setViewMode('expanded')}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
          viewMode === 'expanded'
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
        )}
        title="Expanded view with sections"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
    </div>
  );
}
