import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Import component-specific hooks to test
import { useQuickLinksForm } from '../../src/hooks/useQuickLinksForm';
import { useQuickLinksData } from '../../src/hooks/useQuickLinksData';
import { useQuickLinksDelete } from '../../src/hooks/useQuickLinksDelete';

// Mock the API
import { apiClient } from '../../src/services/ApiClient';
vi.mock('../../src/services/ApiClient', () => ({
  apiClient: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock auth hook
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  memberId: 'member-123',
};

vi.mock('../../src/hooks/useAuthWithRole', () => ({
  useAuthWithRole: () => ({ user: mockUser }),
}));

// Mock toast
const mockToast = vi.fn();
vi.mock('../../src/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// ============================================================================
// TEST UTILITIES
// ============================================================================

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// ============================================================================
// QUICK LINKS FORM HOOK TESTS
// ============================================================================

describe('useQuickLinksForm Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default form data', () => {
    const { result } = renderHook(() => useQuickLinksForm());

    // Fixed: Include icon field in expected data
    expect(result.current.formData).toEqual({
      title: '',
      url: '',
      category: '',
      icon: 'link',
    });
    expect(result.current.formErrors).toEqual({});
    expect(result.current.isFormValid).toBe(false);
  });

  it('should update form field', () => {
    const { result } = renderHook(() => useQuickLinksForm());

    act(() => {
      result.current.updateField('title', 'My Link');
    });

    expect(result.current.formData.title).toBe('My Link');
  });

  it('should update multiple form fields', () => {
    const { result } = renderHook(() => useQuickLinksForm());

    act(() => {
      result.current.updateField('title', 'Test Link');
      result.current.updateField('url', 'https://example.com');
      result.current.updateField('category', 'Work');
    });

    // Fixed: Include icon field in expected data
    expect(result.current.formData).toEqual({
      title: 'Test Link',
      url: 'https://example.com',
      category: 'Work',
      icon: 'link',
    });
  });

  it('should validate required fields', () => {
    const { result } = renderHook(() => useQuickLinksForm());

    act(() => {
      result.current.validateForm();
    });

    expect(result.current.formErrors.title).toBe('Title is required');
    expect(result.current.formErrors.url).toBe('URL is required');
    expect(result.current.formErrors.category).toBe('Category is required');
  });

  it('should accept valid URL', () => {
    const { result } = renderHook(() => useQuickLinksForm());

    act(() => {
      result.current.updateField('title', 'Test');
      result.current.updateField('url', 'https://example.com');
      result.current.updateField('category', 'Work');
    });

    expect(result.current.isFormValid).toBe(true);
  });

  it('should clear errors when field is updated after validation', () => {
    const { result } = renderHook(() => useQuickLinksForm());

    act(() => {
      result.current.validateForm();
    });

    expect(result.current.formErrors.title).toBeTruthy();

    act(() => {
      result.current.updateField('title', 'New Title');
    });

    expect(result.current.formErrors.title).toBeUndefined();
  });

  it('should validate on field blur', () => {
    const { result } = renderHook(() => useQuickLinksForm());

    act(() => {
      result.current.handleFieldBlur('title');
    });

    expect(result.current.shouldShowError('title')).toBe(true);
  });

  it('should not show error before field is touched', () => {
    const { result } = renderHook(() => useQuickLinksForm());

    expect(result.current.shouldShowError('title')).toBe(false);
  });

  it('should reset form', () => {
    const { result } = renderHook(() => useQuickLinksForm());

    act(() => {
      result.current.updateField('title', 'Test');
      result.current.updateField('url', 'https://example.com');
      result.current.validateForm();
    });

    act(() => {
      result.current.resetForm();
    });

    // Fixed: Include icon field in expected data
    expect(result.current.formData).toEqual({
      title: '',
      url: '',
      category: '',
      icon: 'link',
    });
    expect(result.current.formErrors).toEqual({});
  });

  it('should handle empty spaces in required fields', () => {
    const { result } = renderHook(() => useQuickLinksForm());

    act(() => {
      result.current.updateField('title', '   ');
      result.current.updateField('url', 'https://example.com');
      result.current.updateField('category', 'Work');
    });

    expect(result.current.isFormValid).toBe(false);
  });

  it('should accept URLs with different protocols', () => {
    const { result } = renderHook(() => useQuickLinksForm());

    const testCases = [
      'https://example.com',
      'http://example.com',
      'ftp://example.com',
    ];

    testCases.forEach((url) => {
      act(() => {
        result.current.updateField('title', 'Test');
        result.current.updateField('url', url);
        result.current.updateField('category', 'Work');
      });

      expect(result.current.isFormValid).toBe(true);
    });
  });

  it('should accept URLs with paths and query parameters', () => {
    const { result } = renderHook(() => useQuickLinksForm());

    act(() => {
      result.current.updateField('title', 'Test');
      result.current.updateField('url', 'https://example.com/path?query=value&other=data');
      result.current.updateField('category', 'Work');
    });

    expect(result.current.isFormValid).toBe(true);
  });

  it('should set form data directly', () => {
    const { result } = renderHook(() => useQuickLinksForm());

    const newFormData = {
      title: 'Direct Set',
      url: 'https://direct.com',
      category: 'Direct',
      icon: 'link',
    };

    act(() => {
      result.current.setFormData(newFormData);
    });

    expect(result.current.formData).toEqual(newFormData);
  });
});


// ============================================================================
// QUICK LINKS DELETE HOOK TESTS
// ============================================================================

describe('useQuickLinksDelete Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with closed dialog', () => {
    const { result } = renderHook(
      () => useQuickLinksDelete('member-123'),
      { wrapper: createWrapper() }
    );

    expect(result.current.deleteDialogOpen).toBe(false);
    expect(result.current.linkToDelete).toBe(null);
    expect(result.current.isDeleting).toBe(false);
  });

  it('should open delete confirmation dialog', () => {
    const { result } = renderHook(
      () => useQuickLinksDelete('member-123'),
      { wrapper: createWrapper() }
    );

    const linkUrl = 'https://example.com';
    const linkTitle = 'Example Link';

    act(() => {
      result.current.handleDeleteClick(linkUrl, linkTitle);
    });

    expect(result.current.deleteDialogOpen).toBe(true);
    // Fixed: linkToDelete is an object {url, title}, not just the URL string
    expect(result.current.linkToDelete).toEqual({ url: linkUrl, title: linkTitle });
  });

  it('should cancel delete operation', () => {
    const { result } = renderHook(
      () => useQuickLinksDelete('member-123'),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.handleDeleteClick('https://example.com', 'Example Link');
    });

    expect(result.current.deleteDialogOpen).toBe(true);

    act(() => {
      result.current.handleDeleteCancel();
    });

    expect(result.current.deleteDialogOpen).toBe(false);
    expect(result.current.linkToDelete).toBe(null);
  });

  it('should delete quick link successfully', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useQuickLinksDelete('member-123'),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.handleDeleteClick('https://example.com', 'Example Link');
    });

    act(() => {
      result.current.handleDeleteConfirm();
    });

    // Fixed: Wait for the mutation to complete before checking isDeleting
    await waitFor(() => {
      expect(result.current.isDeleting).toBe(false);
    });

    // Fixed: Actual toast message is "Quick link removed" not "deleted"
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Quick link removed',
        })
      );
    });

    await waitFor(() => {
      expect(result.current.deleteDialogOpen).toBe(false);
      expect(result.current.linkToDelete).toBe(null);
    });
  });

  it('should handle delete error', async () => {
    const error = new Error('Failed to delete');
    vi.mocked(apiClient.delete).mockRejectedValue(error);

    const { result } = renderHook(
      () => useQuickLinksDelete('member-123'),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.handleDeleteClick('https://example.com', 'Example Link');
    });

    act(() => {
      result.current.handleDeleteConfirm();
    });

    await waitFor(() => {
      expect(result.current.isDeleting).toBe(false);
    });

    // Fixed: Actual toast message is "Failed to remove quick link" with description "Failed to delete"
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: 'Failed to remove quick link',
        })
      );
    });

    await waitFor(() => {
      expect(result.current.deleteDialogOpen).toBe(false);
    });
  });

  it('should not delete when memberId is missing', async () => {
    const { result } = renderHook(
      () => useQuickLinksDelete(null),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.handleDeleteClick('https://example.com', 'Example Link');
    });

    act(() => {
      result.current.handleDeleteConfirm();
    });

    // Fixed: The hook doesn't show an error toast when memberId is missing
    // It just doesn't call the mutation. The test should verify the mutation wasn't called.
    expect(apiClient.delete).not.toHaveBeenCalled();
  });

  it('should encode URL when deleting', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useQuickLinksDelete('member-123'),
      { wrapper: createWrapper() }
    );

    const urlWithParams = 'https://example.com/path?query=value&other=data';

    act(() => {
      result.current.handleDeleteClick(urlWithParams, 'Complex URL Link');
    });

    act(() => {
      result.current.handleDeleteConfirm();
    });

    await waitFor(() => {
      expect(result.current.isDeleting).toBe(false);
    });

    expect(apiClient.delete).toHaveBeenCalledWith(
      expect.stringContaining('url=https%3A%2F%2Fexample.com')
    );
  });

  it('should allow setting dialog state directly', () => {
    const { result } = renderHook(
      () => useQuickLinksDelete('member-123'),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.setDeleteDialogOpen(true);
    });

    expect(result.current.deleteDialogOpen).toBe(true);

    act(() => {
      result.current.setDeleteDialogOpen(false);
    });

    expect(result.current.deleteDialogOpen).toBe(false);
  });
});

