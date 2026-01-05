import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, Puzzle } from "lucide-react";
import React from "react";
import { PluginManifest, PluginMetadata } from "../types/plugin-types";
import { fetchPluginUI, isGitHubUrl, PluginApiData } from "@/hooks/api/usePlugins";
import * as LucideIcons from 'lucide-react';

export class PluginErrorBoundary extends React.Component<
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

export function PluginSkeleton() {
    return (
        <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading plugin...</p>
            </div>
        </div>
    );
}

export function PluginCrashScreen({ error, onRetry }: { error?: Error; onRetry: () => void }) {
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

export function formatBundleUrl(metadata: PluginMetadata) {
    return metadata.jsPath || metadata.bundleUrl;
}

// ============================================================================
// PLUGIN LOADER UTILITIES
// ============================================================================

/**
 * Load plugin from a direct bundle URL
 */
export async function loadPluginFromUrl(bundleUrl: string, signal?: AbortSignal): Promise<PluginManifest> {
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
export async function loadPluginFromContent(bundleCode: string): Promise<PluginManifest> {
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
export async function loadPluginBundle(
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
        const uiResponse = await fetchPluginUI(plugin.id);
        return loadPluginFromContent(uiResponse.content);
    } else {
        // Load directly from URL
        return loadPluginFromUrl(componentPath, signal);
    }
}

// Default items per page
export const DEFAULT_PAGE_SIZE = 12;

// Types for registration form
export interface RegistrationFormData {
  name: string;
  title: string;
  description: string;
  bundleUrl: string;
  backendUrl: string;
}

export interface RegistrationFormErrors {
  name?: string;
  title?: string;
  bundleUrl?: string;
  backendUrl?: string;
}

export const initialFormData: RegistrationFormData = {
  name: '',
  title: '',
  description: '',
  bundleUrl: '',
  backendUrl: '',
};

// URL validation helper
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Form validation
export function validateForm(data: RegistrationFormData): RegistrationFormErrors {
  const errors: RegistrationFormErrors = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!data.title || data.title.trim().length < 2) {
    errors.title = 'Title must be at least 2 characters';
  }

  if (!data.bundleUrl || data.bundleUrl.trim() === '') {
    errors.bundleUrl = 'Bundle URL is required';
  } else if (!isValidUrl(data.bundleUrl)) {
    errors.bundleUrl = 'Please enter a valid URL';
  }

  if (!data.backendUrl || data.backendUrl.trim() === '') {
    errors.backendUrl = 'Backend URL is required';
  } else if (!isValidUrl(data.backendUrl)) {
    errors.backendUrl = 'Please enter a valid URL';
  }

  return errors;
}

/**
 * Dynamically renders a Lucide icon by name
 */
export function DynamicIcon({ name, className }: { name?: string; className?: string }) {
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
export function getCategoryColor(category?: string): string {
  const colors: Record<string, string> = {
    'Development': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Operations': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'Analytics': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'Security': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'Infrastructure': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };
  return colors[category || ''] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
}