/**
 * React Query hooks for GitHub documentation
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import {
  buildDocTree,
  buildDocTreeLazy,
  fetchGitHubFile,
  fetchGitHubFileWithMetadata,
  DocTreeNode,
} from '@/services/githubDocsApi';

export interface DocsConfig {
  owner: string;
  repo: string;
  branch: string;
  docsPath: string;
  provider: string;
}

/**
 * Hook to fetch the documentation tree structure
 * Can accept custom config or use default from githubDocsApi
 */
export function useDocTree(
  config?: DocsConfig,
  options?: Omit<UseQueryOptions<DocTreeNode[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<DocTreeNode[], Error>({
    queryKey: config
      ? ['docs', 'tree', config.owner, config.repo, config.branch, config.docsPath]
      : ['docs', 'tree'],
    queryFn: () => buildDocTree(config),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 2,
    ...options,
  });
}

/**
 * Hook to fetch the documentation tree structure with LAZY LOADING
 * Only loads the root level, subdirectories are loaded on-demand
 */
export function useDocTreeLazy(
  config?: DocsConfig,
  options?: Omit<UseQueryOptions<DocTreeNode[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<DocTreeNode[], Error>({
    queryKey: config
      ? ['docs', 'tree-lazy', config.owner, config.repo, config.branch, config.docsPath]
      : ['docs', 'tree-lazy'],
    queryFn: () => buildDocTreeLazy(config),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 2,
    ...options,
  });
}

/**
 * Hook to fetch a specific directory's contents (for lazy loading subdirectories)
 */
export function useDocDirectory(
  path: string | null,
  config?: DocsConfig,
  options?: Omit<UseQueryOptions<DocTreeNode[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<DocTreeNode[], Error>({
    queryKey: config
      ? ['docs', 'dir', path, config.owner, config.repo, config.branch]
      : ['docs', 'dir', path],
    queryFn: () => {
      if (!path) throw new Error('No path provided');
      return buildDocTreeLazy(config, path);
    },
    enabled: !!path,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 2,
    ...options,
  });
}

/**
 * Hook to fetch a specific documentation file
 */
export function useDocFile(
  path: string | null,
  config?: DocsConfig,
  options?: Omit<UseQueryOptions<string, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<string, Error>({
    queryKey: config
      ? ['docs', 'file', path, config.owner, config.repo, config.branch]
      : ['docs', 'file', path],
    queryFn: () => {
      if (!path) throw new Error('No path provided');
      return fetchGitHubFile(path, config);
    },
    enabled: !!path,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 2,
    ...options,
  });
}

/**
 * Hook to fetch a specific documentation file with metadata (SHA, raw content)
 */
export function useDocFileWithMetadata(
  path: string | null,
  config?: DocsConfig,
  options?: Omit<UseQueryOptions<{ content: string; sha: string; rawContent: string }, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<{ content: string; sha: string; rawContent: string }, Error>({
    queryKey: config
      ? ['docs', 'file-meta', path, config.owner, config.repo, config.branch]
      : ['docs', 'file-meta', path],
    queryFn: () => {
      if (!path) throw new Error('No path provided');
      return fetchGitHubFileWithMetadata(path, config);
    },
    enabled: !!path,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 2,
    ...options,
  });
}
