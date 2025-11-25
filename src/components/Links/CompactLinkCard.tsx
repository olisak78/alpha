import { Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@/types/developer-portal";
import type { QuickLink } from "@/contexts/QuickLinksContext";

interface CompactLinkCardProps {
  linkData: Link | QuickLink;
  isFavorite: boolean;
  showStarButton: boolean;
  showDeleteButton: boolean;
  onToggleFavorite?: (linkId: string) => void;
  onDelete?: (linkId: string, linkTitle: string) => void;
}

export const CompactLinkCard = ({ 
  linkData, 
  isFavorite, 
  showStarButton, 
  showDeleteButton, 
  onToggleFavorite, 
  onDelete 
}: CompactLinkCardProps) => {
  // Extract common data
  const { id, title, url } = linkData;

  // Create handlers for the action buttons
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(id);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(id, title);
    }
  };

  return (
    <div className="group">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="block px-3 py-1.5 border rounded hover:shadow-sm hover:border-primary/50 transition-all duration-200 bg-background relative"
      >
        <div className="flex items-start gap-2">
          {/* Star on the left */}
          {showStarButton && (
            <button
              onClick={handleFavoriteClick}
              className="p-1 hover:bg-accent rounded-md transition-colors flex-shrink-0 relative z-10"
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star
                className={cn(
                  "h-4 w-4 transition-all",
                  isFavorite 
                    ? "fill-yellow-400 text-yellow-400" 
                    : "text-muted-foreground hover:text-yellow-400"
                )}
              />
            </button>
          )}
          
          <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1 flex-1">
            {title}
          </h4>
          
          {/* Delete button on the right */}
          {showDeleteButton && (
            <button
              onClick={handleDeleteClick}
              className="p-1 hover:bg-destructive/10 rounded-md transition-colors flex-shrink-0 relative z-10"
              title="Delete link"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </button>
          )}
        </div>
      </a>
    </div>
  );
};
