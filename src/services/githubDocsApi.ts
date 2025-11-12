/**
 * GitHub Documentation API Service
 * Fetches documentation from GitHub repository via backend proxy
 */

import { ApiClient } from "./ApiClient";

const apiClient = new ApiClient();

// Configuration - can be moved to environment variables
export const DOCS_CONFIG = {
  owner: "cfs-platform-engineering", // GitHub organization/user
  repo: "cfs-platform-docs", // Repository name
  branch: "main", // Branch name
  docsPath: "docs/coe", // Path to docs folder
};

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: "file" | "dir";
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

export interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: "file" | "dir" | "symlink" | "submodule";
  content?: string; // Base64 encoded for files
  encoding?: string;
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

export interface DocFile {
  name: string;
  path: string;
  type: "file" | "dir";
  url: string;
  content?: string; // Decoded markdown content
}

export interface DocTreeNode {
  name: string;
  path: string;
  type: "file" | "dir";
  children?: DocTreeNode[];
  url?: string;
}

/**
 * Fetch directory contents from GitHub via backend proxy
 */
export async function fetchGitHubDirectory(
  path: string = "",
  config: typeof DOCS_CONFIG = DOCS_CONFIG
): Promise<GitHubContent[]> {
  const fullPath = path ? `${config.docsPath}/${path}` : config.docsPath;

  // Backend proxy endpoint - uses ApiClient for automatic JWT authentication
  const url = `/github/repos/${config.owner}/${config.repo}/contents/${fullPath}`;

  return apiClient.get<GitHubContent[]>(url, {
    params: { ref: config.branch }
  });
}

/**
 * Decode base64 string to UTF-8 text
 * Handles Unicode characters properly (unlike atob)
 */
function decodeBase64ToUTF8(base64: string): string {
  // Remove all whitespace characters (newlines, spaces, tabs) from base64 string
  const cleanBase64 = base64.replace(/\s/g, '');

  try {
    // Decode base64 to binary string
    const binaryString = atob(cleanBase64);

    // Convert binary string to Uint8Array
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Decode Uint8Array to UTF-8 string
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
  } catch (error) {
    console.error('Failed to decode base64:', error);
    console.error('Base64 length:', cleanBase64.length);
    console.error('First 100 chars:', cleanBase64.substring(0, 100));
    throw new Error(`Failed to decode base64 content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Remove YAML frontmatter from markdown content
 * Frontmatter is the metadata between --- at the start of the file
 */
function removeFrontmatter(content: string): string {
  // Check if content starts with frontmatter (---)
  if (content.trim().startsWith('---')) {
    // Find the closing --- of the frontmatter
    const lines = content.split('\n');
    let endIndex = -1;

    // Start from line 1 (skip the opening ---)
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        endIndex = i;
        break;
      }
    }

    // If we found the closing ---, remove everything up to and including it
    if (endIndex > 0) {
      return lines.slice(endIndex + 1).join('\n').trim();
    }
  }

  return content;
}

/**
 * Fetch file content from GitHub via backend proxy
 */
export async function fetchGitHubFile(
  path: string,
  config: typeof DOCS_CONFIG = DOCS_CONFIG
): Promise<string> {
  const fullPath = path.startsWith(config.docsPath) ? path : `${config.docsPath}/${path}`;

  // Backend proxy endpoint - uses ApiClient for automatic JWT authentication
  const url = `/github/repos/${config.owner}/${config.repo}/contents/${fullPath}`;

  const data = await apiClient.get<GitHubContent>(url, {
    params: { ref: config.branch }
  });

  // The backend's GitHub client automatically decodes base64 content via GetContent()
  // So we receive plain text, not base64-encoded content
  if (data.content) {
    // Content is already decoded by the backend
    // Remove YAML frontmatter before returning
    return removeFrontmatter(data.content);
  }

  throw new Error('Invalid file content');
}

/**
 * Fetch file content with metadata (including SHA for editing)
 */
export async function fetchGitHubFileWithMetadata(
  path: string,
  config: typeof DOCS_CONFIG = DOCS_CONFIG
): Promise<{ content: string; sha: string; rawContent: string }> {
  const fullPath = path.startsWith(config.docsPath) ? path : `${config.docsPath}/${path}`;

  // Backend proxy endpoint - uses ApiClient for automatic JWT authentication
  const url = `/github/repos/${config.owner}/${config.repo}/contents/${fullPath}`;

  const data = await apiClient.get<GitHubContent>(url, {
    params: { ref: config.branch }
  });

  // The backend's GitHub client automatically decodes base64 content via GetContent()
  // So we receive plain text, not base64-encoded content
  if (data.content) {
    // Content is already decoded by the backend
    const rawContent = data.content;
    const content = removeFrontmatter(data.content);
    return {
      content,
      sha: data.sha,
      rawContent,
    };
  }

  throw new Error('Invalid file content');
}

/**
 * Build documentation tree structure recursively (LEGACY - loads everything)
 * @deprecated Use buildDocTreeLazy for better performance
 */
export async function buildDocTree(
  configOrPath?: typeof DOCS_CONFIG | string,
  path: string = ""
): Promise<DocTreeNode[]> {
  // Handle overload: either config object or legacy path string
  const config = typeof configOrPath === 'string'
    ? DOCS_CONFIG
    : (configOrPath || DOCS_CONFIG);
  const actualPath = typeof configOrPath === 'string' ? configOrPath : path;

  const contents = await fetchGitHubDirectory(actualPath, config);

  const tree: DocTreeNode[] = [];

  for (const item of contents) {
    // Extract path relative to docs folder
    const relativePath = item.path.replace(`${config.docsPath}/`, '');

    if (item.type === 'dir') {
      const children = await buildDocTree(config, relativePath);
      tree.push({
        name: item.name,
        path: relativePath,
        type: 'dir',
        children,
      });
    } else if (item.type === 'file' && item.name.endsWith('.md')) {
      tree.push({
        name: item.name,
        path: relativePath,
        type: 'file',
        url: item.html_url,
      });
    }
  }

  // Sort: directories first, then files, both alphabetically
  return tree.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'dir' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Build documentation tree structure - LAZY LOADING VERSION
 * Only loads one level at a time, directories are expanded on-demand
 */
export async function buildDocTreeLazy(
  configOrPath?: typeof DOCS_CONFIG | string,
  path: string = ""
): Promise<DocTreeNode[]> {
  // Handle overload: either config object or legacy path string
  const config = typeof configOrPath === 'string'
    ? DOCS_CONFIG
    : (configOrPath || DOCS_CONFIG);
  const actualPath = typeof configOrPath === 'string' ? configOrPath : path;

  const contents = await fetchGitHubDirectory(actualPath, config);

  const tree: DocTreeNode[] = [];

  for (const item of contents) {
    // Extract path relative to docs folder
    const relativePath = item.path.replace(`${config.docsPath}/`, '');

    if (item.type === 'dir') {
      // DON'T recursively load children - just mark as directory
      // Children will be loaded on-demand when user expands the folder
      tree.push({
        name: item.name,
        path: relativePath,
        type: 'dir',
        children: undefined, // undefined means not loaded yet
      });
    } else if (item.type === 'file' && item.name.endsWith('.md')) {
      tree.push({
        name: item.name,
        path: relativePath,
        type: 'file',
        url: item.html_url,
      });
    }
  }

  // Sort: directories first, then files, both alphabetically
  return tree.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'dir' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Search through all markdown files for a query
 */
export async function searchDocs(query: string, files: DocTreeNode[]): Promise<Array<{ path: string; name: string; excerpt: string }>> {
  const results: Array<{ path: string; name: string; excerpt: string }> = [];
  const lowerQuery = query.toLowerCase();

  const searchRecursive = async (nodes: DocTreeNode[]) => {
    for (const node of nodes) {
      if (node.type === 'dir' && node.children) {
        await searchRecursive(node.children);
      } else if (node.type === 'file') {
        try {
          const content = await fetchGitHubFile(node.path);
          const lowerContent = content.toLowerCase();

          if (lowerContent.includes(lowerQuery)) {
            // Find excerpt around the query
            const index = lowerContent.indexOf(lowerQuery);
            const start = Math.max(0, index - 50);
            const end = Math.min(content.length, index + 150);
            const excerpt = content.substring(start, end).replace(/\n/g, ' ');

            results.push({
              path: node.path,
              name: node.name,
              excerpt: `...${excerpt}...`,
            });
          }
        } catch (error) {
          console.error(`Error searching file ${node.path}:`, error);
        }
      }
    }
  };

  await searchRecursive(files);
  return results;
}

/**
 * Get flattened list of all doc files (for search indexing)
 */
export function flattenDocTree(tree: DocTreeNode[]): Array<{ path: string; name: string }> {
  const flat: Array<{ path: string; name: string }> = [];

  const flatten = (nodes: DocTreeNode[]) => {
    for (const node of nodes) {
      if (node.type === 'dir' && node.children) {
        flatten(node.children);
      } else if (node.type === 'file') {
        flat.push({ path: node.path, name: node.name });
      }
    }
  };

  flatten(tree);
  return flat;
}
