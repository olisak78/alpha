import React, { createContext, useContext, useCallback, useMemo, useState } from 'react';
import { UserMeResponse, UserLink } from '@/types/api';
import { useCategories } from '@/hooks/api/useLinks';
import { useCurrentUser } from '@/hooks/api/useMembers';
import { useRemoveFavorite } from '@/hooks/api/mutations/useFavoriteMutations';
import { useDeleteLink } from '@/hooks/api/mutations/useDeleteLinkMutation';
import { useToast } from '@/hooks/use-toast';
import { LinkCategory, ViewLinksType } from '@/types/developer-portal';
import { HelpCircle } from 'lucide-react';
import { SHARED_ICON_MAP } from './LinksPageContext';

// Re-export for backward compatibility
export const ICON_MAP = SHARED_ICON_MAP;

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  category: string;
  categoryId: string;
  categoryColor: string;
  description?: string;
  tags?: string[];
  isFavorite: boolean;
}

export interface QuickLinksContextValue {
  // Data
  quickLinks: QuickLink[];
  filteredQuickLinks: QuickLink[];
  linkCategories: LinkCategory[];
  isLoading: boolean;
  
  // Search and Filter
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategoryId: string;
  setSelectedCategoryId: (categoryId: string) => void;
  
  // View state
  viewMode: ViewLinksType;
  setViewMode: (mode: ViewLinksType) => void;
  
  // Actions
  handleToggleFavorite: (linkId: string) => void;
  handleDeleteClick: (linkId: string, linkTitle: string) => void;
  handleDeleteConfirm: () => void;
  handleDeleteCancel: () => void;
  
  // Delete dialog state
  deleteDialog: {
    isOpen: boolean;
    linkId: string;
    linkTitle: string;
  };
  
  // Configuration
  ownerId?: string;
  customHandlers?: {
    onDeleteLink?: (linkId: string) => void;
    onToggleFavorite?: (linkId: string) => void;
  };
  alwaysShowDelete?: boolean;
}

const QuickLinksContext = createContext<QuickLinksContextValue | null>(null);

// Export the raw context for direct useContext access
export { QuickLinksContext };

export const useQuickLinksContext = () => {
  const context = useContext(QuickLinksContext);
  if (!context) {
    throw new Error('useQuickLinksContext must be used within a QuickLinksProvider');
  }
  return context;
};

interface QuickLinksProviderProps {
  children: React.ReactNode;
  userData?: UserMeResponse;
  ownerId?: string;
  customHandlers?: {
    onDeleteLink?: (linkId: string) => void;
    onToggleFavorite?: (linkId: string) => void;
  };
  alwaysShowDelete?: boolean;
}

export const QuickLinksProvider: React.FC<QuickLinksProviderProps> = ({
  children,
  userData,
  ownerId,
  customHandlers,
  alwaysShowDelete,
}) => {
  const { toast } = useToast();
  const { data: currentUser } = useCurrentUser();
  const removeFavoriteMutation = useRemoveFavorite();
  const deleteLinkMutation = useDeleteLink();
  const { data: categoriesData } = useCategories();

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  
  // Initialize viewMode from localStorage or default to 'collapsed'
  const [viewMode, setViewModeState] = useState<ViewLinksType>(() => {
    try {
      const saved = localStorage.getItem('links-view-mode');
      return (saved === 'collapsed' || saved === 'expanded') ? saved : 'collapsed';
    } catch {
      return 'collapsed';
    }
  });

  // Wrapper function to save to localStorage when viewMode changes
  const setViewMode = (mode: ViewLinksType) => {
    setViewModeState(mode);
    try {
      localStorage.setItem('links-view-mode', mode);
    } catch (error) {
      console.warn('Failed to save view mode to localStorage:', error);
    }
  };

  // Create category map
  const categoryMap = useMemo(() => {
    if (!categoriesData?.categories) return new Map();
    return new Map(
      categoriesData.categories.map(cat => [cat.id, cat])
    );
  }, [categoriesData]);

  // Transform UserLink[] to QuickLink format
  const quickLinks = useMemo(() => {
    if (!userData?.link || userData.link.length === 0) {
      return [];
    }

    return userData.link.map((link: UserLink) => {
      const category = categoryMap.get(link.category_id);
      
      return {
        id: link.id,
        title: link.title,
        url: link.url,
        icon: category?.icon || 'HelpCircle',
        category: category?.title || link.name,
        categoryId: link.category_id,
        categoryColor: category?.color || 'bg-primary',
        description: link.description,
        tags: link.tags || [],
        isFavorite: link.favorite === true,
      };
    });
  }, [userData, categoryMap]);

  // Transform categories to LinkCategory format for filters
  const linkCategories: LinkCategory[] = useMemo(() => {
    if (!categoriesData?.categories) return [];
    
    const categoryIdsWithLinks = new Set(
      quickLinks.map(link => link.categoryId)
    );
    
    return categoriesData.categories
      .filter(category => categoryIdsWithLinks.has(category.id))
      .map((category) => ({
        id: category.id,
        name: category.title,
        icon: SHARED_ICON_MAP[category.icon] || HelpCircle,
        color: category.color,
      }));
  }, [categoriesData, quickLinks]);

  // Filter links based on search term and selected category
  const filteredQuickLinks = useMemo(() => {
    return quickLinks.filter(link => {
      // Filter by category
      if (selectedCategoryId !== "all" && link.categoryId !== selectedCategoryId) {
        return false;
      }

      // Filter by search term
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        return (
          link.title.toLowerCase().includes(searchLower) ||
          link.description?.toLowerCase().includes(searchLower) ||
          link.category.toLowerCase().includes(searchLower) ||
          link.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      return true;
    });
  }, [quickLinks, selectedCategoryId, searchTerm]);

  const handleToggleFavorite = useCallback((linkId: string) => {
    // Use custom handler if provided (for team links)
    if (customHandlers?.onToggleFavorite) {
      customHandlers.onToggleFavorite(linkId);
      return;
    }

    // Default behavior for user links
    if (!currentUser?.id) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to manage favorites.",
      });
      return;
    }

    removeFavoriteMutation.mutate(
      { userId: currentUser.id, linkId },
      {
        onSuccess: () => {
          toast({
            title: "Removed from favorites",
            description: "This link has been removed from your favorites and Quick Links.",
          });
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Failed to remove from favorites",
            description: error.message || "There was an error removing this link from your favorites.",
          });
        }
      }
    );
  }, [customHandlers, currentUser, removeFavoriteMutation, toast]);

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    linkId: '',
    linkTitle: '',
  });

  const handleDeleteClick = useCallback((linkId: string, linkTitle: string) => {
    setDeleteDialog({
      isOpen: true,
      linkId,
      linkTitle,
    });
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialog({
      isOpen: false,
      linkId: '',
      linkTitle: '',
    });
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    const { linkId } = deleteDialog;
    if (!linkId) return;

    // Use custom handler if provided (for team links with optimistic updates)
    if (customHandlers?.onDeleteLink) {
      customHandlers.onDeleteLink(linkId);
      handleDeleteCancel();
      return;
    }

    // Default delete behavior for user links
    deleteLinkMutation.mutate(linkId, {
      onSuccess: () => {
        toast({
          title: "Link deleted",
          description: "The link has been deleted successfully.",
        });
        handleDeleteCancel();
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Failed to delete link",
          description: error.message || "There was an error deleting this link.",
        });
        handleDeleteCancel();
      }
    });
  }, [deleteDialog, customHandlers, deleteLinkMutation, toast, handleDeleteCancel]);

  const contextValue: QuickLinksContextValue = {
    quickLinks,
    filteredQuickLinks,
    linkCategories,
    isLoading: !userData,
    searchTerm,
    setSearchTerm,
    selectedCategoryId,
    setSelectedCategoryId,
    viewMode,
    setViewMode,
    handleToggleFavorite,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    deleteDialog,
    ownerId,
    customHandlers,
    alwaysShowDelete,
  };

  return (
    <QuickLinksContext.Provider value={contextValue}>
      {children}
    </QuickLinksContext.Provider>
  );
};
