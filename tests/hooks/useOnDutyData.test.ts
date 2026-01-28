import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOnDutyData, type Member, type OnCallShift, type OnDutyShift } from "@/hooks/useOnDutyData";

// Mock the team data
vi.mock("@/data/team/my-team.json", () => ({
  default: {
    members: [
      { id: "m1", fullName: "Alice Smith", email: "alice@example.com", role: "Engineer" },
      { id: "m2", fullName: "Bob Jones", email: "bob@example.com", role: "Manager" },
      { id: "m3", fullName: "Carol White", email: "carol@example.com", role: "Designer" },
    ],
  },
}));

describe("useOnDutyData", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Initialization", () => {
    it("should initialize with empty onCall and onDuty arrays", () => {
      const { result } = renderHook(() => useOnDutyData());

      expect(result.current.onCall).toEqual([]);
      expect(result.current.onDuty).toEqual([]);
    });

    it("should initialize with current year", () => {
      const currentYear = new Date().getFullYear();
      const { result } = renderHook(() => useOnDutyData());

      expect(result.current.year).toBe(currentYear);
    });

    it("should load members from team data by default", () => {
      const { result } = renderHook(() => useOnDutyData());

      expect(result.current.members).toHaveLength(3);
      expect(result.current.members[0].fullName).toBe("Alice Smith");
    });

    it("should use custom members when provided", () => {
      const customMembers: Member[] = [
        { id: "c1", fullName: "Custom User", email: "custom@example.com", role: "Developer" },
      ];

      const { result } = renderHook(() => useOnDutyData(undefined, customMembers));

      expect(result.current.members).toHaveLength(1);
      expect(result.current.members[0].fullName).toBe("Custom User");
    });

    it("should create membersById lookup", () => {
      const { result } = renderHook(() => useOnDutyData());

      expect(result.current.membersById["m1"]).toBeDefined();
      expect(result.current.membersById["m1"].fullName).toBe("Alice Smith");
    });
  });

  describe("Storage Key", () => {
    it("should use default storage key when no teamKey provided", () => {
      const { result } = renderHook(() => useOnDutyData());

      act(() => {
        result.current.setOnCall([
          {
            id: "oc1",
            start: "2024-01-01",
            end: "2024-01-07",
            type: "week",
            assigneeId: "m1",
          },
        ]);
      });

      const stored = localStorage.getItem("onDutyStore");
      expect(stored).toBeTruthy();
    });

    it("should use team-specific storage key when teamKey provided", () => {
      const { result } = renderHook(() => useOnDutyData("team-alpha"));

      act(() => {
        result.current.setOnCall([
          {
            id: "oc1",
            start: "2024-01-01",
            end: "2024-01-07",
            type: "week",
            assigneeId: "m1",
          },
        ]);
      });

      const stored = localStorage.getItem("onDutyStore:team-alpha");
      expect(stored).toBeTruthy();
    });
  });

  describe("Year Management", () => {
    it("should change year", () => {
      const { result } = renderHook(() => useOnDutyData());

      act(() => {
        result.current.setYear(2023);
      });

      expect(result.current.year).toBe(2023);
    });

    it("should return different data for different years", () => {
      const { result } = renderHook(() => useOnDutyData());
      const currentYear = result.current.year;
      const otherYear = currentYear - 1;

      // Add data for current year
      act(() => {
        result.current.setOnCall([
          {
            id: "oc1",
            start: `${currentYear}-01-01`,
            end: `${currentYear}-01-07`,
            type: "week",
            assigneeId: "m1",
          },
        ]);
      });

      expect(result.current.onCall).toHaveLength(1);

      // Switch to different year
      act(() => {
        result.current.setYear(otherYear);
      });

      // Should be empty for other year
      expect(result.current.onCall).toHaveLength(0);

      // Add data for other year
      act(() => {
        result.current.setOnCall([
          {
            id: "oc2",
            start: `${otherYear}-01-01`,
            end: `${otherYear}-01-07`,
            type: "week",
            assigneeId: "m2",
          },
        ]);
      });

      expect(result.current.onCall).toHaveLength(1);
      expect(result.current.onCall[0].id).toBe("oc2");

      // Switch back to current year
      act(() => {
        result.current.setYear(currentYear);
      });

      expect(result.current.onCall).toHaveLength(1);
      expect(result.current.onCall[0].id).toBe("oc1");
    });
  });

  describe("OnCall Management", () => {
    it("should add onCall shift", () => {
      const { result } = renderHook(() => useOnDutyData());

      const shift: OnCallShift = {
        id: "oc1",
        start: "2024-01-01",
        end: "2024-01-07",
        type: "week",
        assigneeId: "m1",
      };

      act(() => {
        result.current.setOnCall([shift]);
      });

      expect(result.current.onCall).toHaveLength(1);
      expect(result.current.onCall[0]).toEqual(shift);
    });

    it("should update onCall shifts", () => {
      const { result } = renderHook(() => useOnDutyData());

      act(() => {
        result.current.setOnCall([
          {
            id: "oc1",
            start: "2024-01-01",
            end: "2024-01-07",
            type: "week",
            assigneeId: "m1",
          },
        ]);
      });

      act(() => {
        result.current.setOnCall([
          {
            id: "oc1",
            start: "2024-01-01",
            end: "2024-01-07",
            type: "week",
            assigneeId: "m2", // Changed assignee
          },
          {
            id: "oc2",
            start: "2024-01-08",
            end: "2024-01-14",
            type: "week",
            assigneeId: "m1",
          },
        ]);
      });

      expect(result.current.onCall).toHaveLength(2);
      expect(result.current.onCall[0].assigneeId).toBe("m2");
    });

    it("should persist onCall to localStorage", () => {
      const { result } = renderHook(() => useOnDutyData());

      act(() => {
        result.current.setOnCall([
          {
            id: "oc1",
            start: "2024-01-01",
            end: "2024-01-07",
            type: "week",
            assigneeId: "m1",
          },
        ]);
      });

      const stored = localStorage.getItem("onDutyStore");
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.onCall[String(new Date().getFullYear())]).toHaveLength(1);
    });

    it("should handle weekend type shifts", () => {
      const { result } = renderHook(() => useOnDutyData());

      act(() => {
        result.current.setOnCall([
          {
            id: "oc1",
            start: "2024-01-06",
            end: "2024-01-07",
            type: "weekend",
            assigneeId: "m1",
          },
        ]);
      });

      expect(result.current.onCall[0].type).toBe("weekend");
    });

    it("should handle called property", () => {
      const { result } = renderHook(() => useOnDutyData());

      act(() => {
        result.current.setOnCall([
          {
            id: "oc1",
            start: "2024-01-01",
            end: "2024-01-07",
            type: "week",
            assigneeId: "m1",
            called: true,
          },
        ]);
      });

      expect(result.current.onCall[0].called).toBe(true);
    });
  });

  describe("OnDuty Management", () => {
    it("should add onDuty shift", () => {
      const { result } = renderHook(() => useOnDutyData());

      const shift: OnDutyShift = {
        id: "od1",
        date: "2024-01-15",
        assigneeId: "m1",
      };

      act(() => {
        result.current.setOnDuty([shift]);
      });

      expect(result.current.onDuty).toHaveLength(1);
      expect(result.current.onDuty[0]).toEqual(shift);
    });

    it("should update onDuty shifts", () => {
      const { result } = renderHook(() => useOnDutyData());

      act(() => {
        result.current.setOnDuty([
          {
            id: "od1",
            date: "2024-01-15",
            assigneeId: "m1",
          },
        ]);
      });

      act(() => {
        result.current.setOnDuty([
          {
            id: "od1",
            date: "2024-01-15",
            assigneeId: "m2", // Changed assignee
            notes: "Updated shift",
          },
        ]);
      });

      expect(result.current.onDuty).toHaveLength(1);
      expect(result.current.onDuty[0].assigneeId).toBe("m2");
      expect(result.current.onDuty[0].notes).toBe("Updated shift");
    });

    it("should persist onDuty to localStorage", () => {
      const { result } = renderHook(() => useOnDutyData());

      act(() => {
        result.current.setOnDuty([
          {
            id: "od1",
            date: "2024-01-15",
            assigneeId: "m1",
          },
        ]);
      });

      const stored = localStorage.getItem("onDutyStore");
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.onDuty[String(new Date().getFullYear())]).toHaveLength(1);
    });

    it("should handle date range shifts", () => {
      const { result } = renderHook(() => useOnDutyData());

      act(() => {
        result.current.setOnDuty([
          {
            id: "od1",
            start: "2024-01-15",
            end: "2024-01-20",
            assigneeId: "m1",
            notes: "Week-long shift",
          },
        ]);
      });

      expect(result.current.onDuty[0].start).toBe("2024-01-15");
      expect(result.current.onDuty[0].end).toBe("2024-01-20");
    });
  });

  describe("Today's Assignments", () => {
    it("should find day assignment for exact date match", () => {
      const { result } = renderHook(() => useOnDutyData());
      const today = new Date().toISOString().slice(0, 10);

      act(() => {
        result.current.setOnDuty([
          {
            id: "od1",
            date: today,
            assigneeId: "m1",
          },
        ]);
      });

      expect(result.current.todayAssignments.dayMember).toBeDefined();
      expect(result.current.todayAssignments.dayMember?.id).toBe("m1");
    });

    it("should find day assignment for date range", () => {
      const { result } = renderHook(() => useOnDutyData());
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

      act(() => {
        result.current.setOnDuty([
          {
            id: "od1",
            start: yesterday,
            end: tomorrow,
            assigneeId: "m2",
          },
        ]);
      });

      expect(result.current.todayAssignments.dayMember).toBeDefined();
      expect(result.current.todayAssignments.dayMember?.id).toBe("m2");
    });

    it("should return undefined when no assignment for today", () => {
      const { result } = renderHook(() => useOnDutyData());

      expect(result.current.todayAssignments.dayMember).toBeUndefined();
      expect(result.current.todayAssignments.nightMember).toBeUndefined();
    });
  });

  describe("Undo Functionality", () => {
    it("should start with canUndo as false", () => {
      const { result } = renderHook(() => useOnDutyData());

      expect(result.current.canUndo).toBe(false);
    });

    it("should undo onCall changes", async () => {
      const { result } = renderHook(() => useOnDutyData());

      // Add first shift
      act(() => {
        result.current.setOnCall([
          {
            id: "oc1",
            start: "2024-01-01",
            end: "2024-01-07",
            type: "week",
            assigneeId: "m1",
          },
        ]);
      });

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 350));

      // Add second shift
      act(() => {
        result.current.setOnCall([
          {
            id: "oc1",
            start: "2024-01-01",
            end: "2024-01-07",
            type: "week",
            assigneeId: "m1",
          },
          {
            id: "oc2",
            start: "2024-01-08",
            end: "2024-01-14",
            type: "week",
            assigneeId: "m2",
          },
        ]);
      });

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(result.current.onCall).toHaveLength(2);
      expect(result.current.canUndo).toBe(true);

      // Undo
      act(() => {
        result.current.undo();
      });

      expect(result.current.onCall).toHaveLength(1);
    });

    it("should undo onDuty changes", async () => {
      const { result } = renderHook(() => useOnDutyData());

      // Add first shift
      act(() => {
        result.current.setOnDuty([
          {
            id: "od1",
            date: "2024-01-15",
            assigneeId: "m1",
          },
        ]);
      });

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 350));

      // Update shift
      act(() => {
        result.current.setOnDuty([
          {
            id: "od1",
            date: "2024-01-15",
            assigneeId: "m2",
            notes: "Changed assignee",
          },
        ]);
      });

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(result.current.onDuty[0].assigneeId).toBe("m2");

      // Undo
      act(() => {
        result.current.undo();
      });

      expect(result.current.onDuty[0].assigneeId).toBe("m1");
    });

    it("should not undo when there is no history", () => {
      const { result } = renderHook(() => useOnDutyData());

      act(() => {
        result.current.setOnCall([
          {
            id: "oc1",
            start: "2024-01-01",
            end: "2024-01-07",
            type: "week",
            assigneeId: "m1",
          },
        ]);
      });

      // Undo without waiting for history
      act(() => {
        result.current.undo();
      });

      // Should still have the shift since no history was created yet
      expect(result.current.onCall).toHaveLength(1);
    });
  });

  describe("Save Functionality", () => {
    it("should force save to localStorage", () => {
      const { result } = renderHook(() => useOnDutyData());

      act(() => {
        result.current.setOnCall([
          {
            id: "oc1",
            start: "2024-01-01",
            end: "2024-01-07",
            type: "week",
            assigneeId: "m1",
          },
        ]);
      });

      act(() => {
        result.current.save();
      });

      const stored = localStorage.getItem("onDutyStore");
      expect(stored).toBeTruthy();
    });
  });

  describe("Data Persistence", () => {
    it("should load data from localStorage on mount", () => {
      const currentYear = new Date().getFullYear();
      const testData = {
        onCall: {
          [currentYear]: [
            {
              id: "oc1",
              start: "2024-01-01",
              end: "2024-01-07",
              type: "week",
              assigneeId: "m1",
            },
          ],
        },
        onDuty: {
          [currentYear]: [
            {
              id: "od1",
              date: "2024-01-15",
              assigneeId: "m2",
            },
          ],
        },
      };

      localStorage.setItem("onDutyStore", JSON.stringify(testData));

      const { result } = renderHook(() => useOnDutyData());

      expect(result.current.onCall).toHaveLength(1);
      expect(result.current.onDuty).toHaveLength(1);
    });

    it("should handle corrupted localStorage data gracefully", () => {
      localStorage.setItem("onDutyStore", "invalid-json-{{{");

      const { result } = renderHook(() => useOnDutyData());

      expect(result.current.onCall).toEqual([]);
      expect(result.current.onDuty).toEqual([]);
    });
  });
});