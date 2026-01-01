import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useProjectsSync } from "@/hooks/useProjectSync";
import * as useProjectsApi from "@/hooks/api/useProjects";
import * as projectsStore from "@/stores/projectsStore";

// Mock the dependencies
vi.mock("@/hooks/api/useProjects");
vi.mock("@/stores/projectsStore");

describe("useProjectsSync", () => {
  const mockSetProjects = vi.fn();
  const mockSetIsLoading = vi.fn();
  const mockSetError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the store actions
    vi.mocked(projectsStore.useProjectsActions).mockReturnValue({
      setProjects: mockSetProjects,
      setIsLoading: mockSetIsLoading,
      setError: mockSetError,
    });
  });

  describe("Loading State", () => {
    it("should call setIsLoading(true) when data is loading", () => {
      vi.mocked(useProjectsApi.useFetchProjects).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      renderHook(() => useProjectsSync());

      expect(mockSetIsLoading).toHaveBeenCalledWith(true);
      expect(mockSetProjects).not.toHaveBeenCalled();
      expect(mockSetError).not.toHaveBeenCalled();
    });

    it("should not call setProjects when loading", () => {
      vi.mocked(useProjectsApi.useFetchProjects).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      renderHook(() => useProjectsSync());

      expect(mockSetProjects).not.toHaveBeenCalled();
    });
  });

  describe("Success State", () => {
    it("should call setProjects with data when fetch succeeds", () => {
      const mockProjects = [
        { id: "1", name: "Project 1" },
        { id: "2", name: "Project 2" },
      ];

      vi.mocked(useProjectsApi.useFetchProjects).mockReturnValue({
        data: mockProjects,
        isLoading: false,
        error: null,
      } as any);

      renderHook(() => useProjectsSync());

      expect(mockSetProjects).toHaveBeenCalledWith(mockProjects);
      expect(mockSetIsLoading).not.toHaveBeenCalled();
      expect(mockSetError).not.toHaveBeenCalled();
    });

    it("should call setProjects with empty array when data is empty", () => {
      vi.mocked(useProjectsApi.useFetchProjects).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      renderHook(() => useProjectsSync());

      expect(mockSetProjects).toHaveBeenCalledWith([]);
    });

    it("should not call setProjects when loading is true even if data exists", () => {
      const mockProjects = [{ id: "1", name: "Project 1" }];

      vi.mocked(useProjectsApi.useFetchProjects).mockReturnValue({
        data: mockProjects,
        isLoading: true,
        error: null,
      } as any);

      renderHook(() => useProjectsSync());

      expect(mockSetProjects).not.toHaveBeenCalled();
      expect(mockSetIsLoading).toHaveBeenCalledWith(true);
    });
  });

  describe("Error State", () => {
    it("should call setError when fetch fails", () => {
      const mockError = new Error("Failed to fetch projects");

      vi.mocked(useProjectsApi.useFetchProjects).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      } as any);

      renderHook(() => useProjectsSync());

      expect(mockSetError).toHaveBeenCalledWith(mockError);
      expect(mockSetProjects).not.toHaveBeenCalled();
      expect(mockSetIsLoading).not.toHaveBeenCalled();
    });

    it("should prioritize error over data", () => {
      const mockError = new Error("Failed to fetch projects");
      const mockProjects = [{ id: "1", name: "Project 1" }];

      vi.mocked(useProjectsApi.useFetchProjects).mockReturnValue({
        data: mockProjects,
        isLoading: false,
        error: mockError,
      } as any);

      renderHook(() => useProjectsSync());

      expect(mockSetError).toHaveBeenCalledWith(mockError);
      expect(mockSetProjects).not.toHaveBeenCalled();
    });

    it("should prioritize error over loading state", () => {
      const mockError = new Error("Failed to fetch projects");

      vi.mocked(useProjectsApi.useFetchProjects).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: mockError,
      } as any);

      renderHook(() => useProjectsSync());

      expect(mockSetError).toHaveBeenCalledWith(mockError);
      expect(mockSetIsLoading).not.toHaveBeenCalled();
    });
  });

  describe("State Transitions", () => {
    it("should sync when transitioning from loading to success", () => {
      const mockProjects = [{ id: "1", name: "Project 1" }];

      // Start with loading
      const { rerender } = renderHook(() => useProjectsSync());

      vi.mocked(useProjectsApi.useFetchProjects).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      rerender();

      expect(mockSetIsLoading).toHaveBeenCalledWith(true);

      // Transition to success
      vi.mocked(useProjectsApi.useFetchProjects).mockReturnValue({
        data: mockProjects,
        isLoading: false,
        error: null,
      } as any);

      rerender();

      expect(mockSetProjects).toHaveBeenCalledWith(mockProjects);
    });

    it("should sync when transitioning from loading to error", () => {
      const mockError = new Error("Failed to fetch projects");

      // Start with loading
      const { rerender } = renderHook(() => useProjectsSync());

      vi.mocked(useProjectsApi.useFetchProjects).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      rerender();

      expect(mockSetIsLoading).toHaveBeenCalledWith(true);

      // Transition to error
      vi.mocked(useProjectsApi.useFetchProjects).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      } as any);

      rerender();

      expect(mockSetError).toHaveBeenCalledWith(mockError);
    });

    it("should sync when data changes", () => {
      const mockProjects1 = [{ id: "1", name: "Project 1" }];
      const mockProjects2 = [
        { id: "1", name: "Project 1" },
        { id: "2", name: "Project 2" },
      ];

      // Initial data
      vi.mocked(useProjectsApi.useFetchProjects).mockReturnValue({
        data: mockProjects1,
        isLoading: false,
        error: null,
      } as any);

      const { rerender } = renderHook(() => useProjectsSync());

      expect(mockSetProjects).toHaveBeenCalledWith(mockProjects1);

      // Updated data
      vi.mocked(useProjectsApi.useFetchProjects).mockReturnValue({
        data: mockProjects2,
        isLoading: false,
        error: null,
      } as any);

      rerender();

      expect(mockSetProjects).toHaveBeenCalledWith(mockProjects2);
    });
  });

  describe("Return Value", () => {
    it("should return null", () => {
      vi.mocked(useProjectsApi.useFetchProjects).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useProjectsSync());

      expect(result.current).toBeNull();
    });
  });

  describe("Hook Dependencies", () => {
    it("should call useFetchProjects", () => {
      const mockUseFetchProjects = vi.mocked(useProjectsApi.useFetchProjects);
      mockUseFetchProjects.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      renderHook(() => useProjectsSync());

      expect(mockUseFetchProjects).toHaveBeenCalled();
    });

    it("should call useProjectsActions", () => {
      vi.mocked(useProjectsApi.useFetchProjects).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      const mockUseProjectsActions = vi.mocked(projectsStore.useProjectsActions);

      renderHook(() => useProjectsSync());

      expect(mockUseProjectsActions).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined data gracefully", () => {
      vi.mocked(useProjectsApi.useFetchProjects).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      renderHook(() => useProjectsSync());

      expect(mockSetProjects).not.toHaveBeenCalled();
      expect(mockSetIsLoading).not.toHaveBeenCalled();
      expect(mockSetError).not.toHaveBeenCalled();
    });

    it("should handle null error gracefully", () => {
      const mockProjects = [{ id: "1", name: "Project 1" }];

      vi.mocked(useProjectsApi.useFetchProjects).mockReturnValue({
        data: mockProjects,
        isLoading: false,
        error: null,
      } as any);

      renderHook(() => useProjectsSync());

      expect(mockSetProjects).toHaveBeenCalledWith(mockProjects);
      expect(mockSetError).not.toHaveBeenCalled();
    });

    it("should not call any actions when no data, not loading, and no error", () => {
      vi.mocked(useProjectsApi.useFetchProjects).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      renderHook(() => useProjectsSync());

      expect(mockSetProjects).not.toHaveBeenCalled();
      expect(mockSetIsLoading).not.toHaveBeenCalled();
      expect(mockSetError).not.toHaveBeenCalled();
    });
  });
});