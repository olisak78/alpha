import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Store, AlertCircle, RefreshCw, Loader2, Info, Search } from 'lucide-react';
import { usePlugins, PluginApiData } from '@/hooks/api/usePlugins';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { apiClient } from '@/services/ApiClient';
import { DEFAULT_PAGE_SIZE, initialFormData, RegistrationFormData, RegistrationFormErrors, validateForm } from '@/plugins/models/models';
import PluginCard from '@/plugins/components/PluginCard';
import PluginCardSkeleton from '@/plugins/components/PluginCardSkeleton';
import Pagination from '@/plugins/components/Pagination';
import SearchBar from '@/plugins/components/SearchBar';
import RegisterPluginDialog from '@/plugins/components/RegisterPluginDialog';


export default function PluginMarketplacePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = DEFAULT_PAGE_SIZE;

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPlugin, setEditingPlugin] = useState<PluginApiData | null>(null);
  const [editFormData, setEditFormData] = useState<RegistrationFormData>(initialFormData);
  const [editFormErrors, setEditFormErrors] = useState<RegistrationFormErrors>({});
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Delete confirmation dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingPlugin, setDeletingPlugin] = useState<PluginApiData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate offset for pagination
  const offset = (currentPage - 1) * pageSize;

  // Fetch plugins with pagination
  const { data, isLoading, isError, error, refetch, isFetching } = usePlugins({
    limit: pageSize,
    offset,
  });

  // Calculate pagination info
  const totalItems = data?.total ?? 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      // Reset to first page when search changes
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter plugins based on search query
  const filteredPlugins = useMemo(() => {
    if (!data?.plugins) return [];

    if (!debouncedSearchQuery.trim()) {
      return data.plugins;
    }

    const query = debouncedSearchQuery.toLowerCase();
    return data.plugins.filter(plugin =>
      plugin.title.toLowerCase().includes(query) ||
      plugin.name.toLowerCase().includes(query) ||
      plugin.description?.toLowerCase().includes(query) ||
      plugin.owner.toLowerCase().includes(query)
    );
  }, [data?.plugins, debouncedSearchQuery]);

  // Update pagination based on filtered results
  const filteredTotalItems = filteredPlugins.length;
  const filteredTotalPages = Math.ceil(filteredTotalItems / pageSize);
  const paginatedPlugins = filteredPlugins.slice(offset, offset + pageSize);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= filteredTotalPages) {
      setCurrentPage(newPage);
    }
  };

  // Handle opening a plugin
  const handleOpenPlugin = (plugin: PluginApiData) => {
    // Create a URL-friendly slug from the plugin name
    const slug = plugin.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/plugins/${slug}`);
  };

  // Handle successful registration
  const handleRegistrationSuccess = async () => {
    await refetch();
  };

  // Handle form field changes for editing
  const handleEditFormChange = (field: keyof RegistrationFormData, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (editFormErrors[field as keyof RegistrationFormErrors]) {
      setEditFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle edit button click
  const handleEditPlugin = (plugin: PluginApiData) => {
    setEditingPlugin(plugin);
    setEditFormData({
      name: plugin.name,
      title: plugin.title,
      description: plugin.description || '',
      bundleUrl: plugin.react_component_path || '',
      backendUrl: plugin.backend_server_url || '',
    });
    setEditFormErrors({});
    setIsEditDialogOpen(true);
  };

  // Handle edit form submission
  const handleUpdatePlugin = async () => {
    if (!editingPlugin) return;

    // Validate form
    const errors = validateForm(editFormData);
    setEditFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsEditSubmitting(true);

    try {
      const payload = {
        backend_server_url: editFormData.backendUrl.trim() || null,
        description: editFormData.description.trim(),
        icon: editingPlugin.icon || 'Puzzle',
        name: editFormData.name.trim(),
        owner: editingPlugin.owner,
        react_component_path: editFormData.bundleUrl.trim(),
        title: editFormData.title.trim(),
      };

      await apiClient.put(`/plugins/${editingPlugin.id}`, payload);

      // Close dialog and reset state
      setIsEditDialogOpen(false);
      setEditingPlugin(null);
      setEditFormData(initialFormData);
      setEditFormErrors({});

      // Show success toast
      toast({
        title: "Success",
        description: `Plugin "${editFormData.title}" updated successfully!`,
        variant: "default",
      });

      // Refresh plugins list
      await refetch();
    } catch (error) {
      console.error('[PluginMarketplacePage] Failed to update plugin:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update plugin';

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Handle delete button click
  const handleDeletePlugin = (plugin: PluginApiData) => {
    setDeletingPlugin(plugin);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!deletingPlugin) return;

    setIsDeleting(true);

    try {
      await apiClient.delete(`/plugins/${deletingPlugin.id}`);

      // Close dialog and reset state
      setIsDeleteDialogOpen(false);
      const deletedTitle = deletingPlugin.title;
      setDeletingPlugin(null);

      // Show success toast
      toast({
        title: "Success",
        description: `Plugin "${deletedTitle}" deleted successfully!`,
        variant: "default",
      });

      // Refresh plugins list
      await refetch();
    } catch (error) {
      console.error('[PluginMarketplacePage] Failed to delete plugin:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete plugin';

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset form when edit dialog closes
  const handleEditDialogOpenChange = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setEditingPlugin(null);
      setEditFormData(initialFormData);
      setEditFormErrors({});
    }
  };

  // Reset state when delete dialog closes
  const handleDeleteDialogOpenChange = (open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open) {
      setDeletingPlugin(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Plugin Marketplace</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Discover and install plugins to extend your developer portal capabilities
            </p>
          </div>
          <div className="flex gap-2">
            {/* Register Plugin Button */}
            <RegisterPluginDialog onSuccess={handleRegistrationSuccess} />

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        debouncedSearchQuery={debouncedSearchQuery}
        filteredTotalItems={filteredTotalItems}
      />

      {/* Edit Plugin Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Plugin</DialogTitle>
            <DialogDescription>
              Update the plugin details below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="editPluginName">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="editPluginName"
                placeholder="e.g., my-awesome-plugin"
                value={editFormData.name}
                onChange={(e) => handleEditFormChange('name', e.target.value)}
                className={editFormErrors.name ? 'border-red-500' : ''}
              />
              {editFormErrors.name && (
                <p className="text-xs text-red-500">{editFormErrors.name}</p>
              )}
            </div>

            {/* Title Field */}
            <div className="space-y-2">
              <Label htmlFor="editPluginTitle">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="editPluginTitle"
                placeholder="e.g., My Awesome Plugin"
                value={editFormData.title}
                onChange={(e) => handleEditFormChange('title', e.target.value)}
                className={editFormErrors.title ? 'border-red-500' : ''}
              />
              {editFormErrors.title && (
                <p className="text-xs text-red-500">{editFormErrors.title}</p>
              )}
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="editPluginDescription">Description</Label>
              <Textarea
                id="editPluginDescription"
                placeholder="Describe what your plugin does..."
                value={editFormData.description}
                onChange={(e) => handleEditFormChange('description', e.target.value)}
                rows={3}
              />
            </div>

            {/* Bundle URL Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="editPluginBundleUrl">
                  Bundle URL <span className="text-red-500">*</span>
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>URL to the compiled JavaScript bundle (e.g., plugin.js)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="editPluginBundleUrl"
                type="url"
                placeholder="e.g., https://example.com/plugin.js"
                value={editFormData.bundleUrl}
                onChange={(e) => handleEditFormChange('bundleUrl', e.target.value)}
                className={editFormErrors.bundleUrl ? 'border-red-500' : ''}
              />
              {editFormErrors.bundleUrl && (
                <p className="text-xs text-red-500">{editFormErrors.bundleUrl}</p>
              )}
            </div>

            {/* Backend URL Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="editPluginBackendUrl">
                  Backend URL 
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>URL to the plugin's backend server for API calls (optional)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="editPluginBackendUrl"
                type="url"
                placeholder="e.g., https://api.example.com"
                value={editFormData.backendUrl}
                onChange={(e) => handleEditFormChange('backendUrl', e.target.value)}
                className={editFormErrors.backendUrl ? 'border-red-500' : ''}
              />
              {editFormErrors.backendUrl && (
                <p className="text-xs text-red-500">{editFormErrors.backendUrl}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleEditDialogOpenChange(false)}
              disabled={isEditSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePlugin}
              disabled={isEditSubmitting}
            >
              {isEditSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Plugin'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Plugin</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingPlugin?.title}"?
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. The plugin will be permanently removed from the marketplace.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => handleDeleteDialogOpenChange(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Plugin'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error state */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error?.message || 'Failed to load plugins. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <PluginCardSkeleton key={index} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && data?.plugins.length === 0 && (
        <div className="text-center py-12">
          <Store className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No plugins available</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Check back later for new plugins
          </p>
        </div>
      )}

      {/* No search results state */}
      {!isLoading && !isError && data && data.plugins.length > 0 && filteredPlugins.length === 0 && debouncedSearchQuery && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No plugins found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search terms
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setSearchQuery('')}
          >
            Clear search
          </Button>
        </div>
      )}

      {/* Plugin grid */}
      {!isLoading && !isError && data && filteredPlugins.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedPlugins.map((plugin) => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                onOpen={handleOpenPlugin}
                onEdit={handleEditPlugin}
                onDelete={handleDeletePlugin}
              />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={filteredTotalPages}
            onPageChange={handlePageChange}
            isLoading={isFetching}
          />

          {/* Results summary */}
          {filteredTotalItems > pageSize && (
            <p className="text-xs text-muted-foreground text-center">
              Showing {offset + 1}-{Math.min(offset + pageSize, filteredTotalItems)} of {filteredTotalItems} plugins
              {debouncedSearchQuery && ' (filtered)'}
            </p>
          )}
        </>
      )}
    </div>
  );
}