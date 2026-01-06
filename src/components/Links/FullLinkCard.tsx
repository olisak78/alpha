import { ExternalLink, Pencil, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Link } from "@/types/developer-portal";
import type { QuickLink } from "@/contexts/QuickLinksContext";
import { useLinksSearchFilterActions } from "@/stores/linksPageStore";

interface Category {
  id: string;
  name: string;
  icon?: React.ComponentType<{ className?: string }>;
  color: string;
}

interface FullLinkCardProps {
  linkData: Link | QuickLink;
  isFavorite: boolean;
  showStarButton: boolean;
  showDeleteButton: boolean;
  showEditButton?: boolean;
  category?: Category;
  onToggleFavorite?: (linkId: string) => void;
  onDelete?: (linkId: string, linkTitle: string) => void;
  onEdit?: (linkId: string) => void;
}

export const FullLinkCard = ({ 
  linkData, 
  isFavorite, 
  showStarButton, 
  showDeleteButton, 
  showEditButton = false,
  category, 
  onToggleFavorite, 
  onDelete,
  onEdit 
}: FullLinkCardProps) => {
  
  const { id, title, url, description, tags = [] } = linkData;

  const CategoryIcon = category?.icon;

  // Search filter actions from Zustand
  const { setSearchTerm } = useLinksSearchFilterActions();

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSearchTerm(tag);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent, tag: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      setSearchTerm(tag);
    }
  };

 const handleCategoryClick = (e: React.MouseEvent, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSearchTerm(name);
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent, name: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      setSearchTerm(name);
    }
  };

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

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) {
      onEdit(id);
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
           {showEditButton && (
            <button
              onClick={handleEditClick}
              className="p-1.5 hover:bg-accent rounded-md transition-colors"
              title="Edit link"
            >
              <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
            </button>
          )}
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

      {/* Description - Show if available */}
      {description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed flex-grow">
          {description}
        </p>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              role="button"
              tabIndex={0}
              title={`Search by tag "${tag}"`}
              onClick={(e) => handleTagClick(e, tag)}
              onKeyDown={(e) => handleTagKeyDown(e, tag)}
              className="text-xs px-2.5 py-0.5 font-normal cursor-pointer transition-all hover:bg-primary/15 hover:text-primary hover:border-primary/50 hover:shadow-sm hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer: Category - Always shown if category exists */}
      {category && (
        <div className="flex items-center gap-2 pt-3 border-t mt-auto">
          <div
            role="button"
            tabIndex={0}
            title={`Search by category "${category.name}"`}
            onClick={(e) => handleCategoryClick(e, category.name)}
            onKeyDown={(e) => handleCategoryKeyDown(e, category.name)}
            className="group flex items-center gap-2 hover:bg-primary/10 border border-border hover:border-primary/40 rounded-md p-1.5 cursor-pointer transition-colors"
          >
            <div className={cn("p-2 rounded-md transition-all group-hover:ring-2 group-hover:ring-primary/40", category.color)}>
              {CategoryIcon && <CategoryIcon className="h-4 w-4 text-white" />}
            </div>
            <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-primary">
              {category.name}
            </span>
          </div>
        </div>
      )}
    </a>
  );
};
