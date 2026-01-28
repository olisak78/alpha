import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  useDocTree,
  useDocTreeLazy,
  useDocDirectory,
  useDocFile,
  useDocFileWithMetadata,
} from '../../../src/hooks/api/useDocs';
import {
  buildDocTree,
  buildDocTreeLazy,
  fetchGitHubFile,
  fetchGitHubFileWithMetadata,
} from '../../../src/services/githubDocsApi';
import { createWrapper, testSetup } from './test-utils';

// Mock the githubDocsApi service
vi.mock('../../../src/services/githubDocsApi', () => ({
  buildDocTree: vi.fn(),
  buildDocTreeLazy: vi.fn(),
  fetchGitHubFile: vi.fn(),
  fetchGitHubFileWithMetadata: vi.fn(),
}));

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

const createMockDocTreeNode = (overrides?: any) => ({
  name: 'test-doc.md',
  path: 'docs/test-doc.md',
  type: 'file' as const,
  size: 1024,
  sha: 'abc123',
  url: 'https://api.github.com/repos/test/repo/contents/docs/test-doc.md',
  ...overrides,
});

const createMockDocTree = (overrides?: any[]) => [
  createMockDocTreeNode(),
  createMockDocTreeNode({
    name: 'getting-started',
    path: 'docs/getting-started',
    type: 'dir' as const,
    children: [
      createMockDocTreeNode({
        name: 'installation.md',
        path: 'docs/getting-started/installation.md',
      }),
    ],
  }),
  createMockDocTreeNode({
    name: 'api-reference.md',
    path: 'docs/api-reference.md',
  }),
  ...(overrides || []),
];

const createMockDocsConfig = (overrides?: any) => ({
  owner: 'test-owner',
  repo: 'test-repo',
  branch: 'main',
  docsPath: 'docs',
  provider: 'github',
  ...overrides,
});

const createMockFileContent = () => `# Test Documentation

This is a test markdown file.

## Getting Started

Follow these steps to get started.
`;

const createMockFileWithMetadata = (overrides?: any) => ({
  content: createMockFileContent(),
  sha: 'abc123def456',
  rawContent: 'raw content here',
  ...overrides,
});

// ============================================================================
// useDocTree TESTS
// ============================================================================

describe('useDocTree', () => {
  beforeEach(testSetup.beforeEach);
  afterEach(testSetup.afterEach);

  it('should fetch doc tree successfully', async () => {
    const mockTree = createMockDocTree();
    vi.mocked(buildDocTree).mockResolvedValue(mockTree);

    const { result } = renderHook(() => useDocTree(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockTree);
    expect(buildDocTree).toHaveBeenCalledWith(undefined);
  });
});

// ============================================================================
// useDocTreeLazy TESTS
// ============================================================================

describe('useDocTreeLazy', () => {
  beforeEach(testSetup.beforeEach);
  afterEach(testSetup.afterEach);

  it('should fetch lazy doc tree successfully', async () => {
    const mockTree = createMockDocTree();
    vi.mocked(buildDocTreeLazy).mockResolvedValue(mockTree);

    const { result } = renderHook(() => useDocTreeLazy(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockTree);
    expect(buildDocTreeLazy).toHaveBeenCalledWith(undefined);
  });
});

// ============================================================================
// useDocDirectory TESTS
// ============================================================================

describe('useDocDirectory', () => {
  beforeEach(testSetup.beforeEach);
  afterEach(testSetup.afterEach);

  it('should fetch directory contents successfully', async () => {
    const path = 'docs/getting-started';
    const mockTree = createMockDocTree();
    vi.mocked(buildDocTreeLazy).mockResolvedValue(mockTree);

    const { result } = renderHook(() => useDocDirectory(path), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockTree);
    expect(buildDocTreeLazy).toHaveBeenCalledWith(undefined, path);
  });

  it('should not fetch when path is null', async () => {
    const { result } = renderHook(() => useDocDirectory(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(buildDocTreeLazy).not.toHaveBeenCalled();
  });
});

// ============================================================================
// useDocFile TESTS
// ============================================================================

describe('useDocFile', () => {
  beforeEach(testSetup.beforeEach);
  afterEach(testSetup.afterEach);

  it('should fetch file content successfully', async () => {
    const path = 'docs/test-doc.md';
    const mockContent = createMockFileContent();
    vi.mocked(fetchGitHubFile).mockResolvedValue(mockContent);

    const { result } = renderHook(() => useDocFile(path), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockContent);
    expect(fetchGitHubFile).toHaveBeenCalledWith(path, undefined);
  });

  it('should not fetch when path is null', async () => {
    const { result } = renderHook(() => useDocFile(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchGitHubFile).not.toHaveBeenCalled();
  });
});

// ============================================================================
// useDocFileWithMetadata TESTS
// ============================================================================

describe('useDocFileWithMetadata', () => {
  beforeEach(testSetup.beforeEach);
  afterEach(testSetup.afterEach);

  it('should fetch file with metadata successfully', async () => {
    const path = 'docs/test-doc.md';
    const mockFileData = createMockFileWithMetadata();
    vi.mocked(fetchGitHubFileWithMetadata).mockResolvedValue(mockFileData);

    const { result } = renderHook(() => useDocFileWithMetadata(path), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockFileData);
    expect(result.current.data?.content).toBe(mockFileData.content);
    expect(result.current.data?.sha).toBe(mockFileData.sha);
    expect(result.current.data?.rawContent).toBe(mockFileData.rawContent);
    expect(fetchGitHubFileWithMetadata).toHaveBeenCalledWith(path, undefined);
  });

  it('should not fetch when path is null', async () => {
    const { result } = renderHook(() => useDocFileWithMetadata(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchGitHubFileWithMetadata).not.toHaveBeenCalled();
  });
});
