/**
 * Docs Raw Editor Component - Editable markdown view with save functionality
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Save, X, Loader2 } from 'lucide-react';
import { apiClient } from '@/services/ApiClient';
import { useToast } from '@/hooks/use-toast';

// Simple markdown syntax highlighting - GitHub style
const highlightMarkdown = (text: string): string => {
  // Escape HTML to prevent XSS
  const escapeHtml = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  let highlighted = escapeHtml(text)
    // Headers - GitHub blue with semibold
    .replace(/^(#{1,6})\s+(.+)$/gm, '<span class="md-header">$1 $2</span>')
    // Code blocks with language - keep the ticks visible
    .replace(/^```(\w+)?$/gm, '<span class="md-code-fence">```$1</span>')
    // Lists - must come before bold/italic to avoid conflicts with asterisks
    .replace(/^(\s*)([-*+])\s/gm, '$1<span class="md-list">$2</span> ')
    .replace(/^(\s*)(\d+)\.\s/gm, '$1<span class="md-list">$2.</span> ')
    // Bold - keep normal color but ensure bold (must come before italic)
    .replace(/\*\*(.+?)\*\*/g, '<span class="md-bold">**$1**</span>')
    // Italic - keep normal color but ensure italic
    .replace(/\*(.+?)\*/g, '<span class="md-italic">*$1*</span>')
    // Inline code - muted gray with subtle background
    .replace(/`([^`]+)`/g, '<span class="md-inline-code">`$1`</span>')
    // Links - blue for brackets, purple for URL
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span class="md-link-text">[$1]</span><span class="md-link-url">($2)</span>')
    // Image syntax - blue for brackets, purple for URL
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<span class="md-link-text">![$1]</span><span class="md-link-url">($2)</span>')
    // Blockquotes - gray
    .replace(/^(&gt;)\s/gm, '<span class="md-blockquote">$1</span> ');

  return highlighted;
};

interface DocsRawEditorProps {
  content: string;
  selectedPath: string;
  fileSHA: string;
  docsConfig: {
    owner: string;
    repo: string;
    branch: string;
    docsPath: string;
  };
  onCancel: () => void;
  onSave: (newContent: string) => void;
}

export const DocsRawEditor: React.FC<DocsRawEditorProps> = ({
  content,
  selectedPath,
  fileSHA,
  docsConfig,
  onCancel,
  onSave,
}) => {
  const [editedContent, setEditedContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  // Detect dark mode
  const isDarkMode = document.documentElement.classList.contains('dark');

  useEffect(() => {
    setEditedContent(content);
    setHasChanges(false);
  }, [content]);

  useEffect(() => {
    setHasChanges(editedContent !== content);
  }, [editedContent, content]);

  // Memoize highlighted content for performance
  const highlightedContent = useMemo(() => {
    return highlightMarkdown(editedContent);
  }, [editedContent]);

  const handleSave = async () => {
    if (!hasChanges) {
      toast({
        title: 'No changes',
        description: 'No changes to save',
      });
      return;
    }

    setIsSaving(true);

    try {
      // Prepare the full path
      const fullPath = selectedPath.startsWith(docsConfig.docsPath)
        ? selectedPath
        : `${docsConfig.docsPath}/${selectedPath}`;

      // Call GitHub API to update the file
      const url = `/github/repos/${docsConfig.owner}/${docsConfig.repo}/contents/${fullPath}`;

      await apiClient.put(url, {
        message: `Update ${selectedPath.split('/').pop()} via Developer Portal`,
        content: editedContent,
        sha: fileSHA,
        branch: docsConfig.branch,
      });

      toast({
        title: 'Success',
        description: 'File saved successfully',
      });

      onSave(editedContent);
    } catch (error) {
      console.error('Failed to save file:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save file',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-[#0D0D0D]">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D0D0D]">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Edit: {selectedPath.split('/').pop()}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {docsConfig.owner}/{docsConfig.repo} - {docsConfig.branch}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-sm text-amber-600 dark:text-amber-400">
              Unsaved changes
            </span>
          )}
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save to GitHub
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 relative bg-white dark:bg-[#0D0D0D] overflow-hidden">
        <style>{`
          .markdown-highlight {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            padding: 1rem 1.5rem;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 0.875rem;
            line-height: 1.5;
            letter-spacing: 0.01em;
            pointer-events: none;
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow: hidden;
            z-index: 1;
            color: #24292f;
          }
          .dark .markdown-highlight {
            color: #e6edf3;
          }
          .markdown-editor {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            padding: 1rem 1.5rem;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 0.875rem;
            line-height: 1.5;
            letter-spacing: 0.01em;
            background: transparent;
            color: transparent;
            caret-color: #24292f;
            border: 0;
            outline: none;
            resize: none;
            overflow: auto;
            tab-size: 2;
            -moz-tab-size: 2;
            z-index: 2;
          }
          .dark .markdown-editor {
            caret-color: #ffffff;
          }
          .markdown-editor::selection {
            background-color: rgba(59, 130, 246, 0.3);
          }

          /* Markdown syntax highlighting - Light mode */
          .markdown-highlight .md-header {
            color: #0969da;
            font-weight: 600;
          }
          .markdown-highlight .md-code-fence {
            color: #0969da;
          }
          .markdown-highlight .md-list {
            color: #cf222e;
          }
          .markdown-highlight .md-bold {
            font-weight: 600;
          }
          .markdown-highlight .md-italic {
            font-style: italic;
          }
          .markdown-highlight .md-inline-code {
            color: #24292f;
            background: rgba(175, 184, 193, 0.2);
            padding: 0.2em 0.4em;
            border-radius: 3px;
          }
          .markdown-highlight .md-link-text {
            color: #0969da;
          }
          .markdown-highlight .md-link-url {
            color: #8250df;
          }
          .markdown-highlight .md-blockquote {
            color: #57606a;
          }

          /* Markdown syntax highlighting - Dark mode */
          .dark .markdown-highlight .md-header {
            color: #58a6ff;
            font-weight: 600;
          }
          .dark .markdown-highlight .md-code-fence {
            color: #58a6ff;
          }
          .dark .markdown-highlight .md-list {
            color: #ff7b72;
          }
          .dark .markdown-highlight .md-inline-code {
            color: #e6edf3;
            background: rgba(110, 118, 129, 0.4);
            padding: 0.2em 0.4em;
            border-radius: 3px;
          }
          .dark .markdown-highlight .md-link-text {
            color: #58a6ff;
          }
          .dark .markdown-highlight .md-link-url {
            color: #d2a8ff;
          }
          .dark .markdown-highlight .md-blockquote {
            color: #8b949e;
          }
        `}</style>

        <div
          className="markdown-highlight"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: highlightedContent }}
        />

        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          onScroll={(e) => {
            const target = e.target as HTMLTextAreaElement;
            const highlight = target.previousElementSibling as HTMLDivElement;
            if (highlight) {
              highlight.scrollTop = target.scrollTop;
              highlight.scrollLeft = target.scrollLeft;
            }
          }}
          className="markdown-editor"
          placeholder="Enter markdown content..."
          spellCheck={false}
        />
      </div>

      {/* Editor Footer */}
      <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            Lines: {editedContent.split('\n').length} | Characters: {editedContent.length}
          </span>
          <span>
            Editing as authenticated user • Changes will be committed to {docsConfig.branch}
          </span>
        </div>
      </div>
    </div>
  );
};
