/**
 * BasePlugin Component
 *
 * Wrapper component that provides a standardized environment for all plugins.
 */

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { BaseBody } from './PluginBody';
import { BaseContainer } from './PluginContainer';
import { BaseHeader } from './PluginHeader';
import { loadPlugin } from '../utils/pluginLoader';
import { PluginContext, PluginManifest, PluginMetadata, PluginState, PluginTheme } from '../types/plugin.types';
import { PluginApiClient } from '../utils/PluginApiClient';

interface BasePluginProps {
    metadata: PluginMetadata;
    config?: Record<string, any>;
}

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
            <Button onClick={onRetry} variant="outline">Retry</Button>
        </div>
    );
}

function formatBundleUrl(metadata: PluginMetadata) {
    return metadata.jsPath || metadata.bundleUrl;
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
            console.log('[BasePlugin] Starting load process');
            console.log('[BasePlugin] Metadata:', normalizedMetadata);
            console.log('[BasePlugin] Bundle URL:', normalizedMetadata.bundleUrl);
            if (normalizedMetadata.enabled === false) {
                console.log('[BasePlugin] Plugin is disabled');
                setPluginState({
                    loadState: 'error',
                    error: { type: 'compatibility', message: 'Plugin is disabled' },
                });
                return;
            }

            if (!normalizedMetadata.bundleUrl) {
                console.log('[BasePlugin] Bundle URL is missing');
                setPluginState({
                    loadState: 'error',
                    error: { type: 'network', message: 'Bundle URL is missing' },
                });
                return;
            }

            setPluginState({ loadState: 'loading' });
            console.log('[BasePlugin] Set state to loading');

            try {
                console.log('[BasePlugin] Calling loadPlugin with URL:', normalizedMetadata.bundleUrl);

                const manifest = await loadPlugin(normalizedMetadata.bundleUrl);
                console.log('[BasePlugin] loadPlugin succeeded, manifest:', manifest);

                if (cancelled) {
                    console.log('[BasePlugin] Load was cancelled');
                    return;
                }

                manifestRef = manifest;
                setPluginState({
                    loadState: 'ready',
                    manifest,
                    loadedAt: new Date().toISOString(),
                });
                console.log('[BasePlugin] Set state to ready');

                if (manifest.hooks?.onMount) {
                    console.log('[BasePlugin] Calling onMount hook');

                    try {
                        await manifest.hooks.onMount();
                    } catch (error) {
                        console.error('[Plugin] onMount error:', error);
                    }
                }
            } catch (error: any) {
                console.error('[BasePlugin] Error during load:', error);
                console.error('[BasePlugin] Error type:', error.type);
                console.error('[BasePlugin] Error message:', error.message);
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