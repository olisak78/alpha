import { UnifiedLinksGrid } from "@/components/Links/UnifiedLinksGrid";
import { useViewMode } from "@/stores/quickLinksStore";
import { useQuickLinksContext } from "@/contexts/QuickLinksContext";

export function QuickLinksGrid() {
  const viewMode = useViewMode();
  
  // Data from context (derived from userData)
  const {
    filteredQuickLinks,
    linkCategories,
  } = useQuickLinksContext();

  return (
    <UnifiedLinksGrid
      links={filteredQuickLinks}
      linkCategories={linkCategories}
      viewMode={viewMode}
    />
  );
}