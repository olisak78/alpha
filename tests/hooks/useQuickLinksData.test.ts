import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useQuickLinksData } from "@/hooks/useQuickLinksData";
import * as useQuickLinksApi from "@/hooks/api/useQuickLinks";
import * as useAuthWithRole from "@/hooks/useAuthWithRole";

// Mock the dependencies
vi.mock("@/hooks/api/useQuickLinks");
vi.mock("@/hooks/useAuthWithRole");

describe("useQuickLinksData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("User Authentication", () => {
    it("should return null memberId when user is not logged in", () => {
      vi.mocked(useAuthWithRole.useAuthWithRole).mockReturnValue({
        user: null,
      } as any);

      vi.mocked(useQuickLinksApi.useQuickLinks).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useQuickLinksData());

      expect(result.current.memberId).toBeNull();
    });

    it("should return memberId when user is logged in", () => {
      vi.mocked(useAuthWithRole.useAuthWithRole).mockReturnValue({
        user: { memberId: "member-123" },
      } as any);

      vi.mocked(useQuickLinksApi.useQuickLinks).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useQuickLinksData());

      expect(result.current.memberId).toBe("member-123");
    });

    it("should call useQuickLinks with memberId when user is logged in", () => {
      vi.mocked(useAuthWithRole.useAuthWithRole).mockReturnValue({
        user: { memberId: "member-123" },
      } as any);

      const mockUseQuickLinks = vi.mocked(useQuickLinksApi.useQuickLinks);
      mockUseQuickLinks.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      renderHook(() => useQuickLinksData());

      expect(mockUseQuickLinks).toHaveBeenCalledWith("member-123", {
        enabled: true,
      });
    });

    it("should call useQuickLinks with enabled=false when user is not logged in", () => {
      vi.mocked(useAuthWithRole.useAuthWithRole).mockReturnValue({
        user: null,
      } as any);

      const mockUseQuickLinks = vi.mocked(useQuickLinksApi.useQuickLinks);
      mockUseQuickLinks.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      renderHook(() => useQuickLinksData());

      expect(mockUseQuickLinks).toHaveBeenCalledWith("", {
        enabled: false,
      });
    });
  });

  describe("Data Fetching States", () => {
    beforeEach(() => {
      vi.mocked(useAuthWithRole.useAuthWithRole).mockReturnValue({
        user: { memberId: "member-123" },
      } as any);
    });

    it("should return loading state", () => {
      vi.mocked(useQuickLinksApi.useQuickLinks).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      const { result } = renderHook(() => useQuickLinksData());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeNull();
    });

    it("should return error state", () => {
      const mockError = new Error("Failed to fetch quick links");

      vi.mocked(useQuickLinksApi.useQuickLinks).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      } as any);

      const { result } = renderHook(() => useQuickLinksData());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(mockError);
      expect(result.current.data).toBeUndefined();
    });

    it("should return data when fetch succeeds", () => {
      const mockData = {
        quick_links: [
          { id: "1", title: "Link 1", url: "https://example.com/1", category: "Development" },
          { id: "2", title: "Link 2", url: "https://example.com/2", category: "Documentation" },
        ],
      };

      vi.mocked(useQuickLinksApi.useQuickLinks).mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useQuickLinksData());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.data).toEqual(mockData);
    });
  });

  describe("Grouped Links", () => {
    beforeEach(() => {
      vi.mocked(useAuthWithRole.useAuthWithRole).mockReturnValue({
        user: { memberId: "member-123" },
      } as any);
    });

    it("should return empty object when no data", () => {
      vi.mocked(useQuickLinksApi.useQuickLinks).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useQuickLinksData());

      expect(result.current.groupedLinks).toEqual({});
    });

    it("should return empty object when quick_links is undefined", () => {
      vi.mocked(useQuickLinksApi.useQuickLinks).mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useQuickLinksData());

      expect(result.current.groupedLinks).toEqual({});
    });

    it("should group links by category", () => {
      const mockData = {
        quick_links: [
          { id: "1", title: "Link 1", url: "https://example.com/1", category: "Development" },
          { id: "2", title: "Link 2", url: "https://example.com/2", category: "Development" },
          { id: "3", title: "Link 3", url: "https://example.com/3", category: "Documentation" },
        ],
      };

      vi.mocked(useQuickLinksApi.useQuickLinks).mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useQuickLinksData());

      expect(result.current.groupedLinks).toEqual({
        Development: [
          { id: "1", title: "Link 1", url: "https://example.com/1", category: "Development" },
          { id: "2", title: "Link 2", url: "https://example.com/2", category: "Development" },
        ],
        Documentation: [
          { id: "3", title: "Link 3", url: "https://example.com/3", category: "Documentation" },
        ],
      });
    });

    it("should put links without category into 'Other'", () => {
      const mockData = {
        quick_links: [
          { id: "1", title: "Link 1", url: "https://example.com/1", category: "Development" },
          { id: "2", title: "Link 2", url: "https://example.com/2" }, // No category
          { id: "3", title: "Link 3", url: "https://example.com/3", category: null }, // Null category
        ],
      };

      vi.mocked(useQuickLinksApi.useQuickLinks).mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useQuickLinksData());

      expect(result.current.groupedLinks).toEqual({
        Development: [
          { id: "1", title: "Link 1", url: "https://example.com/1", category: "Development" },
        ],
        Other: [
          { id: "2", title: "Link 2", url: "https://example.com/2" },
          { id: "3", title: "Link 3", url: "https://example.com/3", category: null },
        ],
      });
    });

    it("should handle multiple categories", () => {
      const mockData = {
        quick_links: [
          { id: "1", title: "Link 1", url: "https://example.com/1", category: "Development" },
          { id: "2", title: "Link 2", url: "https://example.com/2", category: "Documentation" },
          { id: "3", title: "Link 3", url: "https://example.com/3", category: "Testing" },
          { id: "4", title: "Link 4", url: "https://example.com/4", category: "Deployment" },
        ],
      };

      vi.mocked(useQuickLinksApi.useQuickLinks).mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useQuickLinksData());

      expect(Object.keys(result.current.groupedLinks)).toEqual([
        "Development",
        "Documentation",
        "Testing",
        "Deployment",
      ]);
      expect(result.current.groupedLinks.Development).toHaveLength(1);
      expect(result.current.groupedLinks.Documentation).toHaveLength(1);
      expect(result.current.groupedLinks.Testing).toHaveLength(1);
      expect(result.current.groupedLinks.Deployment).toHaveLength(1);
    });

    it("should handle empty quick_links array", () => {
      const mockData = {
        quick_links: [],
      };

      vi.mocked(useQuickLinksApi.useQuickLinks).mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useQuickLinksData());

      expect(result.current.groupedLinks).toEqual({});
    });
  });

  describe("Existing Categories", () => {
    beforeEach(() => {
      vi.mocked(useAuthWithRole.useAuthWithRole).mockReturnValue({
        user: { memberId: "member-123" },
      } as any);
    });

    it("should return empty array when no data", () => {
      vi.mocked(useQuickLinksApi.useQuickLinks).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useQuickLinksData());

      expect(result.current.existingCategories).toEqual([]);
    });

    it("should return empty array when quick_links is undefined", () => {
      vi.mocked(useQuickLinksApi.useQuickLinks).mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useQuickLinksData());

      expect(result.current.existingCategories).toEqual([]);
    });

    it("should extract unique categories", () => {
      const mockData = {
        quick_links: [
          { id: "1", title: "Link 1", url: "https://example.com/1", category: "Development" },
          { id: "2", title: "Link 2", url: "https://example.com/2", category: "Development" },
          { id: "3", title: "Link 3", url: "https://example.com/3", category: "Documentation" },
        ],
      };

      vi.mocked(useQuickLinksApi.useQuickLinks).mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useQuickLinksData());

      expect(result.current.existingCategories).toEqual(["Development", "Documentation"]);
    });

    it("should filter out null/undefined categories", () => {
      const mockData = {
        quick_links: [
          { id: "1", title: "Link 1", url: "https://example.com/1", category: "Development" },
          { id: "2", title: "Link 2", url: "https://example.com/2" }, // No category
          { id: "3", title: "Link 3", url: "https://example.com/3", category: null },
          { id: "4", title: "Link 4", url: "https://example.com/4", category: "Documentation" },
        ],
      };

      vi.mocked(useQuickLinksApi.useQuickLinks).mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useQuickLinksData());

      expect(result.current.existingCategories).toEqual(["Development", "Documentation"]);
      expect(result.current.existingCategories).not.toContain(null);
      expect(result.current.existingCategories).not.toContain(undefined);
    });

    it("should handle duplicate categories", () => {
      const mockData = {
        quick_links: [
          { id: "1", title: "Link 1", url: "https://example.com/1", category: "Development" },
          { id: "2", title: "Link 2", url: "https://example.com/2", category: "Development" },
          { id: "3", title: "Link 3", url: "https://example.com/3", category: "Development" },
        ],
      };

      vi.mocked(useQuickLinksApi.useQuickLinks).mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useQuickLinksData());

      expect(result.current.existingCategories).toEqual(["Development"]);
    });

    it("should handle empty quick_links array", () => {
      const mockData = {
        quick_links: [],
      };

      vi.mocked(useQuickLinksApi.useQuickLinks).mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useQuickLinksData());

      expect(result.current.existingCategories).toEqual([]);
    });
  });

  describe("Memoization", () => {
    beforeEach(() => {
      vi.mocked(useAuthWithRole.useAuthWithRole).mockReturnValue({
        user: { memberId: "member-123" },
      } as any);
    });

    it("should memoize groupedLinks when data doesn't change", () => {
      const mockData = {
        quick_links: [
          { id: "1", title: "Link 1", url: "https://example.com/1", category: "Development" },
        ],
      };

      vi.mocked(useQuickLinksApi.useQuickLinks).mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      const { result, rerender } = renderHook(() => useQuickLinksData());

      const firstGroupedLinks = result.current.groupedLinks;

      // Rerender without changing data
      rerender();

      expect(result.current.groupedLinks).toBe(firstGroupedLinks);
    });

    it("should update groupedLinks when data changes", () => {
      const mockData1 = {
        quick_links: [
          { id: "1", title: "Link 1", url: "https://example.com/1", category: "Development" },
        ],
      };

      vi.mocked(useQuickLinksApi.useQuickLinks).mockReturnValue({
        data: mockData1,
        isLoading: false,
        error: null,
      } as any);

      const { result, rerender } = renderHook(() => useQuickLinksData());

      const firstGroupedLinks = result.current.groupedLinks;

      // Change data
      const mockData2 = {
        quick_links: [
          { id: "2", title: "Link 2", url: "https://example.com/2", category: "Documentation" },
        ],
      };

      vi.mocked(useQuickLinksApi.useQuickLinks).mockReturnValue({
        data: mockData2,
        isLoading: false,
        error: null,
      } as any);

      rerender();

      expect(result.current.groupedLinks).not.toBe(firstGroupedLinks);
      expect(Object.keys(result.current.groupedLinks)).toEqual(["Documentation"]);
    });

    it("should memoize existingCategories when data doesn't change", () => {
      const mockData = {
        quick_links: [
          { id: "1", title: "Link 1", url: "https://example.com/1", category: "Development" },
        ],
      };

      vi.mocked(useQuickLinksApi.useQuickLinks).mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      const { result, rerender } = renderHook(() => useQuickLinksData());

      const firstCategories = result.current.existingCategories;

      // Rerender without changing data
      rerender();

      expect(result.current.existingCategories).toBe(firstCategories);
    });
  });

  describe("Integration", () => {
    it("should work end-to-end with user and data", () => {
      vi.mocked(useAuthWithRole.useAuthWithRole).mockReturnValue({
        user: { memberId: "member-123" },
      } as any);

      const mockData = {
        quick_links: [
          { id: "1", title: "GitHub", url: "https://github.com", category: "Development" },
          { id: "2", title: "Docs", url: "https://docs.example.com", category: "Documentation" },
          { id: "3", title: "Jenkins", url: "https://jenkins.example.com", category: "Development" },
          { id: "4", title: "Random", url: "https://random.com" }, // No category
        ],
      };

      vi.mocked(useQuickLinksApi.useQuickLinks).mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useQuickLinksData());

      // Check memberId
      expect(result.current.memberId).toBe("member-123");

      // Check data
      expect(result.current.data).toEqual(mockData);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();

      // Check groupedLinks
      expect(result.current.groupedLinks.Development).toHaveLength(2);
      expect(result.current.groupedLinks.Documentation).toHaveLength(1);
      expect(result.current.groupedLinks.Other).toHaveLength(1);

      // Check existingCategories
      expect(result.current.existingCategories).toEqual(["Development", "Documentation"]);
    });
  });
});