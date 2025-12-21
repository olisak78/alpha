import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import { BaseBody } from './PluginBody';
import { BaseContainer } from './PluginContainer';
import { BaseHeader } from './PluginHeader';
import { loadPlugin } from '../utils/pluginLoader';
import { PluginContext, PluginManifest, PluginMetadata, PluginState, PluginTheme } from '../types/plugin-types';
import { PluginApiClient } from '../utils/PluginApiClient';
import { formatBundleUrl, PluginErrorBoundary, PluginSkeleton } from '../models/models';

interface BasePluginProps {
    metadata: PluginMetadata;
    config?: Record<string, any>;
}

if (typeof window !== 'undefined' && !(window as any).React) {
    (window as any).React = React;
}

export function BasePlugin({ metadata, config }: BasePluginProps) {
    const { actualTheme } = useTheme();
    const navigate = useNavigate();
    const [pluginState, setPluginState] = useState<PluginState>({ loadState: 'idle' });

    const normalizedMetadata = useMemo(
        () => ({
            version: '0.0.1',
            enabled: true,
            author: metadata.createdBy,
            ...metadata,
            bundleUrl: formatBundleUrl(metadata),
            jsPath: formatBundleUrl(metadata),
        }),
        [metadata]
    );

    const apiClient = useMemo(() => new PluginApiClient(normalizedMetadata.id), [normalizedMetadata.id]);

    const pluginTheme: PluginTheme = useMemo(() => {
        const isDark = actualTheme === 'dark';
        return {
            mode: actualTheme,
            primaryColor: '#2563eb',
            colors: {
                background: isDark ? '#1f2937' : '#ffffff',
                foreground: isDark ? '#f3f4f6' : '#111827',
                muted: isDark ? '#374151' : '#f3f4f6',
                accent: isDark ? '#3b82f6' : '#2563eb',
                destructive: '#ef4444',
                border: isDark ? '#374151' : '#e5e7eb',
            },
        };
    }, [actualTheme]);

    const context: PluginContext = useMemo(
        () => ({
            theme: pluginTheme,
            apiClient,
            metadata: normalizedMetadata,
            config,
            utils: {
                toast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => {
                    toast({ title: message, variant: type === 'error' ? 'destructive' : 'default' });
                },
                navigate: (path: string) => navigate(path),
            },
        }),
        [pluginTheme, apiClient, normalizedMetadata, config, navigate]
    );

    useEffect(() => {
        if (pluginState.loadState !== 'idle') return;

        let cancelled = false;
        let manifestRef: PluginManifest | undefined;

        async function load() {
            if (normalizedMetadata.enabled === false) {
                setPluginState({
                    loadState: 'error',
                    error: { type: 'compatibility', message: 'Plugin is disabled' },
                });
                return;
            }

            if (!normalizedMetadata.bundleUrl) {
                setPluginState({
                    loadState: 'error',
                    error: { type: 'network', message: 'Bundle URL is missing' },
                });
                return;
            }
            setPluginState({ loadState: 'loading' });

            try {
                const manifest = await loadPlugin(normalizedMetadata.bundleUrl);
                if (cancelled) {
                    return;
                }

                manifestRef = manifest;
                setPluginState({
                    loadState: 'ready',
                    manifest,
                    loadedAt: new Date().toISOString(),
                });
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
    }, [
        normalizedMetadata.bundleUrl,
        normalizedMetadata.enabled,
        normalizedMetadata.version
    ]);

    useEffect(() => {
        if (pluginState.manifest?.hooks?.onConfigChange && config) {
            try {
                pluginState.manifest.hooks.onConfigChange(config);
            } catch (error) {
                console.error('[Plugin] onConfigChange error:', error);
            }
        }
    }, [config, pluginState.manifest]);

    const handleRuntimeError = (error: Error) => {
        toast({ title: 'Plugin Error', description: error.message, variant: 'destructive' });
    };

    const handleRetry = () => setPluginState({ loadState: 'idle' });

    const renderContent = () => {
        if (pluginState.loadState === 'ready' && pluginState.manifest) {
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
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>Plugin sandbox is ready. Load when bundle is available.</span>
                    </div>
                    <p className="text-muted-foreground">
                        Source: {normalizedMetadata.bundleUrl || 'Awaiting bundle path'}
                    </p>
                </div>
            );
        }

        return null;
    };

    return (
        <BaseContainer>
            <BaseHeader
                title={normalizedMetadata.title || normalizedMetadata.name}
                description={normalizedMetadata.description}
                icon={normalizedMetadata.icon || 'Puzzle'}
                actions={
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {normalizedMetadata.createdBy && <Badge variant="secondary">{normalizedMetadata.createdBy}</Badge>}
                        {normalizedMetadata.version && <Badge variant="outline">v{normalizedMetadata.version}</Badge>}
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
                {renderContent()}
            </BaseBody>
        </BaseContainer>
    );
}