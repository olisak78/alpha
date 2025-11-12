import { UnifiedLinkCard } from "@/components/Links/UnifiedLinkCard";
import { HelpCircle } from "lucide-react";
import { SHARED_ICON_MAP } from "@/contexts/LinksPageContext";
import { useQuickLinksContext } from "@/contexts/QuickLinksContext";

export function QuickLinksGrid() {
  const {
    filteredQuickLinks,
  } = useQuickLinksContext();

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))' }}>
      {filteredQuickLinks.map((link, index) => {
        // Get the icon component from the shared icon map

        return (
          <UnifiedLinkCard
            key={`${link.category}-${index}`}
            linkData={link}
            variant="compact"
          />
        );
      })}
    </div>
  );
}
