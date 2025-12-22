/**
 * Plugin Loader
 * 
 * Handles dynamic loading of plugin bundles from remote URLs.
 * Fetches, parses, and validates plugin manifests.
 */

import type { PluginManifest, PluginError } from '../types/plugin.types';

/**
 * Load a plugin from a remote URL
 * 
 * @param bundleUrl - URL to the plugin's ES module bundle
 * @param signal - Optional AbortSignal for cancellation
 * @returns Plugin manifest or throws error
 * 
 * @throws {PluginError} If bundle cannot be loaded or is invalid
 */
export async function loadPlugin(
    bundleUrl: string,
    signal?: AbortSignal
): Promise<PluginManifest> {

    try {
        // Validate URL
        if (!bundleUrl || bundleUrl.trim() === '') {
            throw createPluginError('network', 'Bundle URL is required');
        }


        const response = await fetch(bundleUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/javascript, text/javascript',
            },
            signal,
        });


        if (!response.ok) {
            throw createPluginError(
                'network',
                `Failed to fetch bundle: ${response.status} ${response.statusText}`,
                { status: response.status }
            );
        }

        // Get bundle content
        const bundleCode = await response.text();
        if (!bundleCode || bundleCode.trim() === '') {
            throw createPluginError('parse', 'Bundle is empty');
        }

        // Create a data URL for the module
        const blob = new Blob([bundleCode], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);

        try {
            // Dynamically import the module
            const module = await import(/* @vite-ignore */ blobUrl);
            // Clean up blob URL
            URL.revokeObjectURL(blobUrl);

            // Validate the manifest
            const manifest = validateManifest(module.default);

            return manifest;
        } catch (error) {

            URL.revokeObjectURL(blobUrl);
            throw createPluginError(
                'parse',
                'Failed to parse plugin bundle',
                { originalError: error }
            );
        }
    } catch (error) {
        console.error('[pluginLoader] Top-level error:', error);

        if (error instanceof Error && (error as any).type) {
            // Already a PluginError
            throw error;
        }

        // Wrap unknown errors
        throw createPluginError(
            'runtime',
            error instanceof Error ? error.message : 'Unknown error loading plugin',
            { originalError: error }
        );
    }
}

/**
 * Validate a plugin manifest
 * 
 * @param manifest - The manifest to validate
 * @returns Validated manifest
 * @throws {PluginError} If manifest is invalid
 */
function validateManifest(manifest: any): PluginManifest {

    if (!manifest) {

        throw createPluginError('parse', 'Plugin bundle must have a default export');
    }

    if (typeof manifest !== 'object') {

        throw createPluginError('parse', 'Plugin manifest must be an object');
    }

    // Validate component
    if (!manifest.component) {

        throw createPluginError('parse', 'Plugin manifest must have a component property');
    }


    if (typeof manifest.component !== 'function') {
        throw createPluginError('parse', 'Plugin component must be a function');
    }

    // Validate metadata
    if (!manifest.metadata) {
        throw createPluginError('parse', 'Plugin manifest must have metadata');
    }

    if (typeof manifest.metadata !== 'object') {
        throw createPluginError('parse', 'Plugin metadata must be an object');
    }

    // Validate required metadata fields
    const { name, version, author } = manifest.metadata;

    if (!name || typeof name !== 'string') {
        throw createPluginError('parse', 'Plugin metadata must have a valid name');
    }

    if (!version || typeof version !== 'string') {
        throw createPluginError('parse', 'Plugin metadata must have a valid version');
    }

    if (!author || typeof author !== 'string') {
        throw createPluginError('parse', 'Plugin metadata must have a valid author');
    }

    // Validate hooks if present
    if (manifest.hooks) {
        if (typeof manifest.hooks !== 'object') {
            throw createPluginError('parse', 'Plugin hooks must be an object');
        }

        const { onMount, onUnmount, onConfigChange } = manifest.hooks;

        if (onMount && typeof onMount !== 'function') {
            throw createPluginError('parse', 'onMount hook must be a function');
        }

        if (onUnmount && typeof onUnmount !== 'function') {
            throw createPluginError('parse', 'onUnmount hook must be a function');
        }

        if (onConfigChange && typeof onConfigChange !== 'function') {
            throw createPluginError('parse', 'onConfigChange hook must be a function');
        }
    }

    // Return the validated manifest
    return manifest as PluginManifest;
}

/**
 * Create a standardized plugin error
 */
function createPluginError(
    type: PluginError['type'],
    message: string,
    details?: Record<string, any>
): PluginError {
    const error: PluginError = {
        type,
        message,
        originalError: details?.originalError,
        details,
    };

    return error as any; // Cast to satisfy type requirements
}

/**
 * Check if a URL is accessible
 * Performs a HEAD request to validate the URL without downloading content
 * 
 * @param url - URL to check
 * @param signal - Optional AbortSignal
 * @returns true if accessible, false otherwise
 */
export async function checkBundleUrl(
    url: string,
    signal?: AbortSignal
): Promise<{ accessible: boolean; error?: string }> {
    try {
      

        // Try HEAD request first (lighter)
        const response = await fetch(url, {
            method: 'HEAD',
            signal,
        });

        if (response.ok) {
            return { accessible: true };
        }

        return {
            accessible: false,
            error: `HTTP ${response.status}: ${response.statusText}`,
        };
    } catch (error) {
        return {
            accessible: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}