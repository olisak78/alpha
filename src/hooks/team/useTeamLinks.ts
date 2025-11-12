import { useState, useEffect, useMemo } from 'react';
import { useUpdateTeamLinks } from '@/hooks/api/mutations/useTeamMutations';
import { useDeleteLink } from '@/hooks/api/mutations/useLinksMutations';
import { useTeamById } from '@/hooks/api/useTeams';
import { useCategories } from '@/hooks/api/useLinks';
import { useCurrentUser } from '@/hooks/api/useMembers';
import { useAddFavorite, useRemoveFavorite } from '@/hooks/api/mutations/useFavoriteMutations';
import { apiClient } from '@/services/ApiClient';
import { useToast } from '@/hooks/use-toast';
import { defaultLinkForm } from '@/constants/developer-portal';
import type { TeamLink, LinkFormData } from '@/components/Team/types';
import type { ApiCategory } from '@/types/api';

interface UseTeamLinksProps {
  teamId?: string;
  initialLinks?: TeamLink[];
  teamOwner?: string;
}

export function useTeamLinks({ teamId, initialLinks = [], teamOwner }: UseTeamLinksProps) {
  const [links, setLinks] = useState<TeamLink[]>(initialLinks);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkForm, setLinkForm] = useState<LinkFormData>(defaultLinkForm);
  const [editingLink, setEditingLink] = useState<TeamLink | null>(null);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const { toast } = useToast();

  // Use the useTeamById and useCategories hooks to fetch and manage data
  const { data: teamData, refetch: refetchTeam } = useTeamById(teamId || '');
  const { data: categoriesData } = useCategories();
  
  // Use current user data and favorite mutations
  const { data: currentUser } = useCurrentUser();
  const addFavoriteMutation = useAddFavorite();
  const removeFavoriteMutation = useRemoveFavorite();

  // Helper function to convert API team links to local format
  const convertApiLinksToLocal = (apiLinks: typeof teamData.links): any[] => {
    if (!apiLinks) return [];
    return apiLinks.map(link => ({
      id: link.id,
      name: link.name,
      title: link.name, // Add title property for QuickLinksTab compatibility
      url: link.url,
      category_id: link.category_id,
      description: link.description || "",
      owner: teamId || "",
      tags: Array.isArray(link.tags) ? link.tags.join(',') : (link.tags || ""),
      favorite: link.favorite || false // Preserve favorite property from API
    }));
  };

  // Helper function to update links after API operations
  const updateLinksFromTeamData = async () => {
    const result = await refetchTeam();
    if (result.data?.links) {
      setLinks(convertApiLinksToLocal(result.data.links));
    }
  };

  // Update links when team data is loaded from API (prioritize server data)
  useEffect(() => {
    if (teamData?.links) {
      setLinks(convertApiLinksToLocal(teamData.links));
    }
  }, [teamData?.links, teamId]);

  // Initialize with initialLinks only once when teamId changes and no server data exists
  useEffect(() => {
    if (!teamData?.links && initialLinks && initialLinks.length > 0) {
      setLinks(initialLinks);
    }
  }, [teamId]); // Only depend on teamId, not initialLinks

  // Delete link mutation
  const deleteLinkMutation = useDeleteLink({
    onSuccess: () => {
      toast({
        title: "Link removed successfully",
        description: "The team link has been removed from your team.",
      });
    },
    onError: (error) => {
      console.error('Failed to remove team link:', error);
      toast({
        variant: "destructive",
        title: "Failed to remove link",
        description: "There was an error removing the link. Please try again.",
      });
    }
  });

  // Update team links mutation for editing links
  const updateTeamLinksMutation = useUpdateTeamLinks({
    onSuccess: () => {
      toast({
        title: "Link updated successfully",
        description: "The team link has been updated.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update link",
        description: "There was an error updating the link. Please try again.",
      });
    }
  });

  const addNewLink = async () => {
    if (!teamId) {
      console.error('Team ID is required to add a link');
      return;
    }

    setIsAddingLink(true);

    // Create optimistic link object
    const optimisticLink: TeamLink = {
      id: `temp-${Date.now()}`,
      name: linkForm.title,
      url: linkForm.url,
      category_id: linkForm.existingCategory,
      description: "some description",
      owner: teamId,
      tags: ""
    };

    // Optimistically update the local state
    const previousLinks = [...links];
    setLinks(prevLinks => [...prevLinks, optimisticLink]);
    closeLinkDialog();

    try {
      await apiClient.post('/links', {
        name: linkForm.title,
        description: "some description",
        owner: teamId,
        url: linkForm.url,
        category_id: linkForm.existingCategory,
        tags: ""
      });

      await updateLinksFromTeamData();
      
      toast({
        title: "Link added successfully",
        description: "The team link has been added to your team.",
      });
    } catch (error) {
      console.error('Failed to add team link:', error);
      
      // Revert optimistic update on error
      setLinks(previousLinks);
      
      // Reopen dialog with the form data intact for retry
      setLinkForm({
        title: optimisticLink.name,
        url: optimisticLink.url,
        existingCategory: optimisticLink.category_id || ''
      });
      setLinkDialogOpen(true);

      toast({
        variant: "destructive",
        title: "Failed to add link",
        description: "There was an error adding the link. Please try again.",
      });
    } finally {
      setIsAddingLink(false);
    }
  };

  const handleLinkSubmit = () => {
    if (!linkForm.title || !linkForm.url || !linkForm.existingCategory) {
      return;
    }

    if (editingLink) {
      if (!teamId) {
        console.error('Team ID is required to update a link');
        return;
      }

      // Prepare the links data for the API using the UpdateTeamLinksRequest format
      const updatedLinks = links.map(link =>
        link.name === editingLink.name && link.url === editingLink.url
          ? { ...link, name: linkForm.title, url: linkForm.url, category_id: linkForm.existingCategory }
          : link
      );

      const linksData = updatedLinks.map(link => ({
        category: link.category_id || '',
        icon: '',
        title: link.name,
        url: link.url
      }));

      // Call the update team links mutation with the updated links
      updateTeamLinksMutation.mutate({
        teamId,
        data: {
          links: linksData
        }
      });

      // Close dialog immediately after initiating the mutation
      closeLinkDialog();
    } else {
      addNewLink();
    }
  };

  const removeLink = async (linkToRemove: TeamLink) => {
    try {
      let linkIdToDelete = linkToRemove.id;

      // If no ID or temp ID, find the link in team data
      if (!linkIdToDelete || linkIdToDelete.startsWith('temp-')) {
        if (!teamId) {
          console.error('Team ID is required to remove a link without ID');
          return;
        }

        const fetchedLink = teamData?.links?.find(apiLink => 
          apiLink.url === linkToRemove.url && apiLink.name === linkToRemove.name
        );

        if (!fetchedLink?.id) {
          console.error('Cannot remove link: No ID found and unable to match with team data');
          toast({
            variant: "destructive",
            title: "Cannot remove link",
            description: "This link cannot be removed because it doesn't have a valid ID. Please refresh the page and try again.",
          });
          return;
        }
        linkIdToDelete = fetchedLink.id;
      }

      // Delete the link from the server
      await deleteLinkMutation.mutateAsync(linkIdToDelete);
      
      // Remove the link from users' favorites if they have it favorited
      // This ensures that when a team link is deleted, it's also removed from users' quick links
      if (currentUser?.link?.some(userLink => userLink.id === linkIdToDelete && userLink.favorite === true)) {
        try {
          await removeFavoriteMutation.mutateAsync({ userId: currentUser.id, linkId: linkIdToDelete });
        } catch (favoriteError) {
          // Log the error but don't fail the whole operation
          console.warn('Failed to remove deleted team link from user favorites:', favoriteError);
        }
      }
      
      await updateLinksFromTeamData();
    } catch (error) {
      console.error('Failed to remove team link:', error);
      toast({
        variant: "destructive",
        title: "Failed to remove link",
        description: "There was an error removing the link. Please try again.",
      });
    }
  };

  const editLink = (link: TeamLink) => {
    setEditingLink(link);
    
    setLinkForm({
      title: link.name,
      url: link.url,
      existingCategory: link.category_id || ''
    });
    setLinkDialogOpen(true);
  };

  const openAddLinkDialog = () => {
    setLinkDialogOpen(true);
  };

  const closeLinkDialog = () => {
    setLinkDialogOpen(false);
    setEditingLink(null);
    setLinkForm(defaultLinkForm);
  };

  // Handle toggling favorite status for team links
  const toggleFavorite = (linkId: string) => {
    if (!currentUser?.id) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to manage favorites.",
      });
      return;
    }

    // Determine current favorite status from user data, not team link data
    const isCurrentlyFavorite = currentUser?.link?.some(userLink => userLink.id === linkId && userLink.favorite === true) || false;

    // Make API call
    const mutation = isCurrentlyFavorite ? removeFavoriteMutation : addFavoriteMutation;
    
    mutation.mutate(
      { userId: currentUser.id, linkId },
      {
        onSuccess: () => {
          toast({
            title: isCurrentlyFavorite ? "Removed from favorites" : "Added to favorites",
            description: isCurrentlyFavorite 
              ? "This link has been removed from your favorites." 
              : "This link has been added to your favorites.",
          });
          // The user data will be automatically refreshed by the mutation's onSuccess callback
          // which will trigger a re-render of mappedTeamLinks with updated favorite status
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: isCurrentlyFavorite ? "Failed to remove from favorites" : "Failed to add to favorites",
            description: error.message || "There was an error updating your favorites.",
          });
        }
      }
    );
  };

  // Get existing categories used by current links as category IDs
  const existingCategories: string[] = useMemo(() => {
    if (!categoriesData?.categories) return [];
    
    // Get unique category IDs from current links
    const usedCategoryIds = new Set(
      links.map(link => link.category_id).filter(Boolean)
    );
    
    // Return array of category IDs that are used
    return Array.from(usedCategoryIds);
  }, [links, categoriesData]);

  return {
    // State
    links,
    linkDialogOpen,
    linkForm,
    editingLink,
    existingCategories,
    isAddingLink,
    
    // Actions
    setLinkForm,
    handleLinkSubmit,
    removeLink,
    editLink,
    openAddLinkDialog,
    closeLinkDialog,
    setLinks, // Export setLinks for external updates
    toggleFavorite, // Export toggleFavorite for favorite functionality
    
    // Dialog handlers
    onLinkDialogOpenChange: (open: boolean) => {
      setLinkDialogOpen(open);
      if (!open) {
        closeLinkDialog();
      }
    }
  };
}
