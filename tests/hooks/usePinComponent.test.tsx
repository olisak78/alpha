import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { usePinComponent } from '@/hooks/usePinComponent';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { Component } from '@/types/api';

// Mock dependencies
vi.mock('@/contexts/AuthContext');
vi.mock('@/hooks/use-toast');

// Create mock mutation functions that we can control
const mockAddPinnedMutate = vi.fn();
const mockRemovePinnedMutate = vi.fn();

vi.mock('@/hooks/api/mutations/useFavoriteMutations', () => ({
  useAddPinnedComponent: () => ({
    mutate: mockAddPinnedMutate,
    isPending: false,
  }),
  useRemovePinnedComponent: () => ({
    mutate: mockRemovePinnedMutate,
    isPending: false,
  }),
}));

const mockUser = { id: 'user-123', name: 'Test User' };
const mockToast = vi.mocked(toast);
const mockUseAuth = vi.mocked(useAuth);

describe('usePinComponent', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    mockUseAuth.mockReturnValue({ user: mockUser } as any);
    vi.clearAllMocks();
    mockAddPinnedMutate.mockClear();
    mockRemovePinnedMutate.mockClear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should handle optimistic updates for both object and array query data structures', () => {
    const { result } = renderHook(() => usePinComponent(), { wrapper });

    // Test object-based query data structure
    const mockComponent1: Component = {
      id: 'comp-123',
      name: 'Test Component',
      title: 'Test Component Title',
      isPinned: false,
    } as Component;

    queryClient.setQueryData(['components', 'by-team', 'team-123'], {
      components: [mockComponent1],
    });

    act(() => {
      result.current.togglePin(mockComponent1);
    });

    let updatedData = queryClient.getQueryData(['components', 'by-team', 'team-123']) as any;
    expect(updatedData.components[0].isPinned).toBe(true);

    // Test array-based query data structure with separate component
    const mockComponent2: Component = {
      id: 'comp-456',
      name: 'Another Component',
      title: 'Another Component Title',
      isPinned: false,
    } as Component;

    queryClient.setQueryData(['components', 'by-organization', 'org-123'], [mockComponent2]);

    act(() => {
      result.current.togglePin(mockComponent2);
    });

    const arrayData = queryClient.getQueryData(['components', 'by-organization', 'org-123']) as Component[];
    expect(arrayData[0].isPinned).toBe(true); // Should be pinned
  });

  it('should handle successful pin/unpin operations with proper toast messages', () => {
    const { result } = renderHook(() => usePinComponent(), { wrapper });

    // Test pinning with title
    const mockComponentWithTitle: Component = {
      id: 'comp-123',
      name: 'Test Component',
      title: 'Test Component Title',
      isPinned: false,
    } as Component;

    act(() => {
      result.current.togglePin(mockComponentWithTitle);
    });

    expect(mockAddPinnedMutate).toHaveBeenCalledWith(
      { userId: 'user-123', componentId: 'comp-123' },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    );

    // Simulate successful pin
    const pinMutationCall = mockAddPinnedMutate.mock.calls[0];
    act(() => {
      pinMutationCall[1].onSuccess();
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: "Component pinned",
      description: "Test Component Title has been pinned",
    });

    // Test unpinning with name fallback
    const mockComponentWithoutTitle: Component = {
      id: 'comp-456',
      name: 'Another Component',
      isPinned: true,
    } as Component;

    act(() => {
      result.current.togglePin(mockComponentWithoutTitle);
    });

    expect(mockRemovePinnedMutate).toHaveBeenCalledWith(
      { userId: 'user-123', componentId: 'comp-456' },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    );

    // Simulate successful unpin
    const unpinMutationCall = mockRemovePinnedMutate.mock.calls[0];
    act(() => {
      unpinMutationCall[1].onSuccess();
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: "Component unpinned",
      description: "Another Component has been unpinned",
    });
  });

  it('should handle error scenarios with optimistic update reversion', () => {
    const { result } = renderHook(() => usePinComponent(), { wrapper });

    const mockComponent: Component = {
      id: 'comp-123',
      name: 'Test Component',
      title: 'Test Component Title',
      isPinned: false,
    } as Component;

    // Set up initial query data
    queryClient.setQueryData(['components', 'by-team', 'team-123'], {
      components: [mockComponent],
    });

    // Test pin error
    act(() => {
      result.current.togglePin(mockComponent);
    });

    // Verify optimistic update occurred
    let updatedData = queryClient.getQueryData(['components', 'by-team', 'team-123']) as any;
    expect(updatedData.components[0].isPinned).toBe(true);

    // Simulate pin error
    const pinMutationCall = mockAddPinnedMutate.mock.calls[0];
    act(() => {
      pinMutationCall[1].onError();
    });

    // Verify optimistic update was reverted and error toast shown
    updatedData = queryClient.getQueryData(['components', 'by-team', 'team-123']) as any;
    expect(updatedData.components[0].isPinned).toBe(false);
    expect(mockToast).toHaveBeenCalledWith({
      title: "Error",
      description: "Failed to pin component",
      variant: "destructive",
    });

    // Test unpin error
    const pinnedComponent = { ...mockComponent, isPinned: true };
    queryClient.setQueryData(['components', 'by-team', 'team-123'], {
      components: [pinnedComponent],
    });

    act(() => {
      result.current.togglePin(pinnedComponent);
    });

    // Verify optimistic update occurred
    updatedData = queryClient.getQueryData(['components', 'by-team', 'team-123']) as any;
    expect(updatedData.components[0].isPinned).toBe(false);

    // Simulate unpin error
    const unpinMutationCall = mockRemovePinnedMutate.mock.calls[0];
    act(() => {
      unpinMutationCall[1].onError();
    });

    // Verify optimistic update was reverted and error toast shown
    updatedData = queryClient.getQueryData(['components', 'by-team', 'team-123']) as any;
    expect(updatedData.components[0].isPinned).toBe(true);
    expect(mockToast).toHaveBeenCalledWith({
      title: "Error",
      description: "Failed to unpin component",
      variant: "destructive",
    });
  });
});
