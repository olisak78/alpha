/**
 * Plugin View Page
 * 
 * Renders a plugin in a full page view.
 * Loads the plugin bundle either from a direct URL or via the API.
 */

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Loader2, ArrowLeft, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { BaseBody } from '@/plugins/components/PluginBody';
import { BaseContainer } from '@/plugins/components/PluginContainer';
import { BaseHeader } from '@/plugins/components/PluginHeader';
import { PluginApiClient } from '@/plugins/utils/PluginApiClient';
import { 
  PluginContext, 
  PluginManifest, 
  PluginMetadata, 
  PluginState, 
  PluginTheme 
} from '@/plugins/types/plugin.types';

import { 
  usePlugins, 
  fetchPluginUI, 
  isGitHubUrl, 
  PluginApiData 
} from '@/hooks/api/usePlugins';

// ============================================================================
// ERROR BOUNDARY
// ============================================================================

class PluginErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: Error) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Plugin Error Boundary]', error, errorInfo);
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <PluginCrashScreen
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// LOADING & ERROR COMPONENTS
// ============================================================================

function PluginSkeleton() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading plugin...</p>
      </div>
    </div>
  );
}

function PluginCrashScreen({ error, onRetry }: { error?: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div>
        <p className="font-semibold text-destructive">Plugin Crashed</p>
        <p className="text-sm text-muted-foreground">{error?.message ?? 'An unexpected error occurred.'}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-8" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

// ============================================================================
// PLUGIN LOADER UTILITIES
// ============================================================================

/**
 * Load plugin from a direct bundle URL
 */
async function loadPluginFromUrl(bundleUrl: string, signal?: AbortSignal): Promise<PluginManifest> {
  const response = await fetch(bundleUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/javascript, text/javascript',
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch bundle: ${response.status} ${response.statusText}`);
  }

  const bundleCode = await response.text();
  if (!bundleCode || bundleCode.trim() === '') {
    throw new Error('Bundle is empty');
  }

  return loadPluginFromContent(bundleCode);
}

/**
 * Load plugin from raw JavaScript content
 */
async function loadPluginFromContent(bundleCode: string): Promise<PluginManifest> {
  const blob = new Blob([bundleCode], { type: 'application/javascript' });
  const blobUrl = URL.createObjectURL(blob);

  try {
    const module = await import(/* @vite-ignore */ blobUrl);
    URL.revokeObjectURL(blobUrl);

    // Validate and return manifest
    const manifest = module.default;
    if (!manifest || typeof manifest !== 'object') {
      throw new Error('Invalid plugin manifest: default export must be an object');
    }
    if (!manifest.component || typeof manifest.component !== 'function') {
      throw new Error('Invalid plugin manifest: component must be a React component');
    }

    return manifest as PluginManifest;
  } catch (error) {
    URL.revokeObjectURL(blobUrl);
    throw error;
  }
}

/**
 * Load plugin - determines the loading method based on react_component_path
 */
async function loadPluginBundle(
  plugin: PluginApiData,
  signal?: AbortSignal
): Promise<PluginManifest> {
  const componentPath = plugin.react_component_path;

  if (!componentPath) {
    throw new Error('Plugin has no component path configured');
  }

  // Check if it's a GitHub URL
  if (isGitHubUrl(componentPath)) {
    // Fetch from API endpoint
    console.log('[PluginViewPage] Loading plugin from API:', plugin.id);
    const uiResponse = await fetchPluginUI(plugin.id);
    return loadPluginFromContent(uiResponse.content);
  } else {
    // Load directly from URL
    console.log('[PluginViewPage] Loading plugin from URL:', componentPath);
    return loadPluginFromUrl(componentPath, signal);
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PluginViewPage() {
  const { pluginSlug } = useParams<{ pluginSlug: string }>();
  const navigate = useNavigate();
  console.log('[PluginViewPage] Route param pluginSlug:', pluginSlug);
  const { toast } = useToast();
  const { actualTheme } = useTheme();

  // Fetch all plugins to find the one we need
  const { data: pluginsData, isLoading: isLoadingPlugins, error: pluginsError } = usePlugins({
    limit: 100, // Fetch enough to find the plugin
    offset: 0,
  });

  // Find the plugin by matching the slug against the sanitized name
  const plugin = useMemo(() => {
  console.log('[PluginViewPage] Finding plugin - pluginSlug:', pluginSlug);
  console.log('[PluginViewPage] Available plugins:', pluginsData?.plugins?.map(p => ({
    name: p.name,
    sanitized: p.name.toLowerCase().replace(/\s+/g, '-'),
    id: p.id
  })));
  
  if (!pluginsData?.plugins || !pluginSlug) {
    console.log('[PluginViewPage] No plugins data or no slug');
    return null;
  }
  
  const found = pluginsData.plugins.find(p => {
    const sanitizedName = p.name.toLowerCase().replace(/\s+/g, '-');
    const matches = sanitizedName === pluginSlug;
    console.log('[PluginViewPage] Comparing:', { sanitizedName, pluginSlug, matches });
    return matches;
  });
  
  console.log('[PluginViewPage] Found plugin:', found);
  return found;
}, [pluginsData, pluginSlug]);

  // Plugin loading state
  const [pluginState, setPluginState] = useState<PluginState>({ loadState: 'idle' });

  // Create metadata from plugin data
  const metadata: PluginMetadata | null = useMemo(() => {
    if (!plugin) return null;
    return {
      id: plugin.id,
      name: plugin.name,
      title: plugin.title,
      description: plugin.description,
      createdBy: plugin.owner,
      version: plugin.version || '1.0.0',
      icon: plugin.icon,
      componentPath: plugin.react_component_path,
      jsPath: plugin.react_component_path,
      bundleUrl: plugin.react_component_path,
      backendUrl: plugin.backend_server_url,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [plugin]);

  // NOTE: We do NOT set backend proxy in sessionStorage here.
  // Plugins opened from the marketplace use the portal's proxy endpoint:
  // /plugins/<pluginId>/proxy?path=<endpoint>
  // The PluginApiClient will automatically use portalRequest() when no
  // backend proxy is set in sessionStorage.
  
  // Clear any existing backend proxy from PluginsPage testing
  useEffect(() => {
    sessionStorage.removeItem('plugin-backend-proxy');
  }, []);

  // Create API client for plugin
  const apiClient = useMemo(() => {
    if (!plugin) return null;
    return new PluginApiClient(plugin.id);
  }, [plugin]);

  // Create theme object for plugin
  const pluginTheme: PluginTheme = useMemo(() => {
    const isDark = actualTheme === 'dark';
    return {
      mode: isDark ? 'dark' : 'light',
      primaryColor: '#2563eb',
      colors: {
        background: isDark ? '#1f2937' : '#ffffff',
        foreground: isDark ? '#f9fafb' : '#111827',
        muted: isDark ? '#374151' : '#f3f4f6',
        accent: isDark ? '#3b82f6' : '#2563eb',
        destructive: '#ef4444',
        border: isDark ? '#374151' : '#e5e7eb',
      },
    };
  }, [actualTheme]);

  // Create plugin context
  const context: PluginContext | null = useMemo(() => {
    if (!metadata || !apiClient) return null;
    return {
      theme: pluginTheme,
      apiClient,
      metadata,
      config: {},
      utils: {
        toast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => {
          toast({ title: message, variant: type === 'error' ? 'destructive' : 'default' });
        },
        navigate: (path: string) => navigate(path),
      },
    };
  }, [pluginTheme, apiClient, metadata, navigate, toast]);

  // Load plugin when plugin data is available
  useEffect(() => {
    if (!plugin || pluginState.loadState !== 'idle') return;

    let cancelled = false;
    let manifestRef: PluginManifest | undefined;

    async function load() {
      console.log('[PluginViewPage] Starting load for plugin:', plugin.name);
      setPluginState({ loadState: 'loading' });

      try {
        const manifest = await loadPluginBundle(plugin);
        
        if (cancelled) return;

        manifestRef = manifest;
        setPluginState({
          loadState: 'ready',
          manifest,
          loadedAt: new Date().toISOString(),
        });

        // Call onMount hook if available
        if (manifest.hooks?.onMount) {
          try {
            await manifest.hooks.onMount();
          } catch (error) {
            console.error('[Plugin] onMount error:', error);
          }
        }
      } catch (error: any) {
        console.error('[PluginViewPage] Load error:', error);
        if (cancelled) return;
        setPluginState({
          loadState: 'error',
          error: {
            type: error.type || 'runtime',
            message: error.message || 'Failed to load plugin',
            originalError: error,
          },
        });
      }
    }

    load();

    return () => {
      cancelled = true;
      if (manifestRef?.hooks?.onUnmount) {
        try {
          manifestRef.hooks.onUnmount();
        } catch (error) {
          console.error('[Plugin] onUnmount error:', error);
        }
      }
    };
  }, [plugin]);

  // Reset plugin state when plugin changes
  useEffect(() => {
    setPluginState({ loadState: 'idle' });
  }, [pluginSlug]);

  const handleRetry = () => {
    setPluginState({ loadState: 'idle' });
  };

  const handleRuntimeError = (error: Error) => {
    toast({ title: 'Plugin Error', description: error.message, variant: 'destructive' });
  };

  const handleGoBack = () => {
    navigate('/plugin-marketplace');
  };

  // Render content based on plugin state
  const renderPluginContent = () => {
    if (pluginState.loadState === 'ready' && pluginState.manifest && context) {
      const PluginComponent = pluginState.manifest.component;
      return (
        <PluginErrorBoundary onError={handleRuntimeError}>
          <Suspense fallback={<PluginSkeleton />}>
            <PluginComponent context={context} />
          </Suspense>
        </PluginErrorBoundary>
      );
    }

    if (pluginState.loadState === 'idle') {
      return (
        <div className="flex flex-col gap-2 text-sm text-muted-foreground p-6">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Preparing plugin sandbox...</span>
          </div>
        </div>
      );
    }

    return null;
  };

  // Loading state while fetching plugins list
  if (isLoadingPlugins) {
    return <PageSkeleton />;
  }

  // Error loading plugins list
  if (pluginsError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load plugins: {pluginsError.message}
          </AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Marketplace
        </Button>
      </div>
    );
  }

  // Plugin not found
  if (!plugin || !metadata) {
    return (
      <div className="p-6 space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Plugin not found.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Marketplace
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={handleGoBack} className="-ml-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Marketplace
      </Button>

      {/* Plugin container */}
      <BaseContainer>
        <BaseHeader
          title={metadata.title || metadata.name}
          description={metadata.description}
          icon={metadata.icon || 'Puzzle'}
          actions={
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {metadata.createdBy && <Badge variant="secondary">{metadata.createdBy}</Badge>}
              {metadata.version && <Badge variant="outline">v{metadata.version}</Badge>}
            </div>
          }
        />
        <BaseBody
          isLoading={pluginState.loadState === 'loading'}
          error={pluginState.loadState === 'error' ? pluginState.error?.message : null}
          onRetry={handleRetry}
          loadingMessage="Loading plugin bundle..."
          minHeight="320px"
        >
          {renderPluginContent()}
        </BaseBody>
      </BaseContainer>
    </div>
  );
}