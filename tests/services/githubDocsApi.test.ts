/**
 * Tests for GitHub Documentation API Service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchGitHubDirectory,
  fetchGitHubFile,
  fetchGitHubFileWithMetadata,
  buildDocTree,
  buildDocTreeLazy,
  searchDocs,
  flattenDocTree,
  createGitHubFile,
  createGitHubFolder,
  deleteGitHubFile,
  deleteGitHubFolder,
  isFolderEmpty,
  DOCS_CONFIG,
  type GitHubContent,
  type DocTreeNode,
} from '@/services/githubDocsApi';
import { ApiClient } from '@/services/ApiClient';

// Create mock functions using vi.hoisted() so they're available during mock hoisting
const { mockGet, mockPost, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockDelete: vi.fn(),
}));

// Mock ApiClient
vi.mock('@/services/ApiClient', () => {
  return {
    ApiClient: vi.fn().mockImplementation(() => ({
      get: mockGet,
      post: mockPost,
      delete: mockDelete,
    })),
  };
});

describe('githubDocsApi', () => {
  let mockApiClient: any;

  beforeEach(() => {
    // Get the mocked ApiClient instance
    mockApiClient = new ApiClient();
    // Clear all mocks before each test
    mockGet.mockClear();
    mockPost.mockClear();
    mockDelete.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchGitHubDirectory', () => {
    it('should fetch directory contents from GitHub', async () => {
      const mockContents: GitHubContent[] = [
        {
          name: 'file1.md',
          path: 'docs/coe/file1.md',
          sha: 'abc123',
          size: 1234,
          url: 'https://api.github.com/...',
          html_url: 'https://github.com/...',
          git_url: 'https://git.github.com/...',
          download_url: 'https://raw.githubusercontent.com/...',
          type: 'file',
          _links: {
            self: 'https://api.github.com/...',
            git: 'https://git.github.com/...',
            html: 'https://github.com/...',
          },
        },
      ];

      mockGet.mockResolvedValue(mockContents);

      const result = await fetchGitHubDirectory();

      expect(mockGet).toHaveBeenCalledWith(
        '/github/githubtools/repos/cfs-platform-engineering/cfs-platform-docs/contents/docs/coe',
        { params: { ref: 'main' } }
      );
      expect(result).toEqual(mockContents);
    });

    it('should fetch subdirectory contents with custom path', async () => {
      const mockContents: GitHubContent[] = [];
      mockGet.mockResolvedValue(mockContents);

      await fetchGitHubDirectory('subfolder');

      expect(mockGet).toHaveBeenCalledWith(
        '/github/githubtools/repos/cfs-platform-engineering/cfs-platform-docs/contents/docs/coe/subfolder',
        { params: { ref: 'main' } }
      );
    });

    it('should use custom config when provided', async () => {
      const customConfig = {
        owner: 'custom-org',
        repo: 'custom-repo',
        branch: 'develop',
        docsPath: 'documentation',
      };
      mockGet.mockResolvedValue([]);

      await fetchGitHubDirectory('', customConfig);

      expect(mockGet).toHaveBeenCalledWith(
        '/github/githubtools/repos/custom-org/custom-repo/contents/documentation',
        { params: { ref: 'develop' } }
      );
    });

    it('should handle API errors', async () => {
      mockGet.mockRejectedValue(new Error('API Error'));

      await expect(fetchGitHubDirectory()).rejects.toThrow('API Error');
    });
  });

  describe('fetchGitHubFile', () => {
    it('should fetch file content without frontmatter', async () => {
      const mockContent: GitHubContent = {
        name: 'test.md',
        path: 'docs/coe/test.md',
        sha: 'def456',
        size: 500,
        url: 'https://api.github.com/...',
        html_url: 'https://github.com/...',
        git_url: 'https://git.github.com/...',
        download_url: 'https://raw.githubusercontent.com/...',
        type: 'file',
        content: '# Test Content\n\nThis is a test file.',
        encoding: 'utf-8',
        _links: {
          self: 'https://api.github.com/...',
          git: 'https://git.github.com/...',
          html: 'https://github.com/...',
        },
      };

      mockGet.mockResolvedValue(mockContent);

      const result = await fetchGitHubFile('test.md');

      expect(mockGet).toHaveBeenCalledWith(
        '/github/githubtools/repos/cfs-platform-engineering/cfs-platform-docs/contents/docs/coe/test.md',
        { params: { ref: 'main' } }
      );
      expect(result).toBe('# Test Content\n\nThis is a test file.');
    });

    it('should remove YAML frontmatter from content', async () => {
      const mockContent: GitHubContent = {
        name: 'test.md',
        path: 'docs/coe/test.md',
        sha: 'def456',
        size: 500,
        url: 'https://api.github.com/...',
        html_url: 'https://github.com/...',
        git_url: 'https://git.github.com/...',
        download_url: 'https://raw.githubusercontent.com/...',
        type: 'file',
        content: '---\ntitle: Test\nauthor: John\n---\n\n# Test Content',
        encoding: 'utf-8',
        _links: {
          self: 'https://api.github.com/...',
          git: 'https://git.github.com/...',
          html: 'https://github.com/...',
        },
      };

      mockGet.mockResolvedValue(mockContent);

      const result = await fetchGitHubFile('test.md');

      expect(result).toBe('# Test Content');
    });

    it('should handle files without content', async () => {
      const mockContent: GitHubContent = {
        name: 'test.md',
        path: 'docs/coe/test.md',
        sha: 'def456',
        size: 500,
        url: 'https://api.github.com/...',
        html_url: 'https://github.com/...',
        git_url: 'https://git.github.com/...',
        download_url: 'https://raw.githubusercontent.com/...',
        type: 'file',
        _links: {
          self: 'https://api.github.com/...',
          git: 'https://git.github.com/...',
          html: 'https://github.com/...',
        },
      };

      mockGet.mockResolvedValue(mockContent);

      await expect(fetchGitHubFile('test.md')).rejects.toThrow('Invalid file content');
    });

    it('should handle path with docsPath prefix', async () => {
      const mockContent: GitHubContent = {
        name: 'test.md',
        path: 'docs/coe/test.md',
        sha: 'def456',
        size: 500,
        url: 'https://api.github.com/...',
        html_url: 'https://github.com/...',
        git_url: 'https://git.github.com/...',
        download_url: 'https://raw.githubusercontent.com/...',
        type: 'file',
        content: '# Content',
        _links: {
          self: 'https://api.github.com/...',
          git: 'https://git.github.com/...',
          html: 'https://github.com/...',
        },
      };

      mockGet.mockResolvedValue(mockContent);

      await fetchGitHubFile('docs/coe/test.md');

      expect(mockGet).toHaveBeenCalledWith(
        '/github/githubtools/repos/cfs-platform-engineering/cfs-platform-docs/contents/docs/coe/test.md',
        { params: { ref: 'main' } }
      );
    });
  });

  describe('fetchGitHubFileWithMetadata', () => {
    it('should fetch file with metadata including SHA', async () => {
      const mockContent: GitHubContent = {
        name: 'test.md',
        path: 'docs/coe/test.md',
        sha: 'sha123',
        size: 500,
        url: 'https://api.github.com/...',
        html_url: 'https://github.com/...',
        git_url: 'https://git.github.com/...',
        download_url: 'https://raw.githubusercontent.com/...',
        type: 'file',
        content: '---\ntitle: Test\n---\n\n# Content',
        _links: {
          self: 'https://api.github.com/...',
          git: 'https://git.github.com/...',
          html: 'https://github.com/...',
        },
      };

      mockGet.mockResolvedValue(mockContent);

      const result = await fetchGitHubFileWithMetadata('test.md');

      expect(result).toEqual({
        content: '# Content',
        sha: 'sha123',
        rawContent: '---\ntitle: Test\n---\n\n# Content',
      });
    });

    it('should throw error if no content', async () => {
      const mockContent: GitHubContent = {
        name: 'test.md',
        path: 'docs/coe/test.md',
        sha: 'sha123',
        size: 500,
        url: 'https://api.github.com/...',
        html_url: 'https://github.com/...',
        git_url: 'https://git.github.com/...',
        download_url: 'https://raw.githubusercontent.com/...',
        type: 'file',
        _links: {
          self: 'https://api.github.com/...',
          git: 'https://git.github.com/...',
          html: 'https://github.com/...',
        },
      };

      mockGet.mockResolvedValue(mockContent);

      await expect(fetchGitHubFileWithMetadata('test.md')).rejects.toThrow(
        'Invalid file content'
      );
    });
  });

  describe('buildDocTree', () => {
    it('should build a complete doc tree recursively', async () => {
      const mockRootContents: GitHubContent[] = [
        {
          name: 'file1.md',
          path: 'docs/coe/file1.md',
          sha: 'abc1',
          size: 100,
          url: '',
          html_url: 'https://github.com/file1',
          git_url: '',
          download_url: '',
          type: 'file',
          _links: { self: '', git: '', html: '' },
        },
        {
          name: 'folder1',
          path: 'docs/coe/folder1',
          sha: 'abc2',
          size: 0,
          url: '',
          html_url: '',
          git_url: '',
          download_url: null,
          type: 'dir',
          _links: { self: '', git: '', html: '' },
        },
      ];

      const mockSubContents: GitHubContent[] = [
        {
          name: 'file2.md',
          path: 'docs/coe/folder1/file2.md',
          sha: 'abc3',
          size: 100,
          url: '',
          html_url: 'https://github.com/file2',
          git_url: '',
          download_url: '',
          type: 'file',
          _links: { self: '', git: '', html: '' },
        },
      ];

      mockGet
        .mockResolvedValueOnce(mockRootContents)
        .mockResolvedValueOnce(mockSubContents);

      const result = await buildDocTree();

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('dir');
      expect(result[0].name).toBe('folder1');
      expect(result[0].children).toHaveLength(1);
      expect(result[1].type).toBe('file');
      expect(result[1].name).toBe('file1.md');
    });

    it('should filter out non-markdown files', async () => {
      const mockContents: GitHubContent[] = [
        {
          name: 'file.md',
          path: 'docs/coe/file.md',
          sha: 'abc1',
          size: 100,
          url: '',
          html_url: 'https://github.com/file',
          git_url: '',
          download_url: '',
          type: 'file',
          _links: { self: '', git: '', html: '' },
        },
        {
          name: 'image.png',
          path: 'docs/coe/image.png',
          sha: 'abc2',
          size: 100,
          url: '',
          html_url: '',
          git_url: '',
          download_url: '',
          type: 'file',
          _links: { self: '', git: '', html: '' },
        },
      ];

      mockGet.mockResolvedValue(mockContents);

      const result = await buildDocTree();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('file.md');
    });

    it('should sort directories before files', async () => {
      const mockContents: GitHubContent[] = [
        {
          name: 'zebra.md',
          path: 'docs/coe/zebra.md',
          sha: 'abc1',
          size: 100,
          url: '',
          html_url: 'https://github.com/zebra',
          git_url: '',
          download_url: '',
          type: 'file',
          _links: { self: '', git: '', html: '' },
        },
        {
          name: 'aardvark',
          path: 'docs/coe/aardvark',
          sha: 'abc2',
          size: 0,
          url: '',
          html_url: '',
          git_url: '',
          download_url: null,
          type: 'dir',
          _links: { self: '', git: '', html: '' },
        },
      ];

      mockGet.mockResolvedValueOnce(mockContents).mockResolvedValueOnce([]);

      const result = await buildDocTree();

      expect(result[0].type).toBe('dir');
      expect(result[0].name).toBe('aardvark');
      expect(result[1].type).toBe('file');
      expect(result[1].name).toBe('zebra.md');
    });
  });

  describe('buildDocTreeLazy', () => {
    it('should build tree without loading subdirectory children', async () => {
      const mockContents: GitHubContent[] = [
        {
          name: 'file1.md',
          path: 'docs/coe/file1.md',
          sha: 'abc1',
          size: 100,
          url: '',
          html_url: 'https://github.com/file1',
          git_url: '',
          download_url: '',
          type: 'file',
          _links: { self: '', git: '', html: '' },
        },
        {
          name: 'folder1',
          path: 'docs/coe/folder1',
          sha: 'abc2',
          size: 0,
          url: '',
          html_url: '',
          git_url: '',
          download_url: null,
          type: 'dir',
          _links: { self: '', git: '', html: '' },
        },
      ];

      mockGet.mockResolvedValue(mockContents);

      const result = await buildDocTreeLazy();

      expect(mockGet).toHaveBeenCalledTimes(1); // Only root level
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('dir');
      expect(result[0].children).toBeUndefined(); // Not loaded yet
    });

    it('should work with custom config', async () => {
      const customConfig = {
        owner: 'test-org',
        repo: 'test-repo',
        branch: 'dev',
        docsPath: 'docs/test',
      };

      mockGet.mockResolvedValue([]);

      await buildDocTreeLazy(customConfig);

      expect(mockGet).toHaveBeenCalledWith(
        '/github/githubtools/repos/test-org/test-repo/contents/docs/test',
        { params: { ref: 'dev' } }
      );
    });

    it('should support legacy path string parameter', async () => {
      mockGet.mockResolvedValue([]);

      await buildDocTreeLazy('subfolder');

      expect(mockGet).toHaveBeenCalledWith(
        '/github/githubtools/repos/cfs-platform-engineering/cfs-platform-docs/contents/docs/coe/subfolder',
        { params: { ref: 'main' } }
      );
    });
  });

  describe('searchDocs', () => {
    it('should search through markdown files and return matches', async () => {
      const docTree: DocTreeNode[] = [
        {
          name: 'test1.md',
          path: 'test1.md',
          type: 'file',
        },
        {
          name: 'test2.md',
          path: 'test2.md',
          type: 'file',
        },
      ];

      mockGet
        .mockResolvedValueOnce({
          content: 'This is a test document with searchable content.',
        })
        .mockResolvedValueOnce({
          content: 'Another document without the keyword.',
        });

      const results = await searchDocs('searchable', docTree);

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('test1.md');
      expect(results[0].excerpt).toContain('searchable');
    });

    it('should search recursively through directories', async () => {
      const docTree: DocTreeNode[] = [
        {
          name: 'folder',
          path: 'folder',
          type: 'dir',
          children: [
            {
              name: 'nested.md',
              path: 'folder/nested.md',
              type: 'file',
            },
          ],
        },
      ];

      mockGet.mockResolvedValueOnce({
        content: 'Nested content with keyword.',
      });

      const results = await searchDocs('keyword', docTree);

      expect(results).toHaveLength(1);
      expect(results[0].path).toBe('folder/nested.md');
    });

    it('should handle search errors gracefully', async () => {
      const docTree: DocTreeNode[] = [
        {
          name: 'test.md',
          path: 'test.md',
          type: 'file',
        },
      ];

      mockGet.mockRejectedValue(new Error('File not found'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const results = await searchDocs('test', docTree);

      expect(results).toHaveLength(0);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should return empty array for no matches', async () => {
      const docTree: DocTreeNode[] = [
        {
          name: 'test.md',
          path: 'test.md',
          type: 'file',
        },
      ];

      mockGet.mockResolvedValue({
        content: 'This content has no matching terms.',
      });

      const results = await searchDocs('nonexistent', docTree);

      expect(results).toHaveLength(0);
    });
  });

  describe('flattenDocTree', () => {
    it('should flatten a nested tree structure', () => {
      const tree: DocTreeNode[] = [
        {
          name: 'file1.md',
          path: 'file1.md',
          type: 'file',
        },
        {
          name: 'folder',
          path: 'folder',
          type: 'dir',
          children: [
            {
              name: 'file2.md',
              path: 'folder/file2.md',
              type: 'file',
            },
            {
              name: 'subfolder',
              path: 'folder/subfolder',
              type: 'dir',
              children: [
                {
                  name: 'file3.md',
                  path: 'folder/subfolder/file3.md',
                  type: 'file',
                },
              ],
            },
          ],
        },
      ];

      const result = flattenDocTree(tree);

      expect(result).toHaveLength(3);
      expect(result[0].path).toBe('file1.md');
      expect(result[1].path).toBe('folder/file2.md');
      expect(result[2].path).toBe('folder/subfolder/file3.md');
    });

    it('should return empty array for empty tree', () => {
      const result = flattenDocTree([]);
      expect(result).toHaveLength(0);
    });

    it('should ignore directories in flattened list', () => {
      const tree: DocTreeNode[] = [
        {
          name: 'folder',
          path: 'folder',
          type: 'dir',
          children: [],
        },
      ];

      const result = flattenDocTree(tree);
      expect(result).toHaveLength(0);
    });
  });

  describe('createGitHubFile', () => {
    it('should create a new file with content', async () => {
      mockPost.mockResolvedValue({ success: true });

      await createGitHubFile('newfile.md', '# New Content', 'Create newfile.md');

      expect(mockPost).toHaveBeenCalledWith(
        '/github/githubtools/repos/cfs-platform-engineering/cfs-platform-docs/contents/docs/coe/newfile.md',
        {
          message: 'Create newfile.md',
          content: '# New Content',
          branch: 'main',
        }
      );
    });

    it('should use custom config when provided', async () => {
      const customConfig = {
        owner: 'custom-org',
        repo: 'custom-repo',
        branch: 'develop',
        docsPath: 'documentation',
      };
      mockPost.mockResolvedValue({ success: true });

      await createGitHubFile('file.md', 'Content', 'Create file', customConfig);

      expect(mockPost).toHaveBeenCalledWith(
        '/github/githubtools/repos/custom-org/custom-repo/contents/documentation/file.md',
        {
          message: 'Create file',
          content: 'Content',
          branch: 'develop',
        }
      );
    });

    it('should handle creation errors', async () => {
      mockPost.mockRejectedValue(new Error('Permission denied'));

      await expect(
        createGitHubFile('file.md', 'Content', 'Create file')
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('createGitHubFolder', () => {
    it('should create a folder by creating .gitkeep file', async () => {
      mockPost.mockResolvedValue({ success: true });

      await createGitHubFolder('newfolder');

      expect(mockPost).toHaveBeenCalledWith(
        '/github/githubtools/repos/cfs-platform-engineering/cfs-platform-docs/contents/docs/coe/newfolder/.gitkeep',
        {
          message: 'Create folder: newfolder',
          content: '\n',
          branch: 'main',
        }
      );
    });

    it('should work with nested folder paths', async () => {
      mockPost.mockResolvedValue({ success: true });

      await createGitHubFolder('parent/child');

      expect(mockPost).toHaveBeenCalledWith(
        '/github/githubtools/repos/cfs-platform-engineering/cfs-platform-docs/contents/docs/coe/parent/child/.gitkeep',
        expect.objectContaining({
          message: 'Create folder: parent/child',
        })
      );
    });
  });

  describe('deleteGitHubFile', () => {
    it('should delete a file with SHA', async () => {
      mockDelete.mockResolvedValue({ success: true });

      await deleteGitHubFile('file.md', 'sha123', 'Delete file.md');

      expect(mockDelete).toHaveBeenCalledWith(
        '/github/githubtools/repos/cfs-platform-engineering/cfs-platform-docs/contents/docs/coe/file.md',
        {
          message: 'Delete file.md',
          sha: 'sha123',
          branch: 'main',
        }
      );
    });

    it('should use custom config when provided', async () => {
      const customConfig = {
        owner: 'test-org',
        repo: 'test-repo',
        branch: 'dev',
        docsPath: 'docs',
      };
      mockDelete.mockResolvedValue({ success: true });

      await deleteGitHubFile('file.md', 'sha456', 'Delete', customConfig);

      expect(mockDelete).toHaveBeenCalledWith(
        '/github/githubtools/repos/test-org/test-repo/contents/docs/file.md',
        {
          message: 'Delete',
          sha: 'sha456',
          branch: 'dev',
        }
      );
    });

    it('should handle deletion errors', async () => {
      mockDelete.mockRejectedValue(new Error('File not found'));

      await expect(deleteGitHubFile('file.md', 'sha', 'Delete')).rejects.toThrow(
        'File not found'
      );
    });
  });

  describe('deleteGitHubFolder', () => {
    it('should delete a folder', async () => {
      mockDelete.mockResolvedValue({ success: true });

      await deleteGitHubFolder('folder', 'Delete folder');

      expect(mockDelete).toHaveBeenCalledWith(
        '/github/githubtools/repos/cfs-platform-engineering/cfs-platform-docs/folders/docs/coe/folder',
        {
          message: 'Delete folder',
          branch: 'main',
        }
      );
    });

    it('should work with nested folder paths', async () => {
      mockDelete.mockResolvedValue({ success: true });

      await deleteGitHubFolder('parent/child', 'Delete nested folder');

      expect(mockDelete).toHaveBeenCalledWith(
        '/github/githubtools/repos/cfs-platform-engineering/cfs-platform-docs/folders/docs/coe/parent/child',
        expect.objectContaining({
          message: 'Delete nested folder',
        })
      );
    });
  });

  describe('isFolderEmpty', () => {
    it('should return true for folder with only .gitkeep', async () => {
      const mockContents: GitHubContent[] = [
        {
          name: '.gitkeep',
          path: 'docs/coe/folder/.gitkeep',
          sha: 'abc',
          size: 0,
          url: '',
          html_url: '',
          git_url: '',
          download_url: '',
          type: 'file',
          _links: { self: '', git: '', html: '' },
        },
      ];

      mockGet.mockResolvedValue(mockContents);

      const result = await isFolderEmpty('folder');

      expect(result).toBe(true);
    });

    it('should return false for folder with files', async () => {
      const mockContents: GitHubContent[] = [
        {
          name: '.gitkeep',
          path: 'docs/coe/folder/.gitkeep',
          sha: 'abc',
          size: 0,
          url: '',
          html_url: '',
          git_url: '',
          download_url: '',
          type: 'file',
          _links: { self: '', git: '', html: '' },
        },
        {
          name: 'file.md',
          path: 'docs/coe/folder/file.md',
          sha: 'def',
          size: 100,
          url: '',
          html_url: '',
          git_url: '',
          download_url: '',
          type: 'file',
          _links: { self: '', git: '', html: '' },
        },
      ];

      mockGet.mockResolvedValue(mockContents);

      const result = await isFolderEmpty('folder');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockGet.mockRejectedValue(new Error('Folder not found'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await isFolderEmpty('folder');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should return false for empty folder without .gitkeep', async () => {
      mockGet.mockResolvedValue([]);

      const result = await isFolderEmpty('folder');

      expect(result).toBe(false);
    });
  });

  describe('DOCS_CONFIG', () => {
    it('should have correct default configuration', () => {
      expect(DOCS_CONFIG).toEqual({
        owner: 'cfs-platform-engineering',
        repo: 'cfs-platform-docs',
        branch: 'main',
        docsPath: 'docs/coe',
      });
    });
  });
});