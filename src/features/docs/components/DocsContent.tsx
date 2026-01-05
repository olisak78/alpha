/**
 * Docs Content Component - Markdown renderer with GitHub styling
 */

import React, { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypePrism from 'rehype-prism-plus';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import GithubSlugger from 'github-slugger';
import 'github-markdown-css/github-markdown.css';
import './DocsContent.css';
import 'prismjs/themes/prism-tomorrow.css';
import 'katex/dist/katex.min.css';
import { Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableOfContentsItem } from '../DocsPage';
import { MermaidDiagram } from './MermaidDiagram';
import { apiClient } from '@/services/ApiClient';
import { DOCS_CONFIG } from '@/services/githubDocsApi';

interface DocsContentProps {
  content: string | undefined;
  isLoading: boolean;
  error: Error | null;
  selectedPath: string | null;
  onTableOfContentsChange: (items: TableOfContentsItem[]) => void;
  docsConfig?: {
    owner: string;
    repo: string;
    branch: string;
    docsPath: string;
  };
}

// Image cache per document to prevent re-fetching during scroll
// Maps document path -> (image key -> blob URL)
const documentImageCache = new Map<string, Map<string, string>>();

// Component to fetch and display GitHub images with authentication
const AuthenticatedImage: React.FC<{
  src: string;
  alt: string;
  isApiPath?: boolean;
  documentPath: string; // Add document path to track which doc owns this image
  [key: string]: unknown
}> = ({ src, alt, isApiPath, documentPath, ...props }) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        setIsLoading(true);
        setError(false);

        // Create cache key from src and isApiPath
        const cacheKey = `${src}|${isApiPath}`;

        // Get or create cache for this document
        let docCache = documentImageCache.get(documentPath);
        if (!docCache) {
          docCache = new Map<string, string>();
          documentImageCache.set(documentPath, docCache);
        }

        // Check if image is already in cache for this document
        if (docCache.has(cacheKey)) {
          const cachedUrl = docCache.get(cacheKey)!;
          setImageSrc(cachedUrl);
          setIsLoading(false);
          return;
        }

        if (isApiPath) {
          // For API paths, the backend returns GitHub Contents API response with download_url
          const response = await apiClient.get<{
            download_url?: string;
          }>(src);

          if (!response.download_url) {
            throw new Error('No download_url in API response');
          }

          // Use the download_url via the asset proxy
          const blob = await apiClient.getBinary('/github/asset', {
            params: { url: response.download_url },
          });
          const objectUrl = URL.createObjectURL(blob);

          // Store in document-specific cache
          docCache.set(cacheKey, objectUrl);
          setImageSrc(objectUrl);
        } else {
          // For asset URLs, use the binary proxy endpoint
          const blob = await apiClient.getBinary('/github/asset', {
            params: { url: src },
          });
          const objectUrl = URL.createObjectURL(blob);

          // Store in document-specific cache
          docCache.set(cacheKey, objectUrl);
          setImageSrc(objectUrl);
        }
      } catch (err) {
        console.error('Failed to load image:', err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImage();
  }, [src, isApiPath, documentPath]);

  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading image...</span>
      </span>
    );
  }

  if (error || !imageSrc) {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">Failed to load image</span>
      </span>
    );
  }

  return <img src={imageSrc} alt={alt || ''} loading="lazy" {...props} />;
};

export const DocsContent: React.FC<DocsContentProps> = ({
  content,
  isLoading,
  error,
  selectedPath,
  onTableOfContentsChange,
  docsConfig,
}) => {
  // Use provided config or fall back to default
  const config = docsConfig || DOCS_CONFIG;
  const [copiedCode, setCopiedCode] = React.useState<{ [key: string]: boolean }>({});

  // Cleanup image cache when document changes
  useEffect(() => {
    return () => {
      // When unmounting or selectedPath changes, cleanup old document's images
      if (selectedPath && documentImageCache.has(selectedPath)) {
        const docCache = documentImageCache.get(selectedPath)!;

        // Revoke all blob URLs for this document to free memory
        docCache.forEach((blobUrl) => {
          if (blobUrl.startsWith('blob:')) {
            URL.revokeObjectURL(blobUrl);
          }
        });

        // Remove this document's cache
        documentImageCache.delete(selectedPath);
      }
    };
  }, [selectedPath]);

  // Extract table of contents from markdown content
  useEffect(() => {
    if (!content) {
      onTableOfContentsChange([]);
      return;
    }

    const headings: TableOfContentsItem[] = [];
    const lines = content.split('\n');
    const slugger = new GithubSlugger();

    lines.forEach(line => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        // Use github-slugger to generate IDs that match rehypeSlug
        const id = slugger.slug(text);
        headings.push({ id, text, level });
      }
    });

    onTableOfContentsChange(headings);
  }, [content, onTableOfContentsChange]);

  const handleCodeCopy = async (code: string, index: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode({ ...copiedCode, [index]: true });
    setTimeout(() => setCopiedCode({ ...copiedCode, [index]: false }), 2000);
  };

  const fileName = useMemo(() => {
    if (!selectedPath) return '';
    return selectedPath.split('/').pop()?.replace('.md', '') || '';
  }, [selectedPath]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="flex flex-col items-center gap-4 text-red-500 dark:text-red-400">
          <AlertCircle className="h-10 w-10" />
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-1">Failed to Load Document</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="flex flex-col items-center gap-4 text-gray-600 dark:text-gray-400">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="text-sm">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-gray-500 dark:text-gray-400">Select a document to view</p>
      </div>
    );
  }

  let codeBlockCounter = 0;

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      {/* Markdown Content with GitHub styling */}
      <div className="markdown-body" style={{ background: 'transparent' }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[
            [rehypePrism, { ignoreMissing: true }],
            rehypeKatex,
            rehypeSlug, // Add IDs to headings for ToC links
          ]}
          components={{
            pre({ node, children, ...props }) {
              // Extract code and language
              const codeElement = children as React.ReactElement;
              const className = codeElement?.props?.className || '';
              const match = /language-(\w+)/.exec(className);
              const language = match ? match[1] : 'text';

              // Extract text content
              const extractText = (node: unknown): string => {
                if (typeof node === 'string') return node;
                if (Array.isArray(node)) return node.map(extractText).join('');
                if (node && typeof node === 'object' && 'props' in node) {
                  const element = node as React.ReactElement;
                  if (element.props?.children) return extractText(element.props.children);
                }
                return '';
              };

              const codeString = extractText(codeElement);

              // Handle Mermaid diagrams
              if (language === 'mermaid') {
                return <MermaidDiagram chart={codeString} />;
              }

              const codeIndex = `${fileName}-${codeBlockCounter++}`;

              return (
                <div className="relative group">
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 bg-gray-700 hover:bg-gray-600 text-white"
                      onClick={() => handleCodeCopy(codeString, codeIndex)}
                    >
                      {copiedCode[codeIndex] ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          <span className="text-xs">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          <span className="text-xs">Copy</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <pre {...props}>
                    {children}
                  </pre>
                </div>
              );
            },
            // Ensure images render properly (including GitHub-hosted images)
            img({ node, src, alt, ...props }) {
              if (!src) {
                return <img alt={alt || ''} {...props} />;
              }

              // Handle relative paths - convert to API URLs instead of web URLs
              let resolvedSrc = src;
              let useApiProxy = false;

              if (src.startsWith('./') || src.startsWith('../')) {
                // Get the current file's directory path
                // selectedPath is relative to docsPath: "observability/alerting/file.md"
                // We need to prepend the docsPath to get the full path
                const fullPath = selectedPath ? `${config.docsPath}/${selectedPath}` : config.docsPath;
                const currentDir = fullPath.substring(0, fullPath.lastIndexOf('/'));

                // Resolve relative path
                const parts = currentDir.split('/').filter(p => p);
                const srcParts = src.split('/');

                for (const part of srcParts) {
                  if (part === '..') {
                    parts.pop(); // Go up one directory
                  } else if (part === '.' || part === '') {
                    // Skip current directory and empty parts
                  } else {
                    parts.push(part); // Add the path component
                  }
                }

                // Use backend API proxy to fetch the image content
                // Backend will use GitHub Contents API to get the actual file
                const resolvedPath = parts.join('/');
                resolvedSrc = `/github/repos/${config.owner}/${config.repo}/contents/${resolvedPath}?ref=${config.branch}`;
                useApiProxy = true;
              }

              // For GitHub URLs or API proxy paths, use authenticated image component
              if (useApiProxy || resolvedSrc.includes('github.tools.sap') || resolvedSrc.includes('githubusercontent.com')) {
                return (
                  <AuthenticatedImage
                    src={resolvedSrc}
                    alt={alt || ''}
                    isApiPath={useApiProxy}
                    documentPath={selectedPath || ''}
                    {...props}
                  />
                );
              }

              // Regular image URL, use as-is
              return (
                <img
                  src={resolvedSrc}
                  alt={alt || ''}
                  loading="lazy"
                  {...props}
                />
              );
            },
            code({ node, inline, className, children, ...props }) {
              // Inline code
              if (inline) {
                return (
                  <code
                    className={className}
                    {...props}
                  >
                    {children}
                  </code>
                );
              }
              // Block code - handled by pre component
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            // Make headings linkable - rehypeSlug adds id to props
            h1: ({ node, children, ...props }) => <h1 {...props}>{children}</h1>,
            h2: ({ node, children, ...props }) => <h2 {...props}>{children}</h2>,
            h3: ({ node, children, ...props }) => <h3 {...props}>{children}</h3>,
            h4: ({ node, children, ...props }) => <h4 {...props}>{children}</h4>,
            h5: ({ node, children, ...props }) => <h5 {...props}>{children}</h5>,
            h6: ({ node, children, ...props }) => <h6 {...props}>{children}</h6>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};
