import { UnifiedLinksGrid } from "./UnifiedLinksGrid";
import { useLinksViewMode } from "@/stores/linksPageStore";
import { useLinksPageContext } from "@/contexts/LinksPageContext";

export const LinksGrid = () => {
  // viewMode from Zustand
  const viewMode = useLinksViewMode();
  
  // Data from context (derived from API)
  const { filteredLinks, linksByCategory, linkCategories } = useLinksPageContext();

  return (
    <UnifiedLinksGrid
      links={filteredLinks}
      linkCategories={linkCategories}
      viewMode={viewMode}
      linksByCategory={linksByCategory}
    />
  );
};