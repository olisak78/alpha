import { LinksHeader } from "@/components/Links/LinksHeader";
import { LinksSearchFilter } from "@/components/Links/LinksSearchFilter";
import { LinksGrid } from "@/components/Links/LinksGrid";
import { NoLinksFound } from "@/components/Links/NoLinksFound";
import { BreadcrumbPage } from "@/components/BreadcrumbPage";
import { LinksProvider, useLinksPageContext } from "@/contexts/LinksPageContext";

// Internal component that uses the context
const LinksPageContent = () => {
  const { isLoading, filteredLinks } = useLinksPageContext();

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading links...</div>
        </div>
      </div>
    );
  }

  return (
    <BreadcrumbPage>
      {/* Header */}
      <LinksHeader />
      
      {/* Search and Filter */}
      <LinksSearchFilter />

      {/* Links Grid */}
      <LinksGrid />

      {filteredLinks.length === 0 && <NoLinksFound />}
    </BreadcrumbPage>
  );
};

// Main component that provides the context
const LinksPage = () => {
  return (
    <LinksProvider>
      <LinksPageContent />
    </LinksProvider>
  );
};

export default LinksPage;
