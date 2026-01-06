import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';

// Create a mock for the get method
const mockGet = vi.fn();

// Mock the ApiClient module before any imports
vi.doMock('../../src/services/ApiClient', () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    get: mockGet,
  })),
}));

// Dynamic import after mocking
let githubDocsApi: typeof import('../../src/services/githubDocsApi');

beforeAll(async () => {
  githubDocsApi = await import('../../src/services/githubDocsApi');
});

describe('githubDocsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper function to create mock GitHub content
  const createMockGitHubContent = (overrides?: any): any => ({
    name: 'test-file.md',
    path: 'docs/coe/test-file.md',
    sha: 'abc123',
    size: 1024,
    url: 'https://api.github.com/repos/org/repo/contents/docs/coe/test-file.md',
    html_url: 'https://github.com/org/repo/blob/main/docs/coe/test-file.md',
    git_url: 'https://api.github.com/repos/org/repo/git/blobs/abc123',
    download_url: 'https://raw.githubusercontent.com/org/repo/main/docs/coe/test-file.md',
    type: 'file',
    content: '# Test Content\n\nThis is test content.',
    encoding: 'utf-8',
    _links: {
      self: 'https://api.github.com/repos/org/repo/contents/docs/coe/test-file.md',
      git: 'https://api.github.com/repos/org/repo/git/blobs/abc123',
      html: 'https://github.com/org/repo/blob/main/docs/coe/test-file.md',
    },
    ...overrides,
  });

  // ============================================================================
  // DOCS_CONFIG TESTS
  // ============================================================================

  describe('DOCS_CONFIG', () => {
    it('should have correct default configuration', () => {
      expect(githubDocsApi.DOCS_CONFIG).toEqual({
        owner: 'cfs-platform-engineering',
        repo: 'cfs-platform-docs',
        branch: 'main',
        docsPath: 'docs/coe',
      });
    });
  });

  // ============================================================================
  // fetchGitHubDirectory TESTS
  // ============================================================================

  describe('fetchGitHubDirectory', () => {
    it('should fetch directory contents with default config and empty path', async () => {
      const mockResponse: any[] = [
        createMockGitHubContent({ name: 'file1.md', type: 'file' }),
        createMockGitHubContent({ name: 'folder1', type: 'dir' }),
      ];

      mockGet.mockResolvedValue(mockResponse);

      const result = await githubDocsApi.fetchGitHubDirectory();

      expect(mockGet).toHaveBeenCalledWith(
        '/github/repos/cfs-platform-engineering/cfs-platform-docs/contents/docs/coe',
        { params: { ref: 'main' } }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should fetch directory contents with custom path', async () => {
      const mockResponse: any[] = [
        createMockGitHubContent({ name: 'nested-file.md', type: 'file' }),
      ];

      mockGet.mockResolvedValue(mockResponse);

      const result = await githubDocsApi.fetchGitHubDirectory('subfolder');

      expect(mockGet).toHaveBeenCalledWith(
        '/github/repos/cfs-platform-engineering/cfs-platform-docs/contents/docs/coe/subfolder',
        { params: { ref: 'main' } }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should fetch directory contents with custom config', async () => {
      const customConfig = {
        owner: 'custom-org',
        repo: 'custom-repo',
        branch: 'develop',
        docsPath: 'documentation',
      };

      const mockResponse: any[] = [
        createMockGitHubContent({ name: 'custom-file.md', type: 'file' }),
      ];

      mockGet.mockResolvedValue(mockResponse);

      const result = await githubDocsApi.fetchGitHubDirectory('', customConfig);

      expect(mockGet).toHaveBeenCalledWith(
        '/github/repos/custom-org/custom-repo/contents/documentation',
        { params: { ref: 'develop' } }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const error = new Error('GitHub API Error');
      mockGet.mockRejectedValue(error);

      await expect(githubDocsApi.fetchGitHubDirectory()).rejects.toThrow('GitHub API Error');
    });

    it('should handle empty directory', async () => {
      const mockResponse: any[] = [];
      mockGet.mockResolvedValue(mockResponse);

      const result = await githubDocsApi.fetchGitHubDirectory();

      expect(result).toEqual([]);
    });
  });

  // ============================================================================
  // fetchGitHubFile TESTS
  // ============================================================================

  describe('fetchGitHubFile', () => {
    it('should fetch file content and remove frontmatter', async () => {
      const mockContent = '---\ntitle: Test\nauthor: John\n---\n\n# Test Content\n\nThis is the actual content.';
      const mockResponse = createMockGitHubContent({
        content: mockContent,
      });

      mockGet.mockResolvedValue(mockResponse);

      const result = await githubDocsApi.fetchGitHubFile('test-file.md');

      expect(mockGet).toHaveBeenCalledWith(
        '/github/repos/cfs-platform-engineering/cfs-platform-docs/contents/docs/coe/test-file.md',
        { params: { ref: 'main' } }
      );
      expect(result).toBe('# Test Content\n\nThis is the actual content.');
    });

    it('should fetch file content without frontmatter', async () => {
      const mockContent = '# Test Content\n\nThis is content without frontmatter.';
      const mockResponse = createMockGitHubContent({
        content: mockContent,
      });

      mockGet.mockResolvedValue(mockResponse);

      const result = await githubDocsApi.fetchGitHubFile('test-file.md');

      expect(result).toBe('# Test Content\n\nThis is content without frontmatter.');
    });

    it('should handle path that already includes docsPath', async () => {
      const mockContent = '# Test Content';
      const mockResponse = createMockGitHubContent({
        content: mockContent,
      });

      mockGet.mockResolvedValue(mockResponse);

      const result = await githubDocsApi.fetchGitHubFile('docs/coe/test-file.md');

      expect(mockGet).toHaveBeenCalledWith(
        '/github/repos/cfs-platform-engineering/cfs-platform-docs/contents/docs/coe/test-file.md',
        { params: { ref: 'main' } }
      );
      expect(result).toBe('# Test Content');
    });

    it('should use custom config', async () => {
      const customConfig = {
        owner: 'custom-org',
        repo: 'custom-repo',
        branch: 'develop',
        docsPath: 'documentation',
      };

      const mockContent = '# Custom Content';
      const mockResponse = createMockGitHubContent({
        content: mockContent,
      });

      mockGet.mockResolvedValue(mockResponse);

      const result = await githubDocsApi.fetchGitHubFile('test-file.md', customConfig);

      expect(mockGet).toHaveBeenCalledWith(
        '/github/repos/custom-org/custom-repo/contents/documentation/test-file.md',
        { params: { ref: 'develop' } }
      );
      expect(result).toBe('# Custom Content');
    });

    it('should throw error when content is missing', async () => {
      const mockResponse = createMockGitHubContent({
        content: undefined,
      });

      mockGet.mockResolvedValue(mockResponse);

      await expect(githubDocsApi.fetchGitHubFile('test-file.md')).rejects.toThrow('Invalid file content');
    });

    it('should handle frontmatter edge cases', async () => {
      // Test malformed frontmatter
      const malformedContent = '---\ntitle: Test\n# Missing closing frontmatter\n\nContent here.';
      const malformedResponse = createMockGitHubContent({ content: malformedContent });
      mockGet.mockResolvedValueOnce(malformedResponse);
      
      const malformedResult = await githubDocsApi.fetchGitHubFile('malformed.md');
      expect(malformedResult).toBe(malformedContent);

      // Test empty frontmatter
      const emptyFrontmatterContent = '---\n---\n\n# Content';
      const emptyResponse = createMockGitHubContent({ content: emptyFrontmatterContent });
      mockGet.mockResolvedValueOnce(emptyResponse);
      
      const emptyResult = await githubDocsApi.fetchGitHubFile('empty-frontmatter.md');
      expect(emptyResult).toBe('# Content');
    });
  });

  // ============================================================================
  // fetchGitHubFileWithMetadata TESTS
  // ============================================================================

  describe('fetchGitHubFileWithMetadata', () => {
    it('should fetch file content with metadata', async () => {
      const mockContent = '---\ntitle: Test\n---\n\n# Test Content';
      const mockResponse = createMockGitHubContent({
        content: mockContent,
        sha: 'abc123def456',
      });

      mockGet.mockResolvedValue(mockResponse);

      const result = await githubDocsApi.fetchGitHubFileWithMetadata('test-file.md');

      expect(result).toEqual({
        content: '# Test Content',
        sha: 'abc123def456',
        rawContent: mockContent,
      });
    });

    it('should handle file without frontmatter', async () => {
      const mockContent = '# Test Content\n\nNo frontmatter here.';
      const mockResponse = createMockGitHubContent({
        content: mockContent,
        sha: 'xyz789',
      });

      mockGet.mockResolvedValue(mockResponse);

      const result = await githubDocsApi.fetchGitHubFileWithMetadata('test-file.md');

      expect(result).toEqual({
        content: mockContent,
        sha: 'xyz789',
        rawContent: mockContent,
      });
    });

    it('should throw error when content is missing', async () => {
      const mockResponse = createMockGitHubContent({
        content: undefined,
      });

      mockGet.mockResolvedValue(mockResponse);

      await expect(githubDocsApi.fetchGitHubFileWithMetadata('test-file.md')).rejects.toThrow('Invalid file content');
    });
  });

  // ============================================================================
  // buildDocTree TESTS
  // ============================================================================

  describe('buildDocTree', () => {
    it('should build doc tree with files and directories', async () => {
      const mockDirectoryContents: any[] = [
        createMockGitHubContent({
          name: 'folder1',
          path: 'docs/coe/folder1',
          type: 'dir',
        }),
        createMockGitHubContent({
          name: 'file1.md',
          path: 'docs/coe/file1.md',
          type: 'file',
          html_url: 'https://github.com/org/repo/blob/main/docs/coe/file1.md',
        }),
        createMockGitHubContent({
          name: 'file2.txt',
          path: 'docs/coe/file2.txt',
          type: 'file',
        }),
      ];

      const mockSubdirectoryContents: any[] = [
        createMockGitHubContent({
          name: 'nested.md',
          path: 'docs/coe/folder1/nested.md',
          type: 'file',
          html_url: 'https://github.com/org/repo/blob/main/docs/coe/folder1/nested.md',
        }),
      ];

      mockGet
        .mockResolvedValueOnce(mockDirectoryContents)
        .mockResolvedValueOnce(mockSubdirectoryContents);

      const result = await githubDocsApi.buildDocTree();

      expect(result).toHaveLength(2); // Only .md files and directories
      expect(result[0].type).toBe('dir');
      expect(result[0].name).toBe('folder1');
      expect(result[0].children).toHaveLength(1);
      expect(result[1].type).toBe('file');
      expect(result[1].name).toBe('file1.md');
    });

    it('should sort directories first, then files alphabetically', async () => {
      const mockContents: any[] = [
        createMockGitHubContent({
          name: 'z-file.md',
          path: 'docs/coe/z-file.md',
          type: 'file',
        }),
        createMockGitHubContent({
          name: 'a-folder',
          path: 'docs/coe/a-folder',
          type: 'dir',
        }),
        createMockGitHubContent({
          name: 'b-file.md',
          path: 'docs/coe/b-file.md',
          type: 'file',
        }),
        createMockGitHubContent({
          name: 'z-folder',
          path: 'docs/coe/z-folder',
          type: 'dir',
        }),
      ];

      mockGet
        .mockResolvedValueOnce(mockContents)
        .mockResolvedValueOnce([]) // a-folder contents
        .mockResolvedValueOnce([]); // z-folder contents

      const result = await githubDocsApi.buildDocTree();

      expect(result.map(item => item.name)).toEqual([
        'a-folder',
        'z-folder',
        'b-file.md',
        'z-file.md',
      ]);
    });

    it('should handle legacy string path parameter', async () => {
      const mockContents: any[] = [
        createMockGitHubContent({
          name: 'test.md',
          path: 'docs/coe/subfolder/test.md',
          type: 'file',
        }),
      ];

      mockGet.mockResolvedValue(mockContents);

      const result = await githubDocsApi.buildDocTree('subfolder');

      expect(mockGet).toHaveBeenCalledWith(
        '/github/repos/cfs-platform-engineering/cfs-platform-docs/contents/docs/coe/subfolder',
        { params: { ref: 'main' } }
      );
      expect(result).toHaveLength(1);
    });

  });

  // ============================================================================
  // buildDocTreeLazy TESTS
  // ============================================================================

  describe('buildDocTreeLazy', () => {
    it('should build lazy doc tree without loading children', async () => {
      const mockContents: any[] = [
        createMockGitHubContent({
          name: 'folder1',
          path: 'docs/coe/folder1',
          type: 'dir',
        }),
        createMockGitHubContent({
          name: 'file1.md',
          path: 'docs/coe/file1.md',
          type: 'file',
          html_url: 'https://github.com/org/repo/blob/main/docs/coe/file1.md',
        }),
      ];

      mockGet.mockResolvedValue(mockContents);

      const result = await githubDocsApi.buildDocTreeLazy();

      expect(mockGet).toHaveBeenCalledTimes(1); // Only one call, no recursive loading
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('dir');
      expect(result[0].children).toBeUndefined(); // Children not loaded
      expect(result[1].type).toBe('file');
    });

    it('should handle custom config and path', async () => {
      const customConfig = {
        owner: 'test-org',
        repo: 'test-repo',
        branch: 'develop',
        docsPath: 'documentation',
      };

      const mockContents: any[] = [
        createMockGitHubContent({
          name: 'test.md',
          type: 'file',
        }),
      ];

      mockGet.mockResolvedValue(mockContents);

      const result = await githubDocsApi.buildDocTreeLazy(customConfig, 'subfolder');

      expect(mockGet).toHaveBeenCalledWith(
        '/github/repos/test-org/test-repo/contents/documentation/subfolder',
        { params: { ref: 'develop' } }
      );
      expect(result).toHaveLength(1);
    });
  });

  // ============================================================================
  // searchDocs TESTS
  // ============================================================================

  describe('searchDocs', () => {
    it('should search through doc files and return results', async () => {
      const mockFiles: any[] = [
        {
          name: 'file1.md',
          path: 'file1.md',
          type: 'file',
        },
        {
          name: 'file2.md',
          path: 'file2.md',
          type: 'file',
        },
      ];

      const mockContent1 = 'This is a test document with some important information about authentication.';
      const mockContent2 = 'This document covers deployment strategies and best practices.';

      mockGet
        .mockResolvedValueOnce({ content: mockContent1 })
        .mockResolvedValueOnce({ content: mockContent2 });

      const result = await githubDocsApi.searchDocs('authentication', mockFiles);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        path: 'file1.md',
        name: 'file1.md',
        excerpt: expect.stringContaining('authentication'),
      });
    });

    it('should search recursively through directories', async () => {
      const mockFiles: any[] = [
        {
          name: 'folder1',
          path: 'folder1',
          type: 'dir',
          children: [
            {
              name: 'nested.md',
              path: 'folder1/nested.md',
              type: 'file',
            },
          ],
        },
      ];

      const mockContent = 'This nested file contains security information.';
      mockGet.mockResolvedValue({ content: mockContent });

      const result = await githubDocsApi.searchDocs('security', mockFiles);

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('folder1/nested.md');
    });

    it('should handle search functionality', async () => {
      const mockFiles: any[] = [
        { name: 'file1.md', path: 'file1.md', type: 'file' },
        { name: 'file2.md', path: 'file2.md', type: 'file' },
      ];

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Test error handling
      mockGet
        .mockRejectedValueOnce(new Error('File not found'))
        .mockResolvedValueOnce({ content: 'This file contains the search term.' });

      const errorResult = await githubDocsApi.searchDocs('search term', mockFiles);
      expect(consoleSpy).toHaveBeenCalledWith('Error searching file file1.md:', expect.any(Error));
      expect(errorResult).toHaveLength(1);

      // Test case-insensitive search
      mockGet.mockResolvedValue({ content: 'This document contains AUTHENTICATION details.' });
      const caseResult = await githubDocsApi.searchDocs('authentication', [mockFiles[0]]);
      expect(caseResult).toHaveLength(1);
      expect(caseResult[0].excerpt).toContain('AUTHENTICATION');

      // Test no matches
      mockGet.mockResolvedValue({ content: 'This document does not contain the search term.' });
      const noMatchResult = await githubDocsApi.searchDocs('nonexistent', [mockFiles[0]]);
      expect(noMatchResult).toHaveLength(0);

      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // flattenDocTree TESTS
  // ============================================================================

  describe('flattenDocTree', () => {
    it('should flatten doc tree to list of files', () => {
      const mockTree: any[] = [
        {
          name: 'folder1',
          path: 'folder1',
          type: 'dir',
          children: [
            {
              name: 'nested.md',
              path: 'folder1/nested.md',
              type: 'file',
            },
            {
              name: 'subfolder',
              path: 'folder1/subfolder',
              type: 'dir',
              children: [
                {
                  name: 'deep.md',
                  path: 'folder1/subfolder/deep.md',
                  type: 'file',
                },
              ],
            },
          ],
        },
        {
          name: 'root.md',
          path: 'root.md',
          type: 'file',
        },
      ];

      const result = githubDocsApi.flattenDocTree(mockTree);

      expect(result).toHaveLength(3);
      expect(result).toEqual([
        { path: 'folder1/nested.md', name: 'nested.md' },
        { path: 'folder1/subfolder/deep.md', name: 'deep.md' },
        { path: 'root.md', name: 'root.md' },
      ]);
    });

    it('should handle empty tree', () => {
      const result = githubDocsApi.flattenDocTree([]);
      expect(result).toEqual([]);
    });

    it('should handle tree with only directories', () => {
      const mockTree: any[] = [
        {
          name: 'folder1',
          path: 'folder1',
          type: 'dir',
          children: [
            {
              name: 'subfolder',
              path: 'folder1/subfolder',
              type: 'dir',
              children: [],
            },
          ],
        },
      ];

      const result = githubDocsApi.flattenDocTree(mockTree);
      expect(result).toEqual([]);
    });

    it('should handle tree with only files', () => {
      const mockTree: any[] = [
        {
          name: 'file1.md',
          path: 'file1.md',
          type: 'file',
        },
        {
          name: 'file2.md',
          path: 'file2.md',
          type: 'file',
        },
      ];

      const result = githubDocsApi.flattenDocTree(mockTree);

      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { path: 'file1.md', name: 'file1.md' },
        { path: 'file2.md', name: 'file2.md' },
      ]);
    });

    it('should handle directories without children property', () => {
      const mockTree: any[] = [
        {
          name: 'folder1',
          path: 'folder1',
          type: 'dir',
          // children property is undefined (lazy loading)
        },
        {
          name: 'file1.md',
          path: 'file1.md',
          type: 'file',
        },
      ];

      const result = githubDocsApi.flattenDocTree(mockTree);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ path: 'file1.md', name: 'file1.md' });
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration Tests', () => {
    it('should work with buildDocTreeLazy and flattenDocTree together', async () => {
      const mockContents: any[] = [
        createMockGitHubContent({
          name: 'file1.md',
          path: 'docs/coe/file1.md',
          type: 'file',
        }),
        createMockGitHubContent({
          name: 'file2.md',
          path: 'docs/coe/file2.md',
          type: 'file',
        }),
      ];

      mockGet.mockResolvedValue(mockContents);

      const tree = await githubDocsApi.buildDocTreeLazy();
      const flattened = githubDocsApi.flattenDocTree(tree);

      expect(flattened).toHaveLength(2);
      expect(flattened.map(f => f.name)).toEqual(['file1.md', 'file2.md']);
    });

    it('should work with fetchGitHubFile and searchDocs together', async () => {
      const mockFiles: any[] = [
        {
          name: 'test.md',
          path: 'test.md',
          type: 'file',
        },
      ];

      const mockContent = '---\ntitle: Test\n---\n\nThis is test content with authentication info.';
      mockGet.mockResolvedValue({ content: mockContent });

      const results = await githubDocsApi.searchDocs('authentication', mockFiles);

      expect(results).toHaveLength(1);
      expect(results[0].excerpt).toContain('authentication');
      // Verify that frontmatter was removed during search
      expect(results[0].excerpt).not.toContain('title: Test');
    });
  });

  // ============================================================================
  // CREATE, UPDATE, DELETE OPERATIONS TESTS
  // ============================================================================

  describe('CRUD Operations', () => {
    let mockPost: any;
    let mockDelete: any;

    beforeEach(async () => {
      // Re-mock ApiClient with all HTTP methods
      mockPost = vi.fn();
      mockDelete = vi.fn();

      vi.doMock('../../src/services/ApiClient', () => ({
        ApiClient: vi.fn().mockImplementation(() => ({
          get: mockGet,
          post: mockPost,
          delete: mockDelete,
        })),
      }));

      // Re-import module with updated mock
      githubDocsApi = await import('../../src/services/githubDocsApi?update=' + Date.now());
    });

    describe('createGitHubFile', () => {
      it('should create a file at root level', async () => {
        const mockResponse = { commit: { sha: 'abc123' } };
        mockPost.mockResolvedValue(mockResponse);

        const filePath = 'test-doc.md';
        const content = '# Test Document';
        const commitMessage = 'Create test document';

        const result = await githubDocsApi.createGitHubFile(
          filePath,
          content,
          commitMessage
        );

        expect(mockPost).toHaveBeenCalledWith(
          `/github/repos/${githubDocsApi.DOCS_CONFIG.owner}/${githubDocsApi.DOCS_CONFIG.repo}/contents/${githubDocsApi.DOCS_CONFIG.docsPath}/${filePath}`,
          {
            message: commitMessage,
            content: content,
            branch: githubDocsApi.DOCS_CONFIG.branch,
          }
        );
        expect(result).toEqual(mockResponse);
      });

      it('should create a file in subdirectory', async () => {
        const mockResponse = { commit: { sha: 'def456' } };
        mockPost.mockResolvedValue(mockResponse);

        const filePath = 'guides/tutorial.md';
        const content = '# Tutorial';
        const commitMessage = 'Add tutorial';

        await githubDocsApi.createGitHubFile(filePath, content, commitMessage);

        expect(mockPost).toHaveBeenCalledWith(
          `/github/repos/${githubDocsApi.DOCS_CONFIG.owner}/${githubDocsApi.DOCS_CONFIG.repo}/contents/${githubDocsApi.DOCS_CONFIG.docsPath}/${filePath}`,
          {
            message: commitMessage,
            content: content,
            branch: githubDocsApi.DOCS_CONFIG.branch,
          }
        );
      });

      it('should use custom config when provided', async () => {
        const mockResponse = { commit: { sha: 'ghi789' } };
        mockPost.mockResolvedValue(mockResponse);

        const customConfig = {
          owner: 'custom-owner',
          repo: 'custom-repo',
          branch: 'develop',
          docsPath: 'documentation',
        };

        await githubDocsApi.createGitHubFile(
          'test.md',
          'content',
          'message',
          customConfig
        );

        expect(mockPost).toHaveBeenCalledWith(
          `/github/repos/${customConfig.owner}/${customConfig.repo}/contents/${customConfig.docsPath}/test.md`,
          {
            message: 'message',
            content: 'content',
            branch: customConfig.branch,
          }
        );
      });

      it('should handle API errors', async () => {
        const error = new Error('Failed to create file');
        mockPost.mockRejectedValue(error);

        await expect(
          githubDocsApi.createGitHubFile('test.md', 'content', 'message')
        ).rejects.toThrow('Failed to create file');
      });
    });

    describe('createGitHubFolder', () => {
      it('should create a folder by creating .gitkeep file', async () => {
        const mockResponse = { commit: { sha: 'folder123' } };
        mockPost.mockResolvedValue(mockResponse);

        const folderPath = 'new-folder';

        const result = await githubDocsApi.createGitHubFolder(folderPath);

        expect(mockPost).toHaveBeenCalledWith(
          `/github/repos/${githubDocsApi.DOCS_CONFIG.owner}/${githubDocsApi.DOCS_CONFIG.repo}/contents/${githubDocsApi.DOCS_CONFIG.docsPath}/${folderPath}/.gitkeep`,
          {
            message: `Create folder: ${folderPath}`,
            content: '\n',
            branch: githubDocsApi.DOCS_CONFIG.branch,
          }
        );
        expect(result).toEqual(mockResponse);
      });

      it('should create nested folder structure', async () => {
        const mockResponse = { commit: { sha: 'nested123' } };
        mockPost.mockResolvedValue(mockResponse);

        const folderPath = 'guides/tutorials/advanced';

        await githubDocsApi.createGitHubFolder(folderPath);

        expect(mockPost).toHaveBeenCalledWith(
          `/github/repos/${githubDocsApi.DOCS_CONFIG.owner}/${githubDocsApi.DOCS_CONFIG.repo}/contents/${githubDocsApi.DOCS_CONFIG.docsPath}/${folderPath}/.gitkeep`,
          {
            message: `Create folder: ${folderPath}`,
            content: '\n',
            branch: githubDocsApi.DOCS_CONFIG.branch,
          }
        );
      });

      it('should use custom config when provided', async () => {
        const mockResponse = { commit: { sha: 'custom123' } };
        mockPost.mockResolvedValue(mockResponse);

        const customConfig = {
          owner: 'custom-owner',
          repo: 'custom-repo',
          branch: 'develop',
          docsPath: 'documentation',
        };

        await githubDocsApi.createGitHubFolder('test-folder', customConfig);

        expect(mockPost).toHaveBeenCalledWith(
          `/github/repos/${customConfig.owner}/${customConfig.repo}/contents/${customConfig.docsPath}/test-folder/.gitkeep`,
          {
            message: 'Create folder: test-folder',
            content: '\n',
            branch: customConfig.branch,
          }
        );
      });

      it('should handle API errors', async () => {
        const error = new Error('Failed to create folder');
        mockPost.mockRejectedValue(error);

        await expect(
          githubDocsApi.createGitHubFolder('test-folder')
        ).rejects.toThrow('Failed to create folder');
      });
    });

    describe('deleteGitHubFile', () => {
      it('should delete a file with required SHA', async () => {
        const mockResponse = { commit: { sha: 'delete123' } };
        mockDelete.mockResolvedValue(mockResponse);

        const filePath = 'old-doc.md';
        const sha = 'file-sha-123';
        const commitMessage = 'Delete old document';

        const result = await githubDocsApi.deleteGitHubFile(
          filePath,
          sha,
          commitMessage
        );

        expect(mockDelete).toHaveBeenCalledWith(
          `/github/repos/${githubDocsApi.DOCS_CONFIG.owner}/${githubDocsApi.DOCS_CONFIG.repo}/contents/${githubDocsApi.DOCS_CONFIG.docsPath}/${filePath}`,
          {
            message: commitMessage,
            sha: sha,
            branch: githubDocsApi.DOCS_CONFIG.branch,
          }
        );
        expect(result).toEqual(mockResponse);
      });

      it('should delete a file in subdirectory', async () => {
        const mockResponse = { commit: { sha: 'delete456' } };
        mockDelete.mockResolvedValue(mockResponse);

        const filePath = 'guides/old-tutorial.md';
        const sha = 'file-sha-456';
        const commitMessage = 'Remove old tutorial';

        await githubDocsApi.deleteGitHubFile(filePath, sha, commitMessage);

        expect(mockDelete).toHaveBeenCalledWith(
          `/github/repos/${githubDocsApi.DOCS_CONFIG.owner}/${githubDocsApi.DOCS_CONFIG.repo}/contents/${githubDocsApi.DOCS_CONFIG.docsPath}/${filePath}`,
          {
            message: commitMessage,
            sha: sha,
            branch: githubDocsApi.DOCS_CONFIG.branch,
          }
        );
      });

      it('should use custom config when provided', async () => {
        const mockResponse = { commit: { sha: 'custom-delete' } };
        mockDelete.mockResolvedValue(mockResponse);

        const customConfig = {
          owner: 'custom-owner',
          repo: 'custom-repo',
          branch: 'develop',
          docsPath: 'documentation',
        };

        await githubDocsApi.deleteGitHubFile(
          'test.md',
          'sha123',
          'Delete test',
          customConfig
        );

        expect(mockDelete).toHaveBeenCalledWith(
          `/github/repos/${customConfig.owner}/${customConfig.repo}/contents/${customConfig.docsPath}/test.md`,
          {
            message: 'Delete test',
            sha: 'sha123',
            branch: customConfig.branch,
          }
        );
      });

      it('should handle file not found error (404)', async () => {
        const error = new Error('File not found');
        mockDelete.mockRejectedValue(error);

        await expect(
          githubDocsApi.deleteGitHubFile('nonexistent.md', 'sha123', 'Delete')
        ).rejects.toThrow('File not found');
      });

      it('should handle invalid SHA error', async () => {
        const error = new Error('Invalid SHA');
        mockDelete.mockRejectedValue(error);

        await expect(
          githubDocsApi.deleteGitHubFile('test.md', 'invalid-sha', 'Delete')
        ).rejects.toThrow('Invalid SHA');
      });
    });

    describe('deleteGitHubFolder', () => {
      it('should delete an empty folder', async () => {
        const mockResponse = { commit: { sha: 'folder-delete' } };
        mockDelete.mockResolvedValue(mockResponse);

        const folderPath = 'empty-folder';
        const commitMessage = 'Delete empty folder';

        const result = await githubDocsApi.deleteGitHubFolder(
          folderPath,
          commitMessage
        );

        expect(mockDelete).toHaveBeenCalledWith(
          `/github/repos/${githubDocsApi.DOCS_CONFIG.owner}/${githubDocsApi.DOCS_CONFIG.repo}/folders/${githubDocsApi.DOCS_CONFIG.docsPath}/${folderPath}`,
          {
            message: commitMessage,
            branch: githubDocsApi.DOCS_CONFIG.branch,
          }
        );
        expect(result).toEqual(mockResponse);
      });

      it('should delete nested empty folder', async () => {
        const mockResponse = { commit: { sha: 'nested-delete' } };
        mockDelete.mockResolvedValue(mockResponse);

        const folderPath = 'guides/old/empty';
        const commitMessage = 'Remove empty nested folder';

        await githubDocsApi.deleteGitHubFolder(folderPath, commitMessage);

        expect(mockDelete).toHaveBeenCalledWith(
          `/github/repos/${githubDocsApi.DOCS_CONFIG.owner}/${githubDocsApi.DOCS_CONFIG.repo}/folders/${githubDocsApi.DOCS_CONFIG.docsPath}/${folderPath}`,
          {
            message: commitMessage,
            branch: githubDocsApi.DOCS_CONFIG.branch,
          }
        );
      });

      it('should use custom config when provided', async () => {
        const mockResponse = { commit: { sha: 'custom-folder-delete' } };
        mockDelete.mockResolvedValue(mockResponse);

        const customConfig = {
          owner: 'custom-owner',
          repo: 'custom-repo',
          branch: 'develop',
          docsPath: 'documentation',
        };

        await githubDocsApi.deleteGitHubFolder(
          'test-folder',
          'Delete folder',
          customConfig
        );

        expect(mockDelete).toHaveBeenCalledWith(
          `/github/repos/${customConfig.owner}/${customConfig.repo}/folders/${customConfig.docsPath}/test-folder`,
          {
            message: 'Delete folder',
            branch: customConfig.branch,
          }
        );
      });

      it('should handle folder not found error (404)', async () => {
        const error = new Error('Folder not found');
        mockDelete.mockRejectedValue(error);

        await expect(
          githubDocsApi.deleteGitHubFolder('nonexistent-folder', 'Delete')
        ).rejects.toThrow('Folder not found');
      });

      it('should handle non-empty folder error (400)', async () => {
        const error = new Error('cannot delete non-empty directory: contains file.md');
        mockDelete.mockRejectedValue(error);

        await expect(
          githubDocsApi.deleteGitHubFolder('non-empty-folder', 'Delete')
        ).rejects.toThrow('cannot delete non-empty directory');
      });
    });

    describe('isFolderEmpty', () => {
      it('should return true for folder with only .gitkeep', async () => {
        const mockContents = [
          {
            name: '.gitkeep',
            type: 'file',
          },
        ];
        mockGet.mockResolvedValue(mockContents);

        const result = await githubDocsApi.isFolderEmpty('empty-folder');

        expect(result).toBe(true);
        expect(mockGet).toHaveBeenCalledWith(
          `/github/repos/${githubDocsApi.DOCS_CONFIG.owner}/${githubDocsApi.DOCS_CONFIG.repo}/contents/${githubDocsApi.DOCS_CONFIG.docsPath}/empty-folder`,
          { params: { ref: githubDocsApi.DOCS_CONFIG.branch } }
        );
      });

      it('should return false for folder with files', async () => {
        const mockContents = [
          {
            name: '.gitkeep',
            type: 'file',
          },
          {
            name: 'document.md',
            type: 'file',
          },
        ];
        mockGet.mockResolvedValue(mockContents);

        const result = await githubDocsApi.isFolderEmpty('non-empty-folder');

        expect(result).toBe(false);
      });

      it('should return false for folder with subdirectories', async () => {
        const mockContents = [
          {
            name: '.gitkeep',
            type: 'file',
          },
          {
            name: 'subfolder',
            type: 'dir',
          },
        ];
        mockGet.mockResolvedValue(mockContents);

        const result = await githubDocsApi.isFolderEmpty('folder-with-subdirs');

        expect(result).toBe(false);
      });

      it('should return false for folder without .gitkeep', async () => {
        const mockContents = [
          {
            name: 'document.md',
            type: 'file',
          },
        ];
        mockGet.mockResolvedValue(mockContents);

        const result = await githubDocsApi.isFolderEmpty('folder-no-gitkeep');

        expect(result).toBe(false);
      });

      it('should return false for empty array (no .gitkeep)', async () => {
        mockGet.mockResolvedValue([]);

        const result = await githubDocsApi.isFolderEmpty('truly-empty-folder');

        expect(result).toBe(false);
      });

      it('should use custom config when provided', async () => {
        const mockContents = [{ name: '.gitkeep', type: 'file' }];
        mockGet.mockResolvedValue(mockContents);

        const customConfig = {
          owner: 'custom-owner',
          repo: 'custom-repo',
          branch: 'develop',
          docsPath: 'documentation',
        };

        await githubDocsApi.isFolderEmpty('test-folder', customConfig);

        expect(mockGet).toHaveBeenCalledWith(
          `/github/repos/${customConfig.owner}/${customConfig.repo}/contents/${customConfig.docsPath}/test-folder`,
          { params: { ref: customConfig.branch } }
        );
      });

      it('should handle API errors gracefully', async () => {
        const error = new Error('Failed to fetch contents');
        mockGet.mockRejectedValue(error);

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await githubDocsApi.isFolderEmpty('error-folder');

        expect(result).toBe(false);
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
      });

      it('should handle folder not found error', async () => {
        const error = new Error('Folder not found');
        mockGet.mockRejectedValue(error);

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await githubDocsApi.isFolderEmpty('nonexistent-folder');

        expect(result).toBe(false);

        consoleSpy.mockRestore();
      });
    });

    describe('Integration scenarios', () => {
      it('should create and delete a file successfully', async () => {
        // Create file
        const createResponse = { commit: { sha: 'create123' }, content: { sha: 'file-sha' } };
        mockPost.mockResolvedValue(createResponse);

        await githubDocsApi.createGitHubFile('temp.md', 'content', 'Create temp');

        // Delete file
        const deleteResponse = { commit: { sha: 'delete123' } };
        mockDelete.mockResolvedValue(deleteResponse);

        await githubDocsApi.deleteGitHubFile('temp.md', 'file-sha', 'Delete temp');

        expect(mockPost).toHaveBeenCalledTimes(1);
        expect(mockDelete).toHaveBeenCalledTimes(1);
      });

      it('should create and delete a folder successfully', async () => {
        // Create folder
        const createResponse = { commit: { sha: 'folder-create' } };
        mockPost.mockResolvedValue(createResponse);

        await githubDocsApi.createGitHubFolder('temp-folder');

        // Verify folder is empty
        mockGet.mockResolvedValue([{ name: '.gitkeep', type: 'file' }]);
        const isEmpty = await githubDocsApi.isFolderEmpty('temp-folder');
        expect(isEmpty).toBe(true);

        // Delete folder
        const deleteResponse = { commit: { sha: 'folder-delete' } };
        mockDelete.mockResolvedValue(deleteResponse);

        await githubDocsApi.deleteGitHubFolder('temp-folder', 'Delete temp folder');

        expect(mockPost).toHaveBeenCalledTimes(1);
        expect(mockGet).toHaveBeenCalledTimes(1);
        expect(mockDelete).toHaveBeenCalledTimes(1);
      });
    });
  });

});
