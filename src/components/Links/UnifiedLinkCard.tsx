import { ExternalLink, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Link } from "@/types/developer-portal";
import type { QuickLink } from "@/contexts/QuickLinksContext";
import { useLinkCard } from "@/hooks/useLinkCard";

interface UnifiedLinkCardProps {
  // Support both Link and QuickLink data structures
  linkData: Link | QuickLink;
  variant?: 'full' | 'compact'; // full = Links page, compact = Quick Links
}

export const UnifiedLinkCard = ({
  linkData,
  variant = 'full'
}: UnifiedLinkCardProps) => {
  // Helper function to safely extract favorite status from link data
  const getFavoriteStatus = (linkData: Link | QuickLink): boolean => {
    if ('isFavorite' in linkData && typeof linkData.isFavorite === 'boolean') {
      return linkData.isFavorite;
    }
    if ('favorite' in linkData && typeof linkData.favorite === 'boolean') {
      return linkData.favorite;
    }
    return false;
  };

  // Get behavior configuration from custom hook
  const {
    showStarButton,
    showDeleteButton,
    category,
    handleToggleFavorite,
    handleDelete
  } = useLinkCard(linkData);

  // Handle different favorite field names between contexts
  const isFavorite = getFavoriteStatus(linkData);

  // Extract common data
  const { id, title, url, description, tags = [] } = linkData;

  const CategoryIcon = category?.icon;
  const isCompact = variant === 'compact';

  // Create handlers for the action buttons
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (handleToggleFavorite) {
      handleToggleFavorite(id);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (handleDelete) {
      handleDelete(id, title);
    }
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group relative border rounded-lg p-5 hover:shadow-lg hover:border-primary/50 transition-all duration-200 bg-card block cursor-pointer min-h-[140px] flex flex-col"
    >
      {/* Header: Title + Actions */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="text-md font-semibold text-foreground group-hover:text-primary transition-colors flex-1 line-clamp-2 flex items-center gap-2">
          <span className="line-clamp-2">{title}</span>
          <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0 relative z-10">
          {showStarButton ? (
            <button
              onClick={handleFavoriteClick}
              className="p-1.5 hover:bg-accent rounded-md transition-colors"
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star
                className={cn(
                  "h-5 w-5 transition-all",
                  isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground hover:text-yellow-400"
                )}
              />
            </button>
          ) : null}
          {showDeleteButton && (
            <button
              onClick={handleDeleteClick}
              className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors"
              title="Delete link"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </button>
          )}
        </div>
      </div>

      {/* Description - Show in both variants if available */}
      {description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed flex-grow">
          {description}
        </p>
      )}

      {/* Tags - Only in full variant and hidden when width < 215px */}
      {!isCompact && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-xs px-2.5 py-0.5 font-normal"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer: Category - Always shown if category exists */}
      {category && (
        <div className="flex items-center gap-2 pt-3 border-t mt-auto">
          <div className={cn("p-2 rounded-md", category.color)}>
            {CategoryIcon && <CategoryIcon className="h-4 w-4 text-white" />}
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {category.name}
          </span>
        </div>
      )}
    </a>
  );
};
