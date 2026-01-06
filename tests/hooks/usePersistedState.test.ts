import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePersistedState } from "@/hooks/usePersistedState";
import * as helpers from "@/utils/developer-portal-helpers";

// Mock the helper functions
vi.mock("@/utils/developer-portal-helpers", () => ({
  safeLocalStorageGet: vi.fn(),
  safeLocalStorageSet: vi.fn(),
}));

describe("usePersistedState", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    
    // Default mock implementations
    vi.mocked(helpers.safeLocalStorageGet).mockImplementation((key, defaultValue) => {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      try {
        return JSON.parse(item);
      } catch {
        return defaultValue;
      }
    });
    
    vi.mocked(helpers.safeLocalStorageSet).mockImplementation((key, value) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Initialization", () => {
    it("should initialize with default value when localStorage is empty", () => {
      const { result } = renderHook(() => usePersistedState("test-key", "default"));

      expect(result.current[0]).toBe("default");
      expect(helpers.safeLocalStorageGet).toHaveBeenCalledWith("test-key", "default");
    });

    it("should initialize with value from localStorage when available", () => {
      localStorage.setItem("test-key", JSON.stringify("stored-value"));

      const { result } = renderHook(() => usePersistedState("test-key", "default"));

      expect(result.current[0]).toBe("stored-value");
    });

    it("should work with different data types - number", () => {
      localStorage.setItem("test-number", JSON.stringify(42));

      const { result } = renderHook(() => usePersistedState("test-number", 0));

      expect(result.current[0]).toBe(42);
    });

    it("should work with different data types - boolean", () => {
      localStorage.setItem("test-bool", JSON.stringify(true));

      const { result } = renderHook(() => usePersistedState("test-bool", false));

      expect(result.current[0]).toBe(true);
    });

    it("should work with different data types - object", () => {
      const testObj = { name: "test", count: 5 };
      localStorage.setItem("test-obj", JSON.stringify(testObj));

      const { result } = renderHook(() => usePersistedState("test-obj", {}));

      expect(result.current[0]).toEqual(testObj);
    });

    it("should work with different data types - array", () => {
      const testArray = [1, 2, 3, 4, 5];
      localStorage.setItem("test-array", JSON.stringify(testArray));

      const { result } = renderHook(() => usePersistedState("test-array", []));

      expect(result.current[0]).toEqual(testArray);
    });
  });

  describe("State Updates", () => {
    it("should update state", () => {
      const { result } = renderHook(() => usePersistedState("test-key", "initial"));

      act(() => {
        result.current[1]("updated");
      });

      expect(result.current[0]).toBe("updated");
    });

    it("should update state multiple times", () => {
      const { result } = renderHook(() => usePersistedState("test-key", 0));

      act(() => {
        result.current[1](1);
      });

      expect(result.current[0]).toBe(1);

      act(() => {
        result.current[1](2);
      });

      expect(result.current[0]).toBe(2);

      act(() => {
        result.current[1](3);
      });

      expect(result.current[0]).toBe(3);
    });

    it("should update object state", () => {
      const { result } = renderHook(() => 
        usePersistedState<{ count: number }>("test-obj", { count: 0 })
      );

      act(() => {
        result.current[1]({ count: 5 });
      });

      expect(result.current[0]).toEqual({ count: 5 });
    });

    it("should update array state", () => {
      const { result } = renderHook(() => usePersistedState<number[]>("test-array", []));

      act(() => {
        result.current[1]([1, 2, 3]);
      });

      expect(result.current[0]).toEqual([1, 2, 3]);

      act(() => {
        result.current[1]([...result.current[0], 4]);
      });

      expect(result.current[0]).toEqual([1, 2, 3, 4]);
    });
  });

  describe("Persistence to localStorage", () => {
    it("should persist state changes to localStorage", async () => {
      const { result } = renderHook(() => usePersistedState("test-key", "initial"));

      act(() => {
        result.current[1]("updated");
      });

      await waitFor(() => {
        expect(helpers.safeLocalStorageSet).toHaveBeenCalledWith("test-key", "updated");
      });
    });

    it("should persist initial state to localStorage", async () => {
      renderHook(() => usePersistedState("test-key", "default"));

      await waitFor(() => {
        expect(helpers.safeLocalStorageSet).toHaveBeenCalledWith("test-key", "default");
      });
    });

    it("should persist number values", async () => {
      const { result } = renderHook(() => usePersistedState("test-number", 0));

      act(() => {
        result.current[1](42);
      });

      await waitFor(() => {
        expect(helpers.safeLocalStorageSet).toHaveBeenCalledWith("test-number", 42);
      });
    });

    it("should persist boolean values", async () => {
      const { result } = renderHook(() => usePersistedState("test-bool", false));

      act(() => {
        result.current[1](true);
      });

      await waitFor(() => {
        expect(helpers.safeLocalStorageSet).toHaveBeenCalledWith("test-bool", true);
      });
    });

    it("should persist object values", async () => {
      const { result } = renderHook(() => 
        usePersistedState<{ name: string }>("test-obj", { name: "initial" })
      );

      act(() => {
        result.current[1]({ name: "updated" });
      });

      await waitFor(() => {
        expect(helpers.safeLocalStorageSet).toHaveBeenCalledWith("test-obj", { name: "updated" });
      });
    });

    it("should persist array values", async () => {
      const { result } = renderHook(() => usePersistedState<string[]>("test-array", []));

      act(() => {
        result.current[1](["a", "b", "c"]);
      });

      await waitFor(() => {
        expect(helpers.safeLocalStorageSet).toHaveBeenCalledWith("test-array", ["a", "b", "c"]);
      });
    });
  });

  describe("Cross-tab Synchronization", () => {
    it("should update state when storage event is triggered", async () => {
      const { result } = renderHook(() => usePersistedState("test-key", "initial"));

      // Simulate storage event from another tab
      act(() => {
        const storageEvent = new StorageEvent("storage", {
          key: "test-key",
          newValue: JSON.stringify("from-another-tab"),
        });
        window.dispatchEvent(storageEvent);
      });

      await waitFor(() => {
        expect(result.current[0]).toBe("from-another-tab");
      });
    });

    it("should ignore storage events for different keys", async () => {
      const { result } = renderHook(() => usePersistedState("test-key", "initial"));

      // Simulate storage event for a different key
      act(() => {
        const storageEvent = new StorageEvent("storage", {
          key: "other-key",
          newValue: JSON.stringify("other-value"),
        });
        window.dispatchEvent(storageEvent);
      });

      // State should remain unchanged
      expect(result.current[0]).toBe("initial");
    });

    it("should handle storage event with null value", async () => {
      const { result } = renderHook(() => usePersistedState("test-key", "default"));

      // Set initial value
      act(() => {
        result.current[1]("updated");
      });

      // Simulate storage event with null (key deleted)
      act(() => {
        const storageEvent = new StorageEvent("storage", {
          key: "test-key",
          newValue: null,
        });
        window.dispatchEvent(storageEvent);
      });

      await waitFor(() => {
        expect(result.current[0]).toBe("default");
      });
    });

    it("should handle storage event with object value", async () => {
      const { result } = renderHook(() => 
        usePersistedState<{ count: number }>("test-obj", { count: 0 })
      );

      act(() => {
        const storageEvent = new StorageEvent("storage", {
          key: "test-obj",
          newValue: JSON.stringify({ count: 10 }),
        });
        window.dispatchEvent(storageEvent);
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual({ count: 10 });
      });
    });

    it("should handle storage event with array value", async () => {
      const { result } = renderHook(() => usePersistedState<number[]>("test-array", []));

      act(() => {
        const storageEvent = new StorageEvent("storage", {
          key: "test-array",
          newValue: JSON.stringify([1, 2, 3]),
        });
        window.dispatchEvent(storageEvent);
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual([1, 2, 3]);
      });
    });
  });

  describe("Multiple Instances", () => {
    it("should allow multiple instances with different keys", () => {
      const { result: result1 } = renderHook(() => usePersistedState("key1", "value1"));
      const { result: result2 } = renderHook(() => usePersistedState("key2", "value2"));

      expect(result1.current[0]).toBe("value1");
      expect(result2.current[0]).toBe("value2");

      act(() => {
        result1.current[1]("updated1");
      });

      expect(result1.current[0]).toBe("updated1");
      expect(result2.current[0]).toBe("value2");
    });

    it("should sync multiple instances with same key", async () => {
      const { result: result1 } = renderHook(() => usePersistedState("shared-key", "initial"));
      const { result: result2 } = renderHook(() => usePersistedState("shared-key", "initial"));

      // Update first instance
      act(() => {
        result1.current[1]("updated");
      });

      // Simulate storage event to sync second instance
      act(() => {
        const storageEvent = new StorageEvent("storage", {
          key: "shared-key",
          newValue: JSON.stringify("updated"),
        });
        window.dispatchEvent(storageEvent);
      });

      await waitFor(() => {
        expect(result2.current[0]).toBe("updated");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined value", () => {
      const { result } = renderHook(() => 
        usePersistedState<string | undefined>("test-key", undefined)
      );

      expect(result.current[0]).toBeUndefined();
    });

    it("should handle null value", () => {
      const { result } = renderHook(() => 
        usePersistedState<string | null>("test-key", null)
      );

      expect(result.current[0]).toBeNull();
    });

    it("should handle empty string", () => {
      const { result } = renderHook(() => usePersistedState("test-key", ""));

      expect(result.current[0]).toBe("");

      act(() => {
        result.current[1]("non-empty");
      });

      expect(result.current[0]).toBe("non-empty");
    });

    it("should handle zero as number", () => {
      const { result } = renderHook(() => usePersistedState("test-number", 0));

      expect(result.current[0]).toBe(0);
    });

    it("should handle empty array", () => {
      const { result } = renderHook(() => usePersistedState<any[]>("test-array", []));

      expect(result.current[0]).toEqual([]);
    });

    it("should handle empty object", () => {
      const { result } = renderHook(() => usePersistedState<object>("test-obj", {}));

      expect(result.current[0]).toEqual({});
    });
  });

  describe("Cleanup", () => {
    it("should remove storage event listener on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
      
      const { unmount } = renderHook(() => usePersistedState("test-key", "value"));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "storage",
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });
  });
});