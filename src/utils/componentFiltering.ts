/**
 * Utility functions for filtering components based on landscape metadata
 */

import type { Component } from '@/types/api';

/**
 * Filter out components with is-library: true property
 *
 * @param components - Array of components to filter
 * @returns Components without libraries
 */
export function filterOutLibraries(components: Component[]): Component[] {
  return components.filter((component) => {
    const isLibrary = component['is-library'] === true;
    return !isLibrary;
  });
}

/**
 * Get only library components (is-library: true)
 *
 * @param components - Array of components to filter
 * @returns Only library components
 */
export function getLibraryComponents(components: Component[]): Component[] {
  return components.filter((component) => {
    const isLibrary = component['is-library'] === true;
    return isLibrary;
  });
}

/**
 * Filter components based on landscape metadata and component metadata
 *
 * Logic:
 * - If landscape has `central-region: true` → show ALL non-library components
 * - If landscape does NOT have `central-region: true` → hide components with `central-service: true`
 * - Always filters out libraries (is-library: true)
 *
 * @param components - Array of components to filter
 * @param landscapeMetadata - Metadata from the selected landscape
 * @returns Filtered array of components
 */
export function filterComponentsByLandscape(
  components: Component[],
  landscapeMetadata: Record<string, any> | undefined
): Component[] {
  // First, filter out libraries
  const nonLibraryComponents = filterOutLibraries(components);

  // If no landscape metadata, show all non-library components
  if (!landscapeMetadata) {
    return nonLibraryComponents;
  }

  // Check if landscape is a central region
  const isCentralRegion = landscapeMetadata['central-region'] === true;

  // If central region, show all non-library components
  if (isCentralRegion) {
    return nonLibraryComponents;
  }

  // If NOT central region, filter out components with central-service: true
  const filtered = nonLibraryComponents.filter((component) => {
    const isCentralService = component.metadata?.['central-service'] === true;
    return !isCentralService; // Keep only NON-central services
  });

  return filtered;
}
