import { UnifiedLinksGrid } from "./UnifiedLinksGrid";
import { useLinksPageContext } from "@/contexts/LinksPageContext";

export const LinksGrid = () => {
  const { filteredLinks, linksByCategory, linkCategories, viewMode } = useLinksPageContext();

  return (
    <UnifiedLinksGrid
      links={filteredLinks}
      linkCategories={linkCategories}
      viewMode={viewMode}
      linksByCategory={linksByCategory}
    />
  );
};
