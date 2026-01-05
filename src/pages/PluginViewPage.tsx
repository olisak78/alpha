import { Suspense, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useActualTheme } from '@/stores/themeStore';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
} from '@/plugins/types/plugin-types';

// Import shared plugin components from model
import {
  loadPluginBundle,
  PluginErrorBoundary,
  PluginSkeleton,
} from '@/plugins/models/models';

import { usePlugins } from '@/hooks/api/usePlugins';
import { PageSkeleton } from '@/plugins/components/PageSkeleton';



// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PluginViewPage() {
  const { pluginSlug } = useParams<{ pluginSlug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const actualTheme = useActualTheme();

  // Fetch all plugins to find the one we need
  const { data: pluginsData, isLoading: isLoadingPlugins, error: pluginsError } = usePlugins({
    limit: 100, // Fetch enough to find the plugin
    offset: 0,
  });

  // Find the plugin by matching the slug against the sanitized name
  const plugin = useMemo(() => {
    if (!pluginsData?.plugins || !pluginSlug) {
      return null;
    }

    const found = pluginsData.plugins.find(p => {
      const sanitizedName = p.name.toLowerCase().replace(/\s+/g, '-');
      const matches = sanitizedName === pluginSlug;
      return matches;
    });
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
  }, [plugin, pluginSlug]);

  // Reset plugin state when plugin changes
  useLayoutEffect(() => {
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