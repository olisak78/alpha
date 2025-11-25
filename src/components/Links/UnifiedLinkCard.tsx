import { Link } from "@/types/developer-portal";
import type { QuickLink } from "@/contexts/QuickLinksContext";
import { CompactLinkCard } from "./CompactLinkCard";
import { FullLinkCard } from "./FullLinkCard";
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

  // Common props for both variants
  const commonProps = {
    linkData,
    isFavorite,
    showStarButton,
    showDeleteButton,
    onToggleFavorite: handleToggleFavorite,
    onDelete: handleDelete
  };

  // Use the appropriate component based on variant
  if (variant === 'compact') {
    return <CompactLinkCard {...commonProps} />;
  }

  return <FullLinkCard {...commonProps} category={category} />;
};
