import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScheduleData, type Member, type OnCallShift, type OnDutyShift } from "@/hooks/useScheduleData";
import * as scheduleUtils from "@/utils/schedule-utils";

// Mock the schedule utils
vi.mock("@/utils/schedule-utils");

const STORAGE_KEY = "scheduleData";

describe("useScheduleData", () => {
  const mockMembers: Member[] = [
    { id: "m1", fullName: "Alice Smith", email: "alice@example.com", role: "Engineer" },
    { id: "m2", fullName: "Bob Jones", email: "bob@example.com", role: "Manager" },
    { id: "m3", fullName: "Carol White", email: "carol@example.com", role: "Designer" },
  ];

  const currentYear = new Date().getFullYear();

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Default mocks
    vi.mocked(scheduleUtils.isWeekend).mockReturnValue(false);
    vi.mocked(scheduleUtils.isDateInRange).mockReturnValue(false);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Initialization", () => {
    it("should initialize with empty arrays when localStorage is empty", () => {
      const { result } = renderHook(() => useScheduleData(mockMembers, currentYear));

      expect(result.current.onCall).toEqual([]);
      expect(result.current.onDuty).toEqual([]);
    });

    it("should load data from localStorage when available", () => {
      const testData = {
        onCall: {
          [currentYear]: [
            { id: "oc1", start: "2024-01-01", end: "2024-01-07", type: "week", assigneeId: "m1" },
          ],
        },
        onDuty: {
          [currentYear]: [
            { id: "od1", start: "2024-01-15", end: "2024-01-15", assigneeId: "m2" },
          ],
        },
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(testData));

      const { result } = renderHook(() => useScheduleData(mockMembers, currentYear));

      expect(result.current.onCall).toHaveLength(1);
      expect(result.current.onDuty).toHaveLength(1);
    });

    it("should handle corrupted localStorage gracefully", () => {
      localStorage.setItem(STORAGE_KEY, "invalid-json-{{{");

      const { result } = renderHook(() => useScheduleData(mockMembers, currentYear));

      expect(result.current.onCall).toEqual([]);
      expect(result.current.onDuty).toEqual([]);
    });

    it("should create membersById lookup", () => {
      const { result } = renderHook(() => useScheduleData(mockMembers, currentYear));

      expect(result.current.membersById).toEqual({
        m1: mockMembers[0],
        m2: mockMembers[1],
        m3: mockMembers[2],
      });
    });

    it("should handle empty members array", () => {
      const { result } = renderHook(() => useScheduleData([], currentYear));

      expect(result.current.membersById).toEqual({});
    });
  });

  describe("Year-based Data Management", () => {
    it("should return data for specific year", () => {
      const testData = {
        onCall: {
          "2024": [{ id: "oc1", start: "2024-01-01", end: "2024-01-07", type: "week", assigneeId: "m1" }],
          "2025": [{ id: "oc2", start: "2025-01-01", end: "2025-01-07", type: "week", assigneeId: "m2" }],
        },
        onDuty: {},
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(testData));

      const { result: result2024 } = renderHook(() => useScheduleData(mockMembers, 2024));
      const { result: result2025 } = renderHook(() => useScheduleData(mockMembers, 2025));

      expect(result2024.current.onCall).toHaveLength(1);
      expect(result2024.current.onCall[0].id).toBe("oc1");

      expect(result2025.current.onCall).toHaveLength(1);
      expect(result2025.current.onCall[0].id).toBe("oc2");
    });

    it("should return empty array for year with no data", () => {
      const { result } = renderHook(() => useScheduleData(mockMembers, 2030));

      expect(result.current.onCall).toEqual([]);
      expect(result.current.onDuty).toEqual([]);
    });
  });

  describe("setOnCall", () => {
    it("should add onCall shifts", () => {
      const { result } = renderHook(() => useScheduleData(mockMembers, currentYear));

      const shifts: OnCallShift[] = [
        { id: "oc1", start: "2024-01-01", end: "2024-01-07", type: "week", assigneeId: "m1" },
      ];

      act(() => {
        result.current.setOnCall(shifts);
      });

      expect(result.current.onCall).toEqual(shifts);
    });

    it("should update existing onCall shifts", () => {
      const { result } = renderHook(() => useScheduleData(mockMembers, currentYear));

      const initialShifts: OnCallShift[] = [
        { id: "oc1", start: "2024-01-01", end: "2024-01-07", type: "week", assigneeId: "m1" },
      ];

      act(() => {
        result.current.setOnCall(initialShifts);
      });

      const updatedShifts: OnCallShift[] = [
        { id: "oc1", start: "2024-01-01", end: "2024-01-07", type: "week", assigneeId: "m2" },
        { id: "oc2", start: "2024-01-08", end: "2024-01-14", type: "week", assigneeId: "m1" },
      ];

      act(() => {
        result.current.setOnCall(updatedShifts);
      });

      expect(result.current.onCall).toEqual(updatedShifts);
      expect(result.current.onCall).toHaveLength(2);
    });

    it("should persist to localStorage", async () => {
      const { result } = renderHook(() => useScheduleData(mockMembers, currentYear));

      const shifts: OnCallShift[] = [
        { id: "oc1", start: "2024-01-01", end: "2024-01-07", type: "week", assigneeId: "m1" },
      ];

      act(() => {
        result.current.setOnCall(shifts);
      });

      // Wait for useEffect to run
      await new Promise((resolve) => setTimeout(resolve, 0));

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.onCall[String(currentYear)]).toEqual(shifts);
    });

    it("should handle weekend shifts", () => {
      const { result } = renderHook(() => useScheduleData(mockMembers, currentYear));

      const shifts: OnCallShift[] = [
        { id: "oc1", start: "2024-01-06", end: "2024-01-07", type: "weekend", assigneeId: "m1" },
      ];

      act(() => {
        result.current.setOnCall(shifts);
      });

      expect(result.current.onCall[0].type).toBe("weekend");
    });

    it("should handle called property", () => {
      const { result } = renderHook(() => useScheduleData(mockMembers, currentYear));

      const shifts: OnCallShift[] = [
        { id: "oc1", start: "2024-01-01", end: "2024-01-07", type: "week", assigneeId: "m1", called: true },
      ];

      act(() => {
        result.current.setOnCall(shifts);
      });

      expect(result.current.onCall[0].called).toBe(true);
    });
  });

  describe("setOnDuty", () => {
    it("should add onDuty shifts", () => {
      const { result } = renderHook(() => useScheduleData(mockMembers, currentYear));

      const shifts: OnDutyShift[] = [
        { id: "od1", start: "2024-01-15", end: "2024-01-15", assigneeId: "m1" },
      ];

      act(() => {
        result.current.setOnDuty(shifts);
      });

      expect(result.current.onDuty).toEqual(shifts);
    });

    it("should update existing onDuty shifts", () => {
      const { result } = renderHook(() => useScheduleData(mockMembers, currentYear));

      const initialShifts: OnDutyShift[] = [
        { id: "od1", start: "2024-01-15", end: "2024-01-15", assigneeId: "m1" },
      ];

      act(() => {
        result.current.setOnDuty(initialShifts);
      });

      const updatedShifts: OnDutyShift[] = [
        { id: "od1", start: "2024-01-15", end: "2024-01-15", assigneeId: "m2", notes: "Updated" },
      ];

      act(() => {
        result.current.setOnDuty(updatedShifts);
      });

      expect(result.current.onDuty).toEqual(updatedShifts);
    });

    it("should persist to localStorage", async () => {
      const { result } = renderHook(() => useScheduleData(mockMembers, currentYear));

      const shifts: OnDutyShift[] = [
        { id: "od1", start: "2024-01-15", end: "2024-01-15", assigneeId: "m1" },
      ];

      act(() => {
        result.current.setOnDuty(shifts);
      });

      // Wait for useEffect to run
      await new Promise((resolve) => setTimeout(resolve, 0));

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.onDuty[String(currentYear)]).toEqual(shifts);
    });

    it("should handle notes property", () => {
      const { result } = renderHook(() => useScheduleData(mockMembers, currentYear));

      const shifts: OnDutyShift[] = [
        { id: "od1", start: "2024-01-15", end: "2024-01-15", assigneeId: "m1", notes: "Special shift" },
      ];

      act(() => {
        result.current.setOnDuty(shifts);
      });

      expect(result.current.onDuty[0].notes).toBe("Special shift");
    });
  });

  describe("Today's Assignments", () => {
    it("should return undefined when no shifts match today", () => {
      vi.mocked(scheduleUtils.isDateInRange).mockReturnValue(false);

      const { result } = renderHook(() => useScheduleData(mockMembers, currentYear));

      expect(result.current.todayAssignments.dayMember).toBeUndefined();
      expect(result.current.todayAssignments.nightMember).toBeUndefined();
    });

    it("should find day shift for today", () => {
      const { result } = renderHook(() => useScheduleData(mockMembers, currentYear));

      const shifts: OnDutyShift[] = [
        { id: "od1", start: "2024-01-15", end: "2024-01-15", assigneeId: "m1" },
        { id: "od2", start: "2024-01-16", end: "2024-01-16", assigneeId: "m2" },
      ];

      act(() => {
        result.current.setOnDuty(shifts);
      });

      // Mock first shift to be in range
      vi.mocked(scheduleUtils.isDateInRange).mockImplementation((date, start, end) => {
        return start === "2024-01-15";
      });

      const { result: resultAfter } = renderHook(() => useScheduleData(mockMembers, currentYear));

      act(() => {
        resultAfter.current.setOnDuty(shifts);
      });

      expect(resultAfter.current.todayAssignments.dayMember?.id).toBe("m1");
    });

    it("should find night shift for weekday", () => {
      vi.mocked(scheduleUtils.isWeekend).mockReturnValue(false);

      const { result } = renderHook(() => useScheduleData(mockMembers, currentYear));

      const shifts: OnCallShift[] = [
        { id: "oc1", start: "2024-01-15", end: "2024-01-21", type: "week", assigneeId: "m1" },
        { id: "oc2", start: "2024-01-20", end: "2024-01-21", type: "weekend", assigneeId: "m2" },
      ];

      act(() => {
        result.current.setOnCall(shifts);
      });

      // Mock first shift (week type) to be in range
      vi.mocked(scheduleUtils.isDateInRange).mockImplementation((date, start, end) => {
        return start === "2024-01-15";
      });

      const { result: resultAfter } = renderHook(() => useScheduleData(mockMembers, currentYear));

      act(() => {
        resultAfter.current.setOnCall(shifts);
      });

      expect(resultAfter.current.todayAssignments.nightMember?.id).toBe("m1");
    });

    it("should find night shift for weekend", () => {
      vi.mocked(scheduleUtils.isWeekend).mockReturnValue(true);

      const { result } = renderHook(() => useScheduleData(mockMembers, currentYear));

      const shifts: OnCallShift[] = [
        { id: "oc1", start: "2024-01-15", end: "2024-01-21", type: "week", assigneeId: "m1" },
        { id: "oc2", start: "2024-01-20", end: "2024-01-21", type: "weekend", assigneeId: "m2" },
      ];

      act(() => {
        result.current.setOnCall(shifts);
      });

      // Mock second shift (weekend type) to be in range
      vi.mocked(scheduleUtils.isDateInRange).mockImplementation((date, start, end) => {
        return start === "2024-01-20";
      });

      const { result: resultAfter } = renderHook(() => useScheduleData(mockMembers, currentYear));

      act(() => {
        resultAfter.current.setOnCall(shifts);
      });

      expect(resultAfter.current.todayAssignments.nightMember?.id).toBe("m2");
    });

    it("should handle both day and night assignments", () => {
      const { result } = renderHook(() => useScheduleData(mockMembers, currentYear));

      const onDutyShifts: OnDutyShift[] = [
        { id: "od1", start: "2024-01-15", end: "2024-01-15", assigneeId: "m1" },
      ];

      const onCallShifts: OnCallShift[] = [
        { id: "oc1", start: "2024-01-15", end: "2024-01-21", type: "week", assigneeId: "m2" },
      ];

      act(() => {
        result.current.setOnDuty(onDutyShifts);
        result.current.setOnCall(onCallShifts);
      });

      // Mock both to be in range
      vi.mocked(scheduleUtils.isDateInRange).mockReturnValue(true);
      vi.mocked(scheduleUtils.isWeekend).mockReturnValue(false);

      const { result: resultAfter } = renderHook(() => useScheduleData(mockMembers, currentYear));

      act(() => {
        resultAfter.current.setOnDuty(onDutyShifts);
        resultAfter.current.setOnCall(onCallShifts);
      });

      expect(resultAfter.current.todayAssignments.dayMember?.id).toBe("m1");
      expect(resultAfter.current.todayAssignments.nightMember?.id).toBe("m2");
    });
  });



  describe("Members Update", () => {
    it("should update membersById when members change", () => {
      const initialMembers = [mockMembers[0]];
      const { result, rerender } = renderHook(
        ({ members }) => useScheduleData(members, currentYear),
        { initialProps: { members: initialMembers } }
      );

      expect(Object.keys(result.current.membersById)).toHaveLength(1);

      // Update with all members
      rerender({ members: mockMembers });

      expect(Object.keys(result.current.membersById)).toHaveLength(3);
    });
  });

  describe("Integration", () => {
    it("should handle complete workflow", async () => {
      const { result } = renderHook(() => useScheduleData(mockMembers, currentYear));

      // 1. Initial state
      expect(result.current.onCall).toEqual([]);
      expect(result.current.onDuty).toEqual([]);

      // 2. Add on-call shifts
      const onCallShifts: OnCallShift[] = [
        { id: "oc1", start: "2024-01-01", end: "2024-01-07", type: "week", assigneeId: "m1" },
      ];

      act(() => {
        result.current.setOnCall(onCallShifts);
      });

      expect(result.current.onCall).toEqual(onCallShifts);

      // 3. Add on-duty shifts
      const onDutyShifts: OnDutyShift[] = [
        { id: "od1", start: "2024-01-15", end: "2024-01-15", assigneeId: "m2" },
      ];

      act(() => {
        result.current.setOnDuty(onDutyShifts);
      });

      expect(result.current.onDuty).toEqual(onDutyShifts);

      // 4. Verify persistence
      await new Promise((resolve) => setTimeout(resolve, 0));

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.onCall[String(currentYear)]).toEqual(onCallShifts);
      expect(parsed.onDuty[String(currentYear)]).toEqual(onDutyShifts);
    });
  });
});