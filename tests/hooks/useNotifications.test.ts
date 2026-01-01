import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useNotifications, bootstrapNotifications } from "@/hooks/useNotifications";

describe("useNotifications", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Initial State", () => {
    it("should start with empty notifications array", () => {
      const { result } = renderHook(() => useNotifications());

      expect(result.current.notifications).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
    });

    it("should call bootstrapNotifications on mount", () => {
      renderHook(() => useNotifications());

      // bootstrapNotifications clears localStorage
      expect(localStorage.getItem("portal.notifications.v2")).toBeNull();
    });
  });

  describe("addNotification", () => {
    it("should add a notification to the list", () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification({
          title: "Test Notification",
          message: "This is a test message",
        });
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0]).toMatchObject({
        title: "Test Notification",
        message: "This is a test message",
        severity: "info",
        readBy: [],
      });
      expect(result.current.notifications[0].id).toBeDefined();
      expect(result.current.notifications[0].createdAt).toBeDefined();
    });

    it("should add notification with custom severity", () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification({
          title: "Warning",
          message: "This is a warning",
          severity: "warning",
        });
      });

      expect(result.current.notifications[0].severity).toBe("warning");
    });

    it("should add notification with dueDate", () => {
      const { result } = renderHook(() => useNotifications());
      const dueDate = new Date().toISOString();

      act(() => {
        result.current.addNotification({
          title: "Task",
          message: "Complete this task",
          dueDate,
        });
      });

      expect(result.current.notifications[0].dueDate).toBe(dueDate);
    });

    it("should add notification with custom id", () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification({
          id: "custom-id",
          title: "Custom",
          message: "Custom ID notification",
        });
      });

      expect(result.current.notifications[0].id).toBe("custom-id");
    });

    it("should add multiple notifications in correct order (newest first)", () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification({
          title: "First",
          message: "First message",
        });
      });

      act(() => {
        result.current.addNotification({
          title: "Second",
          message: "Second message",
        });
      });

      expect(result.current.notifications).toHaveLength(2);
      expect(result.current.notifications[0].title).toBe("Second");
      expect(result.current.notifications[1].title).toBe("First");
    });

    it("should persist notification to localStorage", () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification({
          title: "Persist Test",
          message: "Should be in localStorage",
        });
      });

      const stored = localStorage.getItem("portal.notifications.v2");
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].title).toBe("Persist Test");
    });
  });

  describe("clearAll", () => {

    it("should clear localStorage", () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification({
          title: "Test",
          message: "Message",
        });
      });

      act(() => {
        result.current.clearAll();
      });

      const stored = localStorage.getItem("portal.notifications.v2");
      const parsed = JSON.parse(stored!);
      expect(parsed).toEqual([]);
    });
  });

  describe("markRead", () => {
    it("should mark a notification as read for a user", () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification({
          id: "test-123",
          title: "Test",
          message: "Message",
        });
      });

      act(() => {
        result.current.markRead("test-123", "user-456");
      });

      expect(result.current.notifications[0].readBy).toContain("user-456");
    });

    it("should not duplicate users in readBy array", () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification({
          id: "test-123",
          title: "Test",
          message: "Message",
        });
      });

      act(() => {
        result.current.markRead("test-123", "user-456");
        result.current.markRead("test-123", "user-456");
      });

      expect(result.current.notifications[0].readBy).toHaveLength(1);
      expect(result.current.notifications[0].readBy).toContain("user-456");
    });
  });

  describe("markAllRead", () => {

    it("should preserve existing readBy users", () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification({
          id: "test-123",
          title: "Test",
          message: "Message",
          readBy: ["user-1"],
        });
      });

      act(() => {
        result.current.markAllRead("user-2");
      });

      expect(result.current.notifications[0].readBy).toContain("user-1");
      expect(result.current.notifications[0].readBy).toContain("user-2");
      expect(result.current.notifications[0].readBy).toHaveLength(2);
    });
  });

  describe("unreadCount", () => {
    it("should always return 0 (hardcoded until API integration)", () => {
      const { result } = renderHook(() => useNotifications("user-123"));

      expect(result.current.unreadCount).toBe(0);

      act(() => {
        result.current.addNotification({
          title: "Test",
          message: "Message",
        });
      });

      expect(result.current.unreadCount).toBe(0);
    });
  });



  describe("bootstrapNotifications", () => {
    it("should clear existing notifications from localStorage", () => {
      // Set some initial data
      localStorage.setItem("portal.notifications.v2", JSON.stringify([
        { id: "1", title: "Old", message: "Old notification" },
      ]));

      bootstrapNotifications();

      expect(localStorage.getItem("portal.notifications.v2")).toBeNull();
    });
  });
});