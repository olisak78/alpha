import { UnifiedLinksGrid } from "@/components/Links/UnifiedLinksGrid";
import { useQuickLinksContext } from "@/contexts/QuickLinksContext";

export function QuickLinksGrid() {
  const {
    filteredQuickLinks,
    linkCategories,
    viewMode,
  } = useQuickLinksContext();

  return (
    <UnifiedLinksGrid
      links={filteredQuickLinks}
      linkCategories={linkCategories}
      viewMode={viewMode}
    />
  );
}
