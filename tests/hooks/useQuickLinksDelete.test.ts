import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useQuickLinksDelete } from "@/hooks/useQuickLinksDelete";
import * as useQuickLinkMutations from "@/hooks/api/mutations/useQuickLinkMutations";
import * as useToastHook from "@/hooks/use-toast";

// Mock the dependencies
vi.mock("@/hooks/api/mutations/useQuickLinkMutations");
vi.mock("@/hooks/use-toast");

describe("useQuickLinksDelete", () => {
  const mockToast = vi.fn();
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useToast
    vi.mocked(useToastHook.useToast).mockReturnValue({
      toast: mockToast,
    } as any);

    // Default mock for useDeleteQuickLink
    vi.mocked(useQuickLinkMutations.useDeleteQuickLink).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);
  });

  describe("Initial State", () => {
    it("should initialize with closed dialog", () => {
      const { result } = renderHook(() => useQuickLinksDelete("member-123"));

      expect(result.current.deleteDialogOpen).toBe(false);
      expect(result.current.linkToDelete).toBeNull();
      expect(result.current.isDeleting).toBe(false);
    });

    it("should work with null memberId", () => {
      const { result } = renderHook(() => useQuickLinksDelete(null));

      expect(result.current.deleteDialogOpen).toBe(false);
      expect(result.current.linkToDelete).toBeNull();
    });
  });

  describe("handleDeleteClick", () => {
    it("should open dialog and set link to delete", () => {
      const { result } = renderHook(() => useQuickLinksDelete("member-123"));

      act(() => {
        result.current.handleDeleteClick("https://example.com", "Example Link");
      });

      expect(result.current.deleteDialogOpen).toBe(true);
      expect(result.current.linkToDelete).toEqual({
        url: "https://example.com",
        title: "Example Link",
      });
    });

    it("should handle different URLs and titles", () => {
      const { result } = renderHook(() => useQuickLinksDelete("member-123"));

      act(() => {
        result.current.handleDeleteClick("https://github.com", "GitHub");
      });

      expect(result.current.linkToDelete).toEqual({
        url: "https://github.com",
        title: "GitHub",
      });
    });

    it("should handle empty title", () => {
      const { result } = renderHook(() => useQuickLinksDelete("member-123"));

      act(() => {
        result.current.handleDeleteClick("https://example.com", "");
      });

      expect(result.current.linkToDelete).toEqual({
        url: "https://example.com",
        title: "",
      });
    });
  });

  describe("handleDeleteConfirm", () => {
    it("should call mutation when link and memberId are present", () => {
      const { result } = renderHook(() => useQuickLinksDelete("member-123"));

      // First, open dialog with a link
      act(() => {
        result.current.handleDeleteClick("https://example.com", "Example Link");
      });

      // Then confirm deletion
      act(() => {
        result.current.handleDeleteConfirm();
      });

      expect(mockMutate).toHaveBeenCalledWith({
        memberId: "member-123",
        url: "https://example.com",
      });
    });

    it("should not call mutation when memberId is null", () => {
      const { result } = renderHook(() => useQuickLinksDelete(null));

      act(() => {
        result.current.handleDeleteClick("https://example.com", "Example Link");
      });

      act(() => {
        result.current.handleDeleteConfirm();
      });

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it("should not call mutation when linkToDelete is null", () => {
      const { result } = renderHook(() => useQuickLinksDelete("member-123"));

      // Don't set linkToDelete, just try to confirm
      act(() => {
        result.current.handleDeleteConfirm();
      });

      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  describe("handleDeleteCancel", () => {
    it("should close dialog and clear link", () => {
      const { result } = renderHook(() => useQuickLinksDelete("member-123"));

      // Open dialog
      act(() => {
        result.current.handleDeleteClick("https://example.com", "Example Link");
      });

      expect(result.current.deleteDialogOpen).toBe(true);
      expect(result.current.linkToDelete).not.toBeNull();

      // Cancel
      act(() => {
        result.current.handleDeleteCancel();
      });

      expect(result.current.deleteDialogOpen).toBe(false);
      expect(result.current.linkToDelete).toBeNull();
    });

    it("should work even if dialog is already closed", () => {
      const { result } = renderHook(() => useQuickLinksDelete("member-123"));

      act(() => {
        result.current.handleDeleteCancel();
      });

      expect(result.current.deleteDialogOpen).toBe(false);
      expect(result.current.linkToDelete).toBeNull();
    });
  });

  describe("Mutation Success", () => {
    it("should show success toast and close dialog on successful deletion", () => {
      let onSuccessCallback: (() => void) | undefined;

      vi.mocked(useQuickLinkMutations.useDeleteQuickLink).mockImplementation((options: any) => {
        onSuccessCallback = options?.onSuccess;
        return {
          mutate: mockMutate,
          isPending: false,
        } as any;
      });

      const { result } = renderHook(() => useQuickLinksDelete("member-123"));

      // Open dialog
      act(() => {
        result.current.handleDeleteClick("https://example.com", "Example Link");
      });

      // Trigger success callback
      act(() => {
        onSuccessCallback?.();
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Quick link removed",
        description: "The quick link has been successfully removed.",
      });

      expect(result.current.deleteDialogOpen).toBe(false);
      expect(result.current.linkToDelete).toBeNull();
    });
  });

  describe("Mutation Error", () => {
    it("should show error toast and close dialog on deletion error", () => {
      let onErrorCallback: ((error: any) => void) | undefined;

      vi.mocked(useQuickLinkMutations.useDeleteQuickLink).mockImplementation((options: any) => {
        onErrorCallback = options?.onError;
        return {
          mutate: mockMutate,
          isPending: false,
        } as any;
      });

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useQuickLinksDelete("member-123"));

      // Open dialog
      act(() => {
        result.current.handleDeleteClick("https://example.com", "Example Link");
      });

      const mockError = new Error("Failed to delete");

      // Trigger error callback
      act(() => {
        onErrorCallback?.(mockError);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to delete quick link:", mockError);

      expect(mockToast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "Failed to remove quick link",
        description: "Failed to delete",
      });

      expect(result.current.deleteDialogOpen).toBe(false);
      expect(result.current.linkToDelete).toBeNull();

      consoleErrorSpy.mockRestore();
    });

    it("should show generic error message when error has no message", () => {
      let onErrorCallback: ((error: any) => void) | undefined;

      vi.mocked(useQuickLinkMutations.useDeleteQuickLink).mockImplementation((options: any) => {
        onErrorCallback = options?.onError;
        return {
          mutate: mockMutate,
          isPending: false,
        } as any;
      });

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useQuickLinksDelete("member-123"));

      act(() => {
        result.current.handleDeleteClick("https://example.com", "Example Link");
      });

      // Error without message
      const mockError = {};

      act(() => {
        onErrorCallback?.(mockError);
      });

      expect(mockToast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "Failed to remove quick link",
        description: "There was an error removing the quick link. Please try again.",
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("isDeleting State", () => {
    it("should reflect isPending from mutation", () => {
      vi.mocked(useQuickLinkMutations.useDeleteQuickLink).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as any);

      const { result } = renderHook(() => useQuickLinksDelete("member-123"));

      expect(result.current.isDeleting).toBe(false);
    });

    it("should be true when mutation is pending", () => {
      vi.mocked(useQuickLinkMutations.useDeleteQuickLink).mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      } as any);

      const { result } = renderHook(() => useQuickLinksDelete("member-123"));

      expect(result.current.isDeleting).toBe(true);
    });
  });

  describe("setDeleteDialogOpen", () => {
    it("should allow manual control of dialog state", () => {
      const { result } = renderHook(() => useQuickLinksDelete("member-123"));

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

  describe("Full Workflow", () => {
    it("should handle complete delete workflow with success", () => {
      let onSuccessCallback: (() => void) | undefined;

      vi.mocked(useQuickLinkMutations.useDeleteQuickLink).mockImplementation((options: any) => {
        onSuccessCallback = options?.onSuccess;
        return {
          mutate: mockMutate,
          isPending: false,
        } as any;
      });

      const { result } = renderHook(() => useQuickLinksDelete("member-123"));

      // 1. Initial state
      expect(result.current.deleteDialogOpen).toBe(false);
      expect(result.current.linkToDelete).toBeNull();

      // 2. User clicks delete
      act(() => {
        result.current.handleDeleteClick("https://github.com", "GitHub");
      });

      expect(result.current.deleteDialogOpen).toBe(true);
      expect(result.current.linkToDelete).toEqual({
        url: "https://github.com",
        title: "GitHub",
      });

      // 3. User confirms
      act(() => {
        result.current.handleDeleteConfirm();
      });

      expect(mockMutate).toHaveBeenCalledWith({
        memberId: "member-123",
        url: "https://github.com",
      });

      // 4. Mutation succeeds
      act(() => {
        onSuccessCallback?.();
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Quick link removed",
        description: "The quick link has been successfully removed.",
      });

      expect(result.current.deleteDialogOpen).toBe(false);
      expect(result.current.linkToDelete).toBeNull();
    });

    it("should handle complete delete workflow with cancellation", () => {
      const { result } = renderHook(() => useQuickLinksDelete("member-123"));

      // 1. User clicks delete
      act(() => {
        result.current.handleDeleteClick("https://github.com", "GitHub");
      });

      expect(result.current.deleteDialogOpen).toBe(true);

      // 2. User cancels
      act(() => {
        result.current.handleDeleteCancel();
      });

      expect(result.current.deleteDialogOpen).toBe(false);
      expect(result.current.linkToDelete).toBeNull();
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it("should handle complete delete workflow with error", () => {
      let onErrorCallback: ((error: any) => void) | undefined;

      vi.mocked(useQuickLinkMutations.useDeleteQuickLink).mockImplementation((options: any) => {
        onErrorCallback = options?.onError;
        return {
          mutate: mockMutate,
          isPending: false,
        } as any;
      });

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useQuickLinksDelete("member-123"));

      // 1. User clicks delete
      act(() => {
        result.current.handleDeleteClick("https://github.com", "GitHub");
      });

      // 2. User confirms
      act(() => {
        result.current.handleDeleteConfirm();
      });

      // 3. Mutation fails
      act(() => {
        onErrorCallback?.(new Error("Network error"));
      });

      expect(mockToast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "Failed to remove quick link",
        description: "Network error",
      });

      expect(result.current.deleteDialogOpen).toBe(false);
      expect(result.current.linkToDelete).toBeNull();

      consoleErrorSpy.mockRestore();
    });
  });
});