/**
 * GitHub Docs Page - Main component
 * Mimics GitHub Pages experience with sidebar, content, and ToC
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useDocTreeLazy, useDocDirectory, useDocFile, useDocFileWithMetadata } from '@/hooks/api/useDocs';
import { DocsSidebar } from './components/DocsSidebar';
import { DocsContent } from './components/DocsContent';
import { DocsTableOfContents } from './components/DocsTableOfContents';
import { DocsSearch } from './components/DocsSearch';
import { DocsRawEditor } from './components/DocsRawEditor';
import { CreateItemDialog, CreateItemType } from './components/CreateItemDialog';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import { flattenDocTree, DocTreeNode, createGitHubFile, createGitHubFolder, deleteGitHubFile, deleteGitHubFolder, isFolderEmpty } from '@/services/githubDocsApi';
import { AlertCircle, Loader2, FileText, Eye, Github, FilePlus, FolderPlus, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Fuse from 'fuse.js';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export interface TableOfContentsItem {
  id: string;
  text: string;
  level: number;
}

interface DocsPageProps {
  owner?: string;
  repo?: string;
  branch?: string;
  docsPath?: string;
}

const DocsPage: React.FC<DocsPageProps> = ({ owner, repo, branch, docsPath }) => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [tableOfContents, setTableOfContents] = useState<TableOfContentsItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');
  const [skippedFiles, setSkippedFiles] = useState<Set<string>>(new Set());
  const [isRawMode, setIsRawMode] = useState(false);
  const [fileSHA, setFileSHA] = useState<string>('');
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [docTreeWithLazyChildren, setDocTreeWithLazyChildren] = useState<DocTreeNode[] | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createItemType, setCreateItemType] = useState<CreateItemType>('document');
  const [createInPath, setCreateInPath] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteFilePath, setDeleteFilePath] = useState<string>('');
  const [deleteFileName, setDeleteFileName] = useState<string>('');
  const [deleteItemType, setDeleteItemType] = useState<'document' | 'folder'>('document');

  const queryClient = useQueryClient();
  const { toast} = useToast();

  // Build config object from props if provided
  const docsConfig = owner && repo && branch && docsPath
    ? { owner, repo, branch, docsPath }
    : undefined;

  // Extract the last segment of docsPath as the title (e.g., "docs/coe" -> "coe")
  const getDocsTitle = () => {
    if (!docsConfig?.docsPath) return 'Documentation';
    const segments = docsConfig.docsPath.split('/').filter(Boolean);
    return segments.length > 0 ? segments[segments.length - 1] : 'Documentation';
  };

  // Fetch documentation tree with LAZY LOADING (only root level)
  const { data: docTree, isLoading: isTreeLoading, error: treeError } = useDocTreeLazy(docsConfig);

  // Fetch selected file content (pass config to use correct repository)
  const { data: fileContent, isLoading: isFileLoading, error: fileError } = useDocFile(selectedPath, docsConfig);

  // Fetch file with metadata for RAW mode
  const { data: fileMetadata, refetch: refetchMetadata } = useDocFileWithMetadata(selectedPath, docsConfig);

  // Update fileSHA when metadata changes
  useEffect(() => {
    if (fileMetadata) {
      setFileSHA(fileMetadata.sha);
    }
  }, [fileMetadata]);


  // Initialize doc tree with lazy children support
  useEffect(() => {
    if (docTree) {
      setDocTreeWithLazyChildren(docTree);
    }
  }, [docTree]);

  // Handler to load directory children on-demand
  const loadDirectoryChildren = useCallback(async (dirPath: string) => {
    if (expandedDirs.has(dirPath)) {
      // Already expanded, just toggle collapse
      setExpandedDirs(prev => {
        const newSet = new Set(prev);
        newSet.delete(dirPath);
        return newSet;
      });
      return;
    }

    // Mark as expanded
    setExpandedDirs(prev => new Set(prev).add(dirPath));

    // Always fetch fresh data from GitHub
    const queryKey = docsConfig
      ? ['docs', 'dir', dirPath, docsConfig.owner, docsConfig.repo, docsConfig.branch]
      : ['docs', 'dir', dirPath];

    try {
      const { buildDocTreeLazy } = await import('@/services/githubDocsApi');
      const children = await buildDocTreeLazy(docsConfig, dirPath);

      // Store in React Query cache
      queryClient.setQueryData(queryKey, children);

      // Merge children into the tree
      setDocTreeWithLazyChildren(prevTree => {
        if (!prevTree) return prevTree;

        const updateTreeNode = (nodes: DocTreeNode[]): DocTreeNode[] => {
          return nodes.map(node => {
            if (node.type === 'dir' && node.path === dirPath) {
              return { ...node, children };
            } else if (node.type === 'dir' && node.children) {
              return { ...node, children: updateTreeNode(node.children) };
            }
            return node;
          });
        };

        return updateTreeNode(prevTree);
      });
    } catch (error) {
      console.error(`Failed to load directory ${dirPath}:`, error);
      return;
    }
  }, [expandedDirs, docsConfig, queryClient]);

  // Handler for creating a new folder
  const handleCreateFolder = useCallback((folderPath: string) => {
    setCreateInPath(folderPath);
    setCreateItemType('folder');
    setCreateDialogOpen(true);
  }, []);

  // Handler for creating a new document
  const handleCreateDocument = useCallback((folderPath: string) => {
    setCreateInPath(folderPath);
    setCreateItemType('document');
    setCreateDialogOpen(true);
  }, []);

  // Handler for confirming creation
  const handleConfirmCreate = useCallback(async (name: string) => {
    if (!docsConfig) {
      toast({
        title: 'Error',
        description: 'Documentation configuration is not available',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (createItemType === 'folder') {
        // Create folder with .gitkeep file
        const folderPath = createInPath ? `${createInPath}/${name}` : name;
        await createGitHubFolder(folderPath, docsConfig);

        toast({
          title: 'Success',
          description: `Folder "${name}" created successfully`,
        });
      } else {
        // Create document (markdown file)
        const fileName = name.endsWith('.md') ? name : `${name}.md`;
        const filePath = createInPath ? `${createInPath}/${fileName}` : fileName;
        await createGitHubFile(filePath, '# ' + name + '\n\nStart writing your documentation here...', `Create ${fileName}`, docsConfig);

        toast({
          title: 'Success',
          description: `Document "${fileName}" created successfully`,
        });

        // Select the new document for editing
        setSelectedPath(filePath);
      }

      if (createInPath) {
        // Created inside a directory - reload that directory from GitHub
        const queryKey = docsConfig
          ? ['docs', 'dir', createInPath, docsConfig.owner, docsConfig.repo, docsConfig.branch]
          : ['docs', 'dir', createInPath];

        // Invalidate the cache
        await queryClient.invalidateQueries({ queryKey });

        // Collapse and re-expand to trigger fresh fetch from GitHub
        if (expandedDirs.has(createInPath)) {
          setExpandedDirs(prev => {
            const newSet = new Set(prev);
            newSet.delete(createInPath);
            return newSet;
          });
        }

        // Expand (or re-expand) to load fresh data from GitHub
        setTimeout(() => {
          loadDirectoryChildren(createInPath);
        }, 100);
      } else {
        // Root level creation - refetch entire root tree from GitHub
        const treeQueryKey = docsConfig
          ? ['docs', 'tree-lazy', docsConfig.owner, docsConfig.repo, docsConfig.branch, docsConfig.docsPath]
          : ['docs', 'tree-lazy'];

        await queryClient.invalidateQueries({ queryKey: treeQueryKey });
        await queryClient.refetchQueries({ queryKey: treeQueryKey });
      }
    } catch (error) {
      console.error('Failed to create item:', error);
      toast({
        title: 'Error',
        description: `Failed to create ${createItemType}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
      throw error; // Re-throw to keep dialog open
    }
  }, [createItemType, createInPath, docsConfig, queryClient, toast]);

  // Handler for initiating document deletion
  const handleDeleteDocument = useCallback((filePath: string, fileName: string) => {
    setDeleteFilePath(filePath);
    setDeleteFileName(fileName);
    setDeleteItemType('document');
    setDeleteDialogOpen(true);
  }, []);

  // Handler for initiating folder deletion
  const handleDeleteFolder = useCallback(async (folderPath: string, folderName: string) => {
    if (!docsConfig) return;

    // Check if folder is empty
    const isEmpty = await isFolderEmpty(folderPath, docsConfig);
    if (!isEmpty) {
      toast({
        title: 'Cannot Delete Folder',
        description: 'The folder is not empty. Please delete all files in the folder first.',
        variant: 'destructive',
      });
      return;
    }

    setDeleteFilePath(folderPath);
    setDeleteFileName(folderName);
    setDeleteItemType('folder');
    setDeleteDialogOpen(true);
  }, [docsConfig, toast]);

  // Handler for confirming deletion
  const handleConfirmDelete = useCallback(async () => {
    if (!docsConfig || !deleteFilePath) {
      toast({
        title: 'Error',
        description: `Unable to delete ${deleteItemType}`,
        variant: 'destructive',
      });
      return;
    }

    try {
      if (deleteItemType === 'folder') {
        // Delete folder (only .gitkeep file)
        await deleteGitHubFolder(deleteFilePath, `Delete folder ${deleteFileName}`, docsConfig);

        toast({
          title: 'Success',
          description: `Folder "${deleteFileName}" deleted successfully`,
        });
      } else {
        // Fetch the file metadata to get the current SHA
        const { fetchGitHubFileWithMetadata } = await import('@/services/githubDocsApi');
        const metadata = await fetchGitHubFileWithMetadata(deleteFilePath, docsConfig);

        // Delete the file using its SHA
        await deleteGitHubFile(deleteFilePath, metadata.sha, `Delete ${deleteFileName}`, docsConfig);

        toast({
          title: 'Success',
          description: `Document "${deleteFileName}" deleted successfully`,
        });
      }

      // Close dialog
      setDeleteDialogOpen(false);

      // Clear selected path if we deleted the currently selected file
      if (selectedPath === deleteFilePath) {
        setSelectedPath(null);
      }

      // Get parent path to determine where to reload
      const parentPath = deleteFilePath.split('/').slice(0, -1).join('/');

      if (parentPath && expandedDirs.has(parentPath)) {
        // Parent directory is expanded - reload it from GitHub
        const queryKey = docsConfig
          ? ['docs', 'dir', parentPath, docsConfig.owner, docsConfig.repo, docsConfig.branch]
          : ['docs', 'dir', parentPath];

        // Invalidate the cache
        await queryClient.invalidateQueries({ queryKey });

        // Collapse and re-expand to trigger fresh fetch
        setExpandedDirs(prev => {
          const newSet = new Set(prev);
          newSet.delete(parentPath);
          return newSet;
        });

        // Re-expand after a brief moment to trigger reload from GitHub
        setTimeout(() => {
          loadDirectoryChildren(parentPath);
        }, 100);
      } else {
        // Root level deletion or parent not expanded - refetch entire root tree from GitHub
        const treeQueryKey = docsConfig
          ? ['docs', 'tree-lazy', docsConfig.owner, docsConfig.repo, docsConfig.branch, docsConfig.docsPath]
          : ['docs', 'tree-lazy'];

        await queryClient.invalidateQueries({ queryKey: treeQueryKey });
        await queryClient.refetchQueries({ queryKey: treeQueryKey });
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast({
        title: 'Error',
        description: `Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  }, [deleteFilePath, deleteFileName, deleteItemType, docsConfig, selectedPath, queryClient, toast, expandedDirs, loadDirectoryChildren]);

  // Flatten tree for search (use lazy-loaded tree with children)
  const flatFiles = useMemo(() => {
    if (!docTreeWithLazyChildren) return [];
    return flattenDocTree(docTreeWithLazyChildren);
  }, [docTreeWithLazyChildren]);

  // Initialize fuzzy search
  const fuse = useMemo(() => {
    if (flatFiles.length === 0) return null;
    return new Fuse(flatFiles, {
      keys: ['name', 'path'],
      threshold: 0.4,
      includeScore: true,
    });
  }, [flatFiles]);

  // Filter files based on search query
  const filteredFiles = useMemo(() => {
    if (!searchQuery || !fuse) return docTreeWithLazyChildren || [];

    const results = fuse.search(searchQuery);
    const paths = new Set(results.map(r => r.item.path));

    // Filter tree to only show matching files and their parents
    const filterTree = (nodes: DocTreeNode[]): DocTreeNode[] => {
      if (!nodes) return [];

      return nodes.map(node => {
        if (node.type === 'file') {
          return paths.has(node.path) ? node : null;
        } else if (node.children) {
          const filteredChildren = filterTree(node.children).filter(Boolean) as DocTreeNode[];
          return filteredChildren.length > 0 ? { ...node, children: filteredChildren } : null;
        }
        return null;
      }).filter(Boolean) as DocTreeNode[];
    };

    return filterTree(docTreeWithLazyChildren || []);
  }, [searchQuery, fuse, docTreeWithLazyChildren]);

  // Auto-select first non-empty file when tree loads
  useEffect(() => {
    if (docTree && !selectedPath) {
      // Find first .md file
      const findFirstFile = (nodes: typeof docTree): string | null => {
        for (const node of nodes) {
          if (node.type === 'file') return node.path;
          if (node.type === 'dir' && node.children) {
            const found = findFirstFile(node.children);
            if (found) return found;
          }
        }
        return null;
      };

      const firstFile = findFirstFile(docTree);
      if (firstFile) setSelectedPath(firstFile);
    }
  }, [docTree, selectedPath]);

  // Skip empty files and files that don't exist (404) automatically
  useEffect(() => {
    const shouldSkip =
      (fileContent !== undefined && fileContent.trim() === '') || // Empty file
      (fileError && fileError.message.includes('not found')); // 404 error

    if (shouldSkip && selectedPath && docTree && !skippedFiles.has(selectedPath)) {
      // Mark this file as skipped to prevent infinite loops
      setSkippedFiles(prev => new Set(prev).add(selectedPath));

      // File is empty or doesn't exist, find next file
      const findNextFile = (nodes: typeof docTree, currentPath: string): string | null => {
        let foundCurrent = false;

        const traverse = (nodes: typeof docTree): string | null => {
          for (const node of nodes) {
            if (node.type === 'file') {
              if (foundCurrent && !skippedFiles.has(node.path)) {
                return node.path;
              }
              if (node.path === currentPath) {
                foundCurrent = true;
              }
            } else if (node.type === 'dir' && node.children) {
              const found = traverse(node.children);
              if (found) return found;
            }
          }
          return null;
        };

        return traverse(nodes);
      };

      const nextFile = findNextFile(docTree, selectedPath);
      if (nextFile) {
        setSelectedPath(nextFile);
      }
    }
  }, [fileContent, fileError, selectedPath, docTree, skippedFiles]);

  // Track active heading on scroll
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const scrollContainer = document.getElementById('docs-content-scroll-container');
    if (!scrollContainer) return;

    const handleScroll = () => {
      const headings = document.querySelectorAll('#docs-content-scroll-container h1[id], #docs-content-scroll-container h2[id], #docs-content-scroll-container h3[id], #docs-content-scroll-container h4[id], #docs-content-scroll-container h5[id], #docs-content-scroll-container h6[id]');
      const containerRect = scrollContainer.getBoundingClientRect();
      const scrollTop = scrollContainer.scrollTop;

      for (let i = headings.length - 1; i >= 0; i--) {
        const heading = headings[i] as HTMLElement;
        const headingRect = heading.getBoundingClientRect();
        const relativeTop = scrollTop + (headingRect.top - containerRect.top);

        if (relativeTop <= scrollTop + 100) {
          setActiveHeadingId(heading.id);
          break;
        }
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [fileContent]);


  if (treeError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white dark:bg-[#0D0D0D]">
        <div className="flex flex-col items-center gap-4 text-red-500 dark:text-red-400">
          <AlertCircle className="h-12 w-12" />
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Failed to Load Documentation</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {treeError.message}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Make sure the backend proxy endpoint is configured correctly
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isTreeLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white dark:bg-[#0D0D0D]">
        <div className="flex flex-col items-center gap-4 text-gray-600 dark:text-gray-400">
          <Loader2 className="h-12 w-12 animate-spin" />
          <p className="text-sm">Loading documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex overflow-hidden bg-white dark:bg-[#0D0D0D]">
      {/* Left Sidebar - Navigation */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-800 flex-shrink-0 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {getDocsTitle()}
            </h2>
            {docsConfig && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const githubUrl = `https://github.tools.sap/${docsConfig.owner}/${docsConfig.repo}/tree/${docsConfig.branch}/${docsConfig.docsPath}`;
                  window.open(githubUrl, '_blank', 'noopener,noreferrer');
                }}
                className="h-8 w-8 p-0 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                title="Open in GitHub"
              >
                <Github className="h-4 w-4" />
              </Button>
            )}
          </div>
          <DocsSearch value={searchQuery} onChange={setSearchQuery} />
          {docsConfig && (
            <div className="pt-2 pb-1 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCreateDocument('')}
                className="h-8 w-8 p-0"
                title="New Document"
              >
                <FilePlus className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCreateFolder('')}
                className="h-8 w-8 p-0"
                title="New Folder"
              >
                <FolderPlus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          <DocsSidebar
            tree={filteredFiles}
            selectedPath={selectedPath}
            onSelect={setSelectedPath}
            onLoadDirectory={loadDirectoryChildren}
            expandedDirs={expandedDirs}
            onCreateFolder={docsConfig ? handleCreateFolder : undefined}
            onCreateDocument={docsConfig ? handleCreateDocument : undefined}
            onDeleteDocument={docsConfig ? handleDeleteDocument : undefined}
            onDeleteFolder={docsConfig ? handleDeleteFolder : undefined}
          />
        </div>
      </div>

      {/* Main Content Area */}
      {isRawMode && fileMetadata && docsConfig ? (
        /* RAW Editor - Full Width */
        <div className="flex-1 overflow-hidden">
          <DocsRawEditor
            content={fileMetadata.rawContent}
            selectedPath={selectedPath || ''}
            fileSHA={fileSHA}
            docsConfig={docsConfig}
            onCancel={() => setIsRawMode(false)}
            onSave={(newContent) => {
              // Refetch metadata to get new SHA
              refetchMetadata();
              setIsRawMode(false);
            }}
          />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
            <>
              {/* Markdown Content */}
              <div id="docs-content-scroll-container" className="flex-1 overflow-y-auto relative">
                {/* Action Buttons - Floating */}
                {selectedPath && fileContent && docsConfig && (
                  <div className="absolute top-1 right-1 min-[1800px]:top-4 min-[1800px]:right-4 z-10 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const githubUrl = `https://github.tools.sap/${docsConfig.owner}/${docsConfig.repo}/blob/${docsConfig.branch}/${docsConfig.docsPath}/${selectedPath}`;
                        window.open(githubUrl, '_blank', 'noopener,noreferrer');
                      }}
                      className="shadow-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 h-8 w-8 p-0 min-[1800px]:h-auto min-[1800px]:w-auto min-[1800px]:px-3 min-[1800px]:py-2"
                      title="Open in GitHub"
                    >
                      <Github className="h-4 w-4 min-[1800px]:mr-2" />
                      <span className="hidden min-[1800px]:inline">Open</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsRawMode(true)}
                      className="shadow-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 h-8 w-8 p-0 min-[1800px]:h-auto min-[1800px]:w-auto min-[1800px]:px-3 min-[1800px]:py-2"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4 min-[1800px]:mr-2" />
                      <span className="hidden min-[1800px]:inline">Edit</span>
                    </Button>
                  </div>
                )}
                <DocsContent
                  content={fileContent}
                  isLoading={isFileLoading}
                  error={fileError}
                  selectedPath={selectedPath}
                  onTableOfContentsChange={setTableOfContents}
                  docsConfig={docsConfig}
                />
              </div>

              {/* Right Sidebar - Table of Contents (hidden on mobile) */}
              {tableOfContents.length > 0 && !isRawMode && (
                <div className="hidden xl:block w-64 border-l border-gray-200 dark:border-gray-800 flex-shrink-0 overflow-hidden">
                  <DocsTableOfContents
                    items={tableOfContents}
                    activeId={activeHeadingId}
                  />
                </div>
              )}
            </>
        </div>
      )}

      {/* Create Item Dialog */}
      <CreateItemDialog
        type={createItemType}
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onConfirm={handleConfirmCreate}
        currentPath={createInPath}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        documentName={deleteFileName}
        itemType={deleteItemType}
      />
    </div>
  );
};

export default DocsPage;
