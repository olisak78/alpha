import { useContext } from "react";
import { QuickLinksContext } from "@/contexts/QuickLinksContext";
import { LinksPageContext } from "@/contexts/LinksPageContext";
import { Link } from "@/types/developer-portal";
import type { QuickLink } from "@/contexts/QuickLinksContext";

type ContextType = 'quicklinks' | 'links' | 'none';

export const useLinkCard = (linkData: Link | QuickLink) => {
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

  // Always call hooks in the same order - useContext returns null when not within provider
  const quickLinksContext = useContext(QuickLinksContext);
  const linksContext = useContext(LinksPageContext);

  // Determine context type based on which contexts are available
  const contextType: ContextType = quickLinksContext ? 'quicklinks' : 
                                   linksContext ? 'links' : 'none';

  // Configure behavior based on context type
  let handleToggleFavorite: ((linkId: string) => void) | undefined;
  let handleDelete: ((linkId: string, linkTitle: string) => void) | undefined;
  let handleEdit: ((linkId: string) => void) | undefined;
  let linkCategories: any[] = [];
  let alwaysShowDelete = false;
  let showStarButton = false;

  switch (contextType) {
    case 'quicklinks':
      handleToggleFavorite = quickLinksContext!.handleToggleFavorite;
      handleDelete = quickLinksContext!.handleDeleteClick;
      handleEdit = quickLinksContext!.handleEditClick;
      linkCategories = quickLinksContext!.linkCategories;
      alwaysShowDelete = quickLinksContext!.alwaysShowDelete || false;
      // HomePage (Quick Links): Show star if link is favorite. Teams: always show star
      showStarButton = getFavoriteStatus(linkData) || alwaysShowDelete;
      break;
      
    case 'links':
      handleToggleFavorite = linksContext!.handleToggleFavorite;
      linkCategories = linksContext!.linkCategories;
      alwaysShowDelete = false;
      // LinksPage Always show star
      showStarButton = true;
      break;
      
    case 'none':
    default:
      // No context - no interactive features
      showStarButton = false;
      break;
  }

  // Find category for this link
  const category = linkCategories.find(cat => cat.id === linkData.categoryId);
  
  // Determine when delete button should be shown using early returns
  const showDeleteButton = (() => {
    if (!handleDelete) return false;
    if (alwaysShowDelete) return true;
    if (contextType === 'quicklinks') {
      return !getFavoriteStatus(linkData);
    }
    return false;
  })();

  // Edit button should be shown only for deletable links (same logic as delete button)
  const showEditButton = showDeleteButton && !!handleEdit;

  return {
    showStarButton,
    showDeleteButton,
    showEditButton,
    category,
    handleToggleFavorite,
    handleDelete,
    handleEdit
  };
};
