import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { Link, LinkCategory, ViewLinksType } from '@/types/developer-portal';
import { useLinks, useCategories } from '@/hooks/api/useLinks';
import { useCurrentUser } from '@/hooks/api/useMembers';
import { useAddFavorite, useRemoveFavorite } from '@/hooks/api/mutations/useFavoriteMutations';
import { useToast } from '@/hooks/use-toast';
import { Cloud, Code, FileText, HelpCircle, Monitor, Shield, TestTube, Users, Wrench } from 'lucide-react';
import type { ApiLink, ApiCategory, UserMeResponse } from '@/types/api';

// Import Zustand hooks for UI state
import {
  useLinksSearchTerm,
  useLinksSelectedCategoryId,
  useLinksViewMode,
  useLinksSearchFilterActions,
} from '@/stores/linksPageStore';

// Centralized icon mapping - shared between QuickLinks and Links
export const SHARED_ICON_MAP: Record<string, any> = {
  Code,
  Shield,
  Monitor,
  Users,
  FileText,
  Wrench,
  Cloud,
  TestTube,
  HelpCircle,
};

export interface LinksPageContextValue {
  // Data
  links: Link[];
  linkCategories: LinkCategory[];
  isLoading: boolean;
  
  // Filter state (from Zustand)
  searchTerm: string;
  selectedCategoryId: string;
  setSearchTerm: (term: string) => void;
  setSelectedCategoryId: (categoryId: string) => void;
  
  // View state (from Zustand with localStorage)
  viewMode: ViewLinksType;
  setViewMode: (mode: ViewLinksType) => void;
  
  // Computed data
  filteredLinks: Link[];
  linksByCategory: Record<string, Link[]>;
  
  // Actions
  handleToggleFavorite: (linkId: string) => void;
  
  // Current user data
  currentUser: UserMeResponse | undefined;
  favoriteLinkIds: Set<string>;
}

const LinksPageContext = createContext<LinksPageContextValue | null>(null);

// Export the raw context for direct useContext access
export { LinksPageContext };

export const useLinksPageContext = () => {
  const context = useContext(LinksPageContext);
  if (!context) {
    throw new Error('useLinksPageContext must be used within a LinksProvider');
  }
  return context;
};

interface LinksProviderProps {
  children: React.ReactNode;
}

export const LinksProvider: React.FC<LinksProviderProps> = ({ children }) => {
  const { toast } = useToast();
  
  //  UI state from Zustand instead of useState
  const searchTerm = useLinksSearchTerm();
  const selectedCategoryId = useLinksSelectedCategoryId();
  const viewMode = useLinksViewMode(); // Now persisted via Zustand middleware
  
  // Actions from Zustand
  const { setSearchTerm, setSelectedCategoryId, setViewMode } = useLinksSearchFilterActions();
  
  // API hooks (stay with React Query)
  const { data: currentUser } = useCurrentUser();
  const { data: linksData, isLoading: isLoadingLinks } = useLinks();
  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories();
  
  // Mutations (stay with React Query)
  const addFavoriteMutation = useAddFavorite();
  const removeFavoriteMutation = useRemoveFavorite();
  
  // Transform API categories to LinkCategory format with icon components (PRESERVED from original)
  const linkCategories: LinkCategory[] = useMemo(() => {
    if (!categoriesData?.categories) return [];
    
    return categoriesData.categories.map((category: ApiCategory) => ({
      id: category.id,
      name: category.title,
      icon: SHARED_ICON_MAP[category.icon] || HelpCircle,
      color: category.color,
    }));
  }, [categoriesData]);
  
  // Get favorite link IDs from currentUser (PRESERVED from original)
  const favoriteLinkIds = useMemo(() => {
    if (!currentUser?.link) return new Set<string>();
    return new Set(currentUser.link.map(link => link.id));
  }, [currentUser]);
  
  // Transform API links to Link format (PRESERVED from original)
  const links: Link[] = useMemo(() => {
    if (!linksData) return [];
    
    return linksData.map((link: ApiLink) => ({
      id: link.id,
      title: link.title,
      url: link.url,
      description: link.description,
      categoryId: link.category_id,
      tags: link.tags,
      favorite: favoriteLinkIds.has(link.id),
    }));
  }, [linksData, favoriteLinkIds]);
  
  // Filter links based on search and category (PRESERVED from original, uses Zustand state)
  const filteredLinks = useMemo(() => {
    if (!links || !Array.isArray(links)) return [];
    
    return links.filter(link => {
      if (!link || typeof link.title !== 'string') return false;
      const titleLower = link.title.toLowerCase();
      const descriptionLower = link.description?.toLowerCase() || '';
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = titleLower.includes(searchTermLower) ||
        descriptionLower.includes(searchTermLower);
      const matchesCategory = selectedCategoryId === "all" || link.categoryId === selectedCategoryId;
      return matchesSearch && matchesCategory;
    });
  }, [links, searchTerm, selectedCategoryId]);
  
  // Group filtered links by category (PRESERVED from original)
  const linksByCategory = useMemo(() => {
    return filteredLinks.reduce((acc, link) => {
      if (!acc[link.categoryId]) acc[link.categoryId] = [];
      acc[link.categoryId].push(link);
      return acc;
    }, {} as Record<string, Link[]>);
  }, [filteredLinks]);
  
  // Handle toggle favorite (PRESERVED from original)
  const handleToggleFavorite = useCallback((linkId: string) => {
    if (!currentUser?.id) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to manage favorites.",
      });
      return;
    }
    
    const link = links.find(l => l.id === linkId);
    if (!link) return;
    
    const isFavorite = favoriteLinkIds.has(linkId);
    
    if (isFavorite) {
      // Remove from favorites
      removeFavoriteMutation.mutate(
        { userId: currentUser.id, linkId },
        {
          onSuccess: () => {
            toast({
              title: "Removed from favorites",
              description: "This link has been removed from your favorites.",
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
    } else {
      // Add to favorites
      addFavoriteMutation.mutate(
        { userId: currentUser.id, linkId },
        {
          onSuccess: () => {
            toast({
              title: "Added to favorites",
              description: "This link has been added to your favorites.",
            });
          },
          onError: (error) => {
            toast({
              variant: "destructive",
              title: "Failed to add to favorites",
              description: error.message || "There was an error adding this link to your favorites.",
            });
          }
        }
      );
    }
  }, [currentUser, links, favoriteLinkIds, addFavoriteMutation, removeFavoriteMutation, toast]);
  
  const contextValue: LinksPageContextValue = {
    links,
    linkCategories,
    isLoading: isLoadingLinks || isLoadingCategories,
    searchTerm,
    selectedCategoryId,
    setSearchTerm,
    setSelectedCategoryId,
    viewMode,
    setViewMode,
    filteredLinks,
    linksByCategory,
    handleToggleFavorite,
    currentUser,
    favoriteLinkIds,
  };
  
  return (
    <LinksPageContext.Provider value={contextValue}>
      {children}
    </LinksPageContext.Provider>
  );
};