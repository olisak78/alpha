/**
 * Docs Sidebar - File tree navigation
 */

import React, { useState } from 'react';
import { DocTreeNode } from '@/services/githubDocsApi';
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen, Loader2 } from 'lucide-react';

interface DocsSidebarProps {
  tree: DocTreeNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onLoadDirectory?: (path: string) => void | Promise<void>; // Callback for lazy loading
  expandedDirs?: Set<string>; // Externally managed expanded state for lazy loading
}

export const DocsSidebar: React.FC<DocsSidebarProps> = ({
  tree,
  selectedPath,
  onSelect,
  onLoadDirectory,
  expandedDirs
}) => {
  const [internalExpandedFolders, setInternalExpandedFolders] = useState<Set<string>>(new Set());

  // Use external expanded state if provided (for lazy loading), otherwise use internal state
  const expandedFolders = expandedDirs || internalExpandedFolders;

  const toggleFolder = (path: string) => {
    // If lazy loading callback is provided, use it
    if (onLoadDirectory) {
      onLoadDirectory(path);
    } else {
      // Otherwise, use internal state management
      setInternalExpandedFolders(prev => {
        const next = new Set(prev);
        if (next.has(path)) {
          next.delete(path);
        } else {
          next.add(path);
        }
        return next;
      });
    }
  };

  const renderNode = (node: DocTreeNode, depth = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedPath === node.path;

    if (node.type === 'dir') {
      return (
        <div key={node.path}>
          <button
            onClick={() => toggleFolder(node.path)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            style={{ paddingLeft: `${depth * 12 + 12}px` }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 flex-shrink-0 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 flex-shrink-0 text-blue-500" />
            )}
            <span className="truncate">{node.name}</span>
          </button>
          {isExpanded && (
            <div>
              {node.children === undefined ? (
                // Lazy loading - children not loaded yet, show loader
                <div
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400"
                  style={{ paddingLeft: `${(depth + 1) * 12 + 32}px` }}
                >
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-xs">Loading...</span>
                </div>
              ) : node.children.length === 0 ? (
                // Empty directory
                <div
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400"
                  style={{ paddingLeft: `${(depth + 1) * 12 + 32}px` }}
                >
                  <span className="text-xs italic">Empty folder</span>
                </div>
              ) : (
                // Children loaded, render them
                node.children.map(child => renderNode(child, depth + 1))
              )}
            </div>
          )}
        </div>
      );
    }

    // File node
    const fileName = node.name.replace('.md', '');
    return (
      <button
        key={node.path}
        onClick={() => onSelect(node.path)}
        className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
          isSelected
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        style={{ paddingLeft: `${depth * 12 + 32}px` }}
      >
        <FileText className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{fileName}</span>
      </button>
    );
  };

  return (
    <div className="py-2">
      {tree.length === 0 ? (
        <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
          No documentation files found
        </div>
      ) : (
        tree.map(node => renderNode(node))
      )}
    </div>
  );
};
