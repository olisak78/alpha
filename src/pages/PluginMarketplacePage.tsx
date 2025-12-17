import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Store, AlertCircle, ChevronLeft, ChevronRight, RefreshCw, Puzzle, Pin } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { usePlugins, PluginApiData } from '@/hooks/api/usePlugins';

// Default items per page
const DEFAULT_PAGE_SIZE = 12;

/**
 * Dynamically renders a Lucide icon by name
 */
function DynamicIcon({ name, className }: { name?: string; className?: string }) {
  if (!name) {
    return <Puzzle className={className} />;
  }

  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
  
  if (!IconComponent) {
    return <Puzzle className={className} />;
  }

  return <IconComponent className={className} />;
}

/**
 * Get category color based on category name
 */
function getCategoryColor(category?: string): string {
  const colors: Record<string, string> = {
    'Development': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Operations': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'Analytics': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'Security': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'Infrastructure': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };
  return colors[category || ''] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
}

/**
 * Plugin card component for the marketplace grid
 */
function PluginCard({ plugin, onOpen }: { plugin: PluginApiData; onOpen: (plugin: PluginApiData) => void }) {
  // Extract category and version from plugin data (with fallbacks)
  const category = plugin.category || 'Development';
  const version = plugin.version || 'v1.0.0';

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow relative">
      <CardContent className="p-5 flex flex-col h-full">
        {/* Pin icon in top right */}
        <button 
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Pin plugin"
        >
          <Pin className="h-4 w-4" />
        </button>

        {/* Header with icon and title */}
        <div className="flex items-start gap-3 mb-3 pr-6">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary flex-shrink-0">
            <DynamicIcon name={plugin.icon} className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight truncate">
              {plugin.title}
            </h3>
            {/* Category and version */}
            <div className="flex items-center gap-1.5 mt-1.5">
              <Badge 
                variant="secondary" 
                className={`text-[10px] px-1.5 py-0 h-5 font-medium ${getCategoryColor(category)}`}
              >
                {category}
              </Badge>
              <span className="text-muted-foreground text-xs">•</span>
              <span className="text-xs text-muted-foreground">{version}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-3 flex-1 mb-4">
          {plugin.description || 'No description provided'}
        </p>

        {/* Footer with author and Open button */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-xs text-muted-foreground">
            By {plugin.owner}
          </span>
          <Button size="sm" className="h-8 px-4" onClick={() => onOpen(plugin)}>
            Open
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for plugin cards
 */
function PluginCardSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </div>
        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Pagination component
 */
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>
      <span className="text-sm text-muted-foreground px-4">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
      >
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}

/**
 * Plugin Marketplace Page
 * 
 * Displays a grid of available plugins that users can discover and install.
 */
export default function PluginMarketplacePage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = DEFAULT_PAGE_SIZE;

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

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Handle opening a plugin
  const handleOpenPlugin = (plugin: PluginApiData) => {
    // Create a URL-friendly slug from the plugin name
    const slug = plugin.name.toLowerCase().replace(/\s+/g, '-');
    console.log('[Marketplace] Opening plugin:', {
    originalName: plugin.name,
    generatedSlug: slug,
    pluginId: plugin.id
  });
    navigate(`/plugins/${slug}`);
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

      {/* Plugin grid */}
      {!isLoading && !isError && data && data.plugins.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.plugins.map((plugin) => (
              <PluginCard key={plugin.id} plugin={plugin} onOpen={handleOpenPlugin} />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            isLoading={isFetching}
          />

          {/* Results summary */}
          {totalItems > pageSize && (
            <p className="text-xs text-muted-foreground text-center">
              Showing {offset + 1}-{Math.min(offset + pageSize, totalItems)} of {totalItems} plugins
            </p>
          )}
        </>
      )}
    </div>
  );
}