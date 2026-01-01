import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProjectVisibility } from "@/hooks/useProjectVisibility";
import * as projectsStore from "@/stores/projectsStore";
import { Project } from "@/types/api";

// Mock the store
vi.mock("@/stores/projectsStore");

const STORAGE_KEY = "developer-portal-project-visibility";

describe("useProjectVisibility", () => {
  const mockProjects: Project[] = [
    { id: "1", name: "cis20", isVisible: true } as Project,
    { id: "2", name: "usrv", isVisible: true } as Project,
    { id: "3", name: "ca", isVisible: true } as Project,
    { id: "4", name: "other-project", isVisible: false } as Project,
    { id: "5", name: "explicit-visible", isVisible: true } as Project,
  ];

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Default mock - no projects
    vi.mocked(projectsStore.useProjects).mockReturnValue(null);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("loadVisibilitySettings", () => {
    it("should return empty object when localStorage is empty", () => {
      const { result } = renderHook(() => useProjectVisibility());

      const settings = result.current.loadVisibilitySettings();

      expect(settings).toEqual({});
    });

    it("should load settings from localStorage", () => {
      const testSettings = { "1": true, "2": false };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testSettings));

      const { result } = renderHook(() => useProjectVisibility());

      const settings = result.current.loadVisibilitySettings();

      expect(settings).toEqual(testSettings);
    });

    it("should handle corrupted localStorage data gracefully", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      localStorage.setItem(STORAGE_KEY, "invalid-json-{{{");

      const { result } = renderHook(() => useProjectVisibility());

      const settings = result.current.loadVisibilitySettings();

      expect(settings).toEqual({});
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Failed to load project visibility settings:",
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe("isProjectVisible", () => {
    it("should use stored setting when available", () => {
      const testSettings = { "1": false };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testSettings));

      const { result } = renderHook(() => useProjectVisibility());

      const visible = result.current.isProjectVisible(mockProjects[0]);

      expect(visible).toBe(false);
    });

    it("should return true for default visible projects (cis20)", () => {
      const { result } = renderHook(() => useProjectVisibility());

      const visible = result.current.isProjectVisible(mockProjects[0]); // cis20

      expect(visible).toBe(true);
    });

    it("should return true for default visible projects (usrv)", () => {
      const { result } = renderHook(() => useProjectVisibility());

      const visible = result.current.isProjectVisible(mockProjects[1]); // usrv

      expect(visible).toBe(true);
    });

    it("should return true for default visible projects (ca)", () => {
      const { result } = renderHook(() => useProjectVisibility());

      const visible = result.current.isProjectVisible(mockProjects[2]); // ca

      expect(visible).toBe(true);
    });

    it("should respect isVisible=false for default projects", () => {
      const project = { id: "1", name: "cis20", isVisible: false } as Project;

      const { result } = renderHook(() => useProjectVisibility());

      const visible = result.current.isProjectVisible(project);

      expect(visible).toBe(false);
    });

    it("should return false for non-default projects without isVisible=true", () => {
      const { result } = renderHook(() => useProjectVisibility());

      const visible = result.current.isProjectVisible(mockProjects[3]); // other-project with isVisible=false

      expect(visible).toBe(false);
    });

    it("should return true for non-default projects with isVisible=true", () => {
      const { result } = renderHook(() => useProjectVisibility());

      const visible = result.current.isProjectVisible(mockProjects[4]); // explicit-visible with isVisible=true

      expect(visible).toBe(true);
    });

    it("should prioritize stored settings over defaults", () => {
      const testSettings = { "1": false }; // Override cis20 to false
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testSettings));

      const { result } = renderHook(() => useProjectVisibility());

      const visible = result.current.isProjectVisible(mockProjects[0]); // cis20

      expect(visible).toBe(false);
    });

    it("should handle project without isVisible property", () => {
      const project = { id: "6", name: "no-visible-prop" } as Project;

      const { result } = renderHook(() => useProjectVisibility());

      const visible = result.current.isProjectVisible(project);

      expect(visible).toBe(false);
    });
  });

  describe("updateProjectVisibility", () => {
    it("should save settings to localStorage", () => {
      const { result } = renderHook(() => useProjectVisibility());

      const settings = { "1": true, "2": false };

      act(() => {
        result.current.updateProjectVisibility(settings);
      });

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(settings);
    });

    it("should dispatch custom event", () => {
      const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");
      const { result } = renderHook(() => useProjectVisibility());

      act(() => {
        result.current.updateProjectVisibility({ "1": true });
      });

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "projectVisibilityChanged",
        })
      );

      dispatchEventSpy.mockRestore();
    });

    it("should handle localStorage errors gracefully", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
      setItemSpy.mockImplementation(() => {
        throw new Error("Quota exceeded");
      });

      const { result } = renderHook(() => useProjectVisibility());

      act(() => {
        result.current.updateProjectVisibility({ "1": true });
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Failed to save project visibility settings:",
        expect.any(Error)
      );

      setItemSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });

  describe("getVisibleProjects", () => {
    it("should return empty array when no projects", () => {
      vi.mocked(projectsStore.useProjects).mockReturnValue(null);

      const { result } = renderHook(() => useProjectVisibility());

      const visible = result.current.getVisibleProjects();

      expect(visible).toEqual([]);
    });

    it("should return empty array when projects is empty", () => {
      vi.mocked(projectsStore.useProjects).mockReturnValue([]);

      const { result } = renderHook(() => useProjectVisibility());

      const visible = result.current.getVisibleProjects();

      expect(visible).toEqual([]);
    });

    it("should return default visible projects", () => {
      vi.mocked(projectsStore.useProjects).mockReturnValue(mockProjects);

      const { result } = renderHook(() => useProjectVisibility());

      const visible = result.current.getVisibleProjects();

      // Should include cis20, usrv, ca, and explicit-visible (all with isVisible=true)
      expect(visible).toHaveLength(4);
      expect(visible.map((p) => p.name)).toEqual([
        "cis20",
        "usrv",
        "ca",
        "explicit-visible",
      ]);
    });

    it("should filter based on stored settings", () => {
      const testSettings = { "1": false, "4": true }; // Hide cis20, show other-project
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testSettings));
      vi.mocked(projectsStore.useProjects).mockReturnValue(mockProjects);

      const { result } = renderHook(() => useProjectVisibility());

      const visible = result.current.getVisibleProjects();

      // Should include usrv, ca, other-project (because we set it to true), explicit-visible
      expect(visible).toHaveLength(4);
      expect(visible.map((p) => p.name)).toEqual([
        "usrv",
        "ca",
        "other-project",
        "explicit-visible",
      ]);
    });

    it("should update when projects change", () => {
      const initialProjects = [mockProjects[0]]; // Just cis20
      vi.mocked(projectsStore.useProjects).mockReturnValue(initialProjects);

      const { result, rerender } = renderHook(() => useProjectVisibility());

      let visible = result.current.getVisibleProjects();
      expect(visible).toHaveLength(1);

      // Update projects
      vi.mocked(projectsStore.useProjects).mockReturnValue(mockProjects);
      rerender();

      visible = result.current.getVisibleProjects();
      expect(visible).toHaveLength(4);
    });
  });

  describe("resetToDefaults", () => {
    it("should reset to default visibility for all projects", () => {
      vi.mocked(projectsStore.useProjects).mockReturnValue(mockProjects);

      const { result } = renderHook(() => useProjectVisibility());

      act(() => {
        result.current.resetToDefaults();
      });

      const stored = localStorage.getItem(STORAGE_KEY);
      const settings = JSON.parse(stored!);

      // cis20, usrv, ca should be true
      expect(settings["1"]).toBe(true); // cis20
      expect(settings["2"]).toBe(true); // usrv
      expect(settings["3"]).toBe(true); // ca
      // others should be false
      expect(settings["4"]).toBe(false); // other-project
      expect(settings["5"]).toBe(false); // explicit-visible
    });

    it("should dispatch custom event", () => {
      const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");
      vi.mocked(projectsStore.useProjects).mockReturnValue(mockProjects);

      const { result } = renderHook(() => useProjectVisibility());

      act(() => {
        result.current.resetToDefaults();
      });

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "projectVisibilityChanged",
        })
      );

      dispatchEventSpy.mockRestore();
    });

    it("should handle no projects gracefully", () => {
      vi.mocked(projectsStore.useProjects).mockReturnValue(null);

      const { result } = renderHook(() => useProjectVisibility());

      act(() => {
        result.current.resetToDefaults();
      });

      const stored = localStorage.getItem(STORAGE_KEY);
      const settings = JSON.parse(stored!);

      expect(settings).toEqual({});
    });

    it("should overwrite existing settings", () => {
      const existingSettings = { "1": false, "999": true };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingSettings));
      vi.mocked(projectsStore.useProjects).mockReturnValue(mockProjects);

      const { result } = renderHook(() => useProjectVisibility());

      act(() => {
        result.current.resetToDefaults();
      });

      const stored = localStorage.getItem(STORAGE_KEY);
      const settings = JSON.parse(stored!);

      // Should reset cis20 to true
      expect(settings["1"]).toBe(true);
      // Old setting should be gone
      expect(settings["999"]).toBeUndefined();
    });
  });

});