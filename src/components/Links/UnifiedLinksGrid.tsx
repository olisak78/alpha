import { UnifiedLinkCard } from "./UnifiedLinkCard";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { LinkCategory, Link, ViewLinksType } from "@/types/developer-portal";
import type { QuickLink } from "@/contexts/QuickLinksContext";

interface UnifiedLinksGridProps {
  links: (Link | QuickLink)[];
  linkCategories: LinkCategory[];
  viewMode: ViewLinksType;
  linksByCategory?: Record<string, (Link | QuickLink)[]>;
}

export const UnifiedLinksGrid = ({ 
  links, 
  linkCategories, 
  viewMode,
  linksByCategory: providedLinksByCategory 
}: UnifiedLinksGridProps) => {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Group links by category if not provided
  const linksByCategory = useMemo(() => {
    if (providedLinksByCategory) {
      return providedLinksByCategory;
    }
    
    return links.reduce((acc, link) => {
      // Type guard to ensure categoryId exists
      const categoryId = 'categoryId' in link ? link.categoryId : '';
      if (categoryId && !acc[categoryId]) acc[categoryId] = [];
      if (categoryId) acc[categoryId].push(link);
      return acc;
    }, {} as Record<string, (Link | QuickLink)[]>);
  }, [links, providedLinksByCategory]);

  // Get categories that have links
  const categoriesWithLinks = linkCategories.filter(category => 
    linksByCategory[category.id] && linksByCategory[category.id].length > 0
  );

  const toggleSetItem = (set: Set<string>, item: string): Set<string> => {
    const newSet = new Set(set);
    if (newSet.has(item)) {
      newSet.delete(item);
    } else {
      newSet.add(item);
    }
    return newSet;
  };

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => toggleSetItem(prev, categoryId));
  };

  if (links.length === 0) {
    return null;
  }

  // Collapsed view - just a grid of all links
  if (viewMode === 'expanded') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {links.map((link) => (
          <UnifiedLinkCard
            key={link.id}
            linkData={link}
            variant="full"
          />
        ))}
      </div>
    );
  }

  // Expanded view - grouped by categories
  return (
    <div className="space-y-6">
      {categoriesWithLinks.map((category) => {
        const CategoryIcon = category.icon;
        const categoryLinks = linksByCategory[category.id] || [];
        const isCollapsed = collapsedCategories.has(category.id);

        return (
          <div key={category.id} className="border rounded-lg p-6 pt-3 bg-card">
            {/* Category Header */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b">
              <div className={cn("p-2 rounded-md", category.color)}>
                {CategoryIcon && <CategoryIcon className="h-5 w-5 text-white" />}
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {category.name}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {categoryLinks.length} {categoryLinks.length === 1 ? 'link' : 'links'}
                </Badge>
              </div>
              <div className="ml-auto" />
              {/* Only the chevron is clickable */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="p-1 hover:bg-accent rounded-md transition-colors"
                title={isCollapsed ? "Expand category" : "Collapse category"}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            </div>

            {/* Links Grid - Horizontal Layout - Conditionally Rendered */}
            {!isCollapsed && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
                {categoryLinks.map((link) => (
                  <UnifiedLinkCard
                    key={link.id}
                    linkData={link}
                    variant="compact"
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
