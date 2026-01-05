import { LayoutGrid, List } from "lucide-react";
import { useViewMode as useQuickLinksViewMode, useSearchFilterActions as useQuickLinksActions } from "@/stores/quickLinksStore";
import { useLinksViewMode, useLinksSearchFilterActions } from "@/stores/linksPageStore";
import { cn } from "@/lib/utils";

interface ViewLinksToggleButtonProps {
  context?: 'links' | 'quicklinks';
}

export function ViewLinksToggleButton({ context = 'links' }: ViewLinksToggleButtonProps) {
  // QuickLinks: Use quickLinksStore
  const quickLinksViewMode = useQuickLinksViewMode();
  const { setViewMode: setQuickLinksViewMode } = useQuickLinksActions();
  
  // Links page: Use linksPageStore
  const linksViewMode = useLinksViewMode();
  const { setViewMode: setLinksViewMode } = useLinksSearchFilterActions();
  
  // Determine which state to use based on context
  const viewMode = context === 'quicklinks' ? quickLinksViewMode : linksViewMode;
  const setViewMode = context === 'quicklinks' ? setQuickLinksViewMode : setLinksViewMode;

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