import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScheduleExcel, type Member, type OnCallShift, type OnDutyShift } from "@/hooks/useScheduleExcel";
import * as XLSX from "xlsx";

// Mock XLSX
vi.mock("xlsx", () => ({
  default: {
    utils: {
      json_to_sheet: vi.fn(),
      book_new: vi.fn(),
      book_append_sheet: vi.fn(),
      sheet_to_json: vi.fn(),
    },
    writeFile: vi.fn(),
    read: vi.fn(),
  },
  utils: {
    json_to_sheet: vi.fn(),
    book_new: vi.fn(),
    book_append_sheet: vi.fn(),
    sheet_to_json: vi.fn(),
  },
  writeFile: vi.fn(),
  read: vi.fn(),
}));

// Helper function to create a mock file with arrayBuffer method
function createMockFile(filename: string, arrayBuffer: ArrayBuffer) {
  const file = new File([""], filename, { 
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
  });
  
  // Add arrayBuffer method to the file instance
  Object.defineProperty(file, 'arrayBuffer', {
    value: vi.fn().mockResolvedValue(arrayBuffer),
    writable: true,
    configurable: true,
  });
  
  return file;
}

describe("useScheduleExcel", () => {
  const mockMembers: Member[] = [
    { id: "m1", fullName: "Alice Smith", email: "alice@example.com", role: "Engineer" },
    { id: "m2", fullName: "Bob Jones", email: "bob@example.com", role: "Manager" },
    { id: "m3", fullName: "Carol White", email: "carol@example.com", role: "Designer" },
  ];

  const mockOnCall: OnCallShift[] = [
    { id: "oc1", start: "2024-01-01", end: "2024-01-07", type: "week", assigneeId: "m1", called: true },
    { id: "oc2", start: "2024-01-08", end: "2024-01-14", type: "weekend", assigneeId: "m2", called: false },
  ];

  const mockOnDuty: OnDutyShift[] = [
    { id: "od1", start: "2024-01-15", end: "2024-01-15", assigneeId: "m1", notes: "Special shift" },
    { id: "od2", start: "2024-01-16", end: "2024-01-16", assigneeId: "m2" },
  ];

  const mockSetOnCall = vi.fn();
  const mockSetOnDuty = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("exportOnCallToExcel", () => {
    it("should export on-call shifts to Excel", () => {
      const mockWorksheet = {};
      const mockWorkbook = {};

      vi.mocked(XLSX.utils.json_to_sheet).mockReturnValue(mockWorksheet as any);
      vi.mocked(XLSX.utils.book_new).mockReturnValue(mockWorkbook as any);

      const { result } = renderHook(() =>
        useScheduleExcel(mockMembers, 2024, mockOnCall, mockOnDuty, mockSetOnCall, mockSetOnDuty)
      );

      act(() => {
        result.current.exportOnCallToExcel();
      });

      // Verify json_to_sheet was called with correct data
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([
        {
          start: "2024-01-01",
          end: "2024-01-07",
          type: "week",
          assigneeEmail: "alice@example.com",
          called: "yes",
        },
        {
          start: "2024-01-08",
          end: "2024-01-14",
          type: "weekend",
          assigneeEmail: "bob@example.com",
          called: "no",
        },
      ]);

      // Verify workbook was created
      expect(XLSX.utils.book_new).toHaveBeenCalled();

      // Verify sheet was appended
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
        mockWorkbook,
        mockWorksheet,
        "OnCall_2024"
      );

      // Verify file was written
      expect(XLSX.writeFile).toHaveBeenCalledWith(mockWorkbook, "on-call-2024.xlsx");
    });

    it("should handle shifts with unknown assignee", () => {
      const shiftsWithUnknown: OnCallShift[] = [
        { id: "oc1", start: "2024-01-01", end: "2024-01-07", type: "week", assigneeId: "unknown-id" },
      ];

      vi.mocked(XLSX.utils.json_to_sheet).mockReturnValue({} as any);
      vi.mocked(XLSX.utils.book_new).mockReturnValue({} as any);

      const { result } = renderHook(() =>
        useScheduleExcel(mockMembers, 2024, shiftsWithUnknown, [], mockSetOnCall, mockSetOnDuty)
      );

      act(() => {
        result.current.exportOnCallToExcel();
      });

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([
        {
          start: "2024-01-01",
          end: "2024-01-07",
          type: "week",
          assigneeEmail: "unknown-id",
          called: "no",
        },
      ]);
    });

    it("should export with different year in filename", () => {
      const mockWorkbook = {};
      vi.mocked(XLSX.utils.json_to_sheet).mockReturnValue({} as any);
      vi.mocked(XLSX.utils.book_new).mockReturnValue(mockWorkbook as any);

      const { result } = renderHook(() =>
        useScheduleExcel(mockMembers, 2025, mockOnCall, mockOnDuty, mockSetOnCall, mockSetOnDuty)
      );

      act(() => {
        result.current.exportOnCallToExcel();
      });

      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        "OnCall_2025"
      );
      expect(XLSX.writeFile).toHaveBeenCalledWith(mockWorkbook, "on-call-2025.xlsx");
    });

    it("should handle empty shifts array", () => {
      vi.mocked(XLSX.utils.json_to_sheet).mockReturnValue({} as any);
      vi.mocked(XLSX.utils.book_new).mockReturnValue({} as any);

      const { result } = renderHook(() =>
        useScheduleExcel(mockMembers, 2024, [], mockOnDuty, mockSetOnCall, mockSetOnDuty)
      );

      act(() => {
        result.current.exportOnCallToExcel();
      });

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([]);
    });
  });

  describe("exportOnDutyToExcel", () => {
    it("should export on-duty shifts to Excel", () => {
      const mockWorksheet = {};
      const mockWorkbook = {};

      vi.mocked(XLSX.utils.json_to_sheet).mockReturnValue(mockWorksheet as any);
      vi.mocked(XLSX.utils.book_new).mockReturnValue(mockWorkbook as any);

      const { result } = renderHook(() =>
        useScheduleExcel(mockMembers, 2024, mockOnCall, mockOnDuty, mockSetOnCall, mockSetOnDuty)
      );

      act(() => {
        result.current.exportOnDutyToExcel();
      });

      // Verify json_to_sheet was called with correct data
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([
        {
          start: "2024-01-15",
          end: "2024-01-15",
          assigneeEmail: "alice@example.com",
          notes: "Special shift",
        },
        {
          start: "2024-01-16",
          end: "2024-01-16",
          assigneeEmail: "bob@example.com",
          notes: "",
        },
      ]);

      // Verify workbook was created
      expect(XLSX.utils.book_new).toHaveBeenCalled();

      // Verify sheet was appended
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
        mockWorkbook,
        mockWorksheet,
        "OnDuty_2024"
      );

      // Verify file was written
      expect(XLSX.writeFile).toHaveBeenCalledWith(mockWorkbook, "on-duty-2024.xlsx");
    });

    it("should handle shifts without notes", () => {
      const shiftsWithoutNotes: OnDutyShift[] = [
        { id: "od1", start: "2024-01-15", end: "2024-01-15", assigneeId: "m1" },
      ];

      vi.mocked(XLSX.utils.json_to_sheet).mockReturnValue({} as any);
      vi.mocked(XLSX.utils.book_new).mockReturnValue({} as any);

      const { result } = renderHook(() =>
        useScheduleExcel(mockMembers, 2024, [], shiftsWithoutNotes, mockSetOnCall, mockSetOnDuty)
      );

      act(() => {
        result.current.exportOnDutyToExcel();
      });

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([
        {
          start: "2024-01-15",
          end: "2024-01-15",
          assigneeEmail: "alice@example.com",
          notes: "",
        },
      ]);
    });

    it("should export with different year in filename", () => {
      const mockWorkbook = {};
      vi.mocked(XLSX.utils.json_to_sheet).mockReturnValue({} as any);
      vi.mocked(XLSX.utils.book_new).mockReturnValue(mockWorkbook as any);

      const { result } = renderHook(() =>
        useScheduleExcel(mockMembers, 2025, mockOnCall, mockOnDuty, mockSetOnCall, mockSetOnDuty)
      );

      act(() => {
        result.current.exportOnDutyToExcel();
      });

      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        "OnDuty_2025"
      );
      expect(XLSX.writeFile).toHaveBeenCalledWith(mockWorkbook, "on-duty-2025.xlsx");
    });
  });

  describe("importOnCallFromExcel", () => {
    it("should import on-call shifts from Excel", async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockFile = createMockFile("test.xlsx", mockArrayBuffer);

      const mockSheet = {};
      const mockWorkbook = { Sheets: { Sheet1: mockSheet }, SheetNames: ["Sheet1"] };

      vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([
        {
          start: "2024-01-01",
          end: "2024-01-07",
          type: "week",
          assigneeEmail: "alice@example.com",
          called: "yes",
        },
        {
          start: "2024-01-08",
          end: "2024-01-14",
          type: "weekend",
          assigneeEmail: "BOB@EXAMPLE.COM", // Test case insensitive
          called: "no",
        },
      ]);

      const { result } = renderHook(() =>
        useScheduleExcel(mockMembers, 2024, mockOnCall, mockOnDuty, mockSetOnCall, mockSetOnDuty)
      );

      await act(async () => {
        await result.current.importOnCallFromExcel(mockFile);
      });

      expect(mockSetOnCall).toHaveBeenCalledWith([
        {
          id: expect.stringContaining("oc_"),
          start: "2024-01-01",
          end: "2024-01-07",
          type: "week",
          assigneeId: "m1",
          called: true,
        },
        {
          id: expect.stringContaining("oc_"),
          start: "2024-01-08",
          end: "2024-01-14",
          type: "weekend",
          assigneeId: "m2",
          called: false,
        },
      ]);
    });

    it("should handle unknown email by using raw assigneeId", async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockFile = createMockFile("test.xlsx", mockArrayBuffer);

      const mockSheet = {};
      const mockWorkbook = { Sheets: { Sheet1: mockSheet }, SheetNames: ["Sheet1"] };

      vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([
        {
          start: "2024-01-01",
          end: "2024-01-07",
          type: "week",
          assigneeEmail: "unknown@example.com",
          assigneeId: "fallback-id",
          called: "yes",
        },
      ]);

      const { result } = renderHook(() =>
        useScheduleExcel(mockMembers, 2024, mockOnCall, mockOnDuty, mockSetOnCall, mockSetOnDuty)
      );

      await act(async () => {
        await result.current.importOnCallFromExcel(mockFile);
      });

      expect(mockSetOnCall).toHaveBeenCalledWith([
        {
          id: expect.stringContaining("oc_"),
          start: "2024-01-01",
          end: "2024-01-07",
          type: "week",
          assigneeId: "fallback-id",
          called: true,
        },
      ]);
    });

    it("should parse 'weekend' type correctly", async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockFile = createMockFile("test.xlsx", mockArrayBuffer);

      vi.mocked(XLSX.read).mockReturnValue({
        Sheets: { Sheet1: {} },
        SheetNames: ["Sheet1"],
      } as any);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([
        {
          start: "2024-01-01",
          end: "2024-01-07",
          type: "WEEKEND",
          assigneeEmail: "alice@example.com",
          called: "no",
        },
      ]);

      const { result } = renderHook(() =>
        useScheduleExcel(mockMembers, 2024, mockOnCall, mockOnDuty, mockSetOnCall, mockSetOnDuty)
      );

      await act(async () => {
        await result.current.importOnCallFromExcel(mockFile);
      });

      expect(mockSetOnCall).toHaveBeenCalledWith([
        expect.objectContaining({ type: "weekend" }),
      ]);
    });

    it("should default to 'week' type for non-weekend values", async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockFile = createMockFile("test.xlsx", mockArrayBuffer);

      vi.mocked(XLSX.read).mockReturnValue({
        Sheets: { Sheet1: {} },
        SheetNames: ["Sheet1"],
      } as any);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([
        {
          start: "2024-01-01",
          end: "2024-01-07",
          type: "weekday",
          assigneeEmail: "alice@example.com",
          called: "no",
        },
      ]);

      const { result } = renderHook(() =>
        useScheduleExcel(mockMembers, 2024, mockOnCall, mockOnDuty, mockSetOnCall, mockSetOnDuty)
      );

      await act(async () => {
        await result.current.importOnCallFromExcel(mockFile);
      });

      expect(mockSetOnCall).toHaveBeenCalledWith([
        expect.objectContaining({ type: "week" }),
      ]);
    });

    it("should parse 'called' field correctly", async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockFile = createMockFile("test.xlsx", mockArrayBuffer);

      vi.mocked(XLSX.read).mockReturnValue({
        Sheets: { Sheet1: {} },
        SheetNames: ["Sheet1"],
      } as any);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([
        {
          start: "2024-01-01",
          end: "2024-01-07",
          type: "week",
          assigneeEmail: "alice@example.com",
          called: "YES",
        },
        {
          start: "2024-01-08",
          end: "2024-01-14",
          type: "week",
          assigneeEmail: "bob@example.com",
          called: "No",
        },
      ]);

      const { result } = renderHook(() =>
        useScheduleExcel(mockMembers, 2024, mockOnCall, mockOnDuty, mockSetOnCall, mockSetOnDuty)
      );

      await act(async () => {
        await result.current.importOnCallFromExcel(mockFile);
      });

      const calls = mockSetOnCall.mock.calls[0][0];
      expect(calls[0].called).toBe(true);
      expect(calls[1].called).toBe(false);
    });

    it("should truncate dates to YYYY-MM-DD format", async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockFile = createMockFile("test.xlsx", mockArrayBuffer);

      vi.mocked(XLSX.read).mockReturnValue({
        Sheets: { Sheet1: {} },
        SheetNames: ["Sheet1"],
      } as any);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([
        {
          start: "2024-01-01T12:34:56.789Z",
          end: "2024-01-07T23:59:59.999Z",
          type: "week",
          assigneeEmail: "alice@example.com",
          called: "no",
        },
      ]);

      const { result } = renderHook(() =>
        useScheduleExcel(mockMembers, 2024, mockOnCall, mockOnDuty, mockSetOnCall, mockSetOnDuty)
      );

      await act(async () => {
        await result.current.importOnCallFromExcel(mockFile);
      });

      expect(mockSetOnCall).toHaveBeenCalledWith([
        expect.objectContaining({
          start: "2024-01-01",
          end: "2024-01-07",
        }),
      ]);
    });
  });

  describe("importOnDutyFromExcel", () => {
    it("should import on-duty shifts from Excel", async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockFile = createMockFile("test.xlsx", mockArrayBuffer);

      const mockSheet = {};
      const mockWorkbook = { Sheets: { Sheet1: mockSheet }, SheetNames: ["Sheet1"] };

      vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([
        {
          start: "2024-01-15",
          end: "2024-01-15",
          assigneeEmail: "alice@example.com",
          notes: "Important shift",
        },
        {
          start: "2024-01-16",
          end: "2024-01-16",
          assigneeEmail: "bob@example.com",
          notes: "",
        },
      ]);

      const { result } = renderHook(() =>
        useScheduleExcel(mockMembers, 2024, mockOnCall, mockOnDuty, mockSetOnCall, mockSetOnDuty)
      );

      await act(async () => {
        await result.current.importOnDutyFromExcel(mockFile);
      });

      expect(mockSetOnDuty).toHaveBeenCalledWith([
        {
          id: expect.stringContaining("od_"),
          start: "2024-01-15",
          end: "2024-01-15",
          assigneeId: "m1",
          notes: "Important shift",
        },
        {
          id: expect.stringContaining("od_"),
          start: "2024-01-16",
          end: "2024-01-16",
          assigneeId: "m2",
          notes: "",
        },
      ]);
    });

    it("should handle case insensitive email matching", async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockFile = createMockFile("test.xlsx", mockArrayBuffer);

      vi.mocked(XLSX.read).mockReturnValue({
        Sheets: { Sheet1: {} },
        SheetNames: ["Sheet1"],
      } as any);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([
        {
          start: "2024-01-15",
          end: "2024-01-15",
          assigneeEmail: "ALICE@EXAMPLE.COM",
          notes: "",
        },
      ]);

      const { result } = renderHook(() =>
        useScheduleExcel(mockMembers, 2024, mockOnCall, mockOnDuty, mockSetOnCall, mockSetOnDuty)
      );

      await act(async () => {
        await result.current.importOnDutyFromExcel(mockFile);
      });

      expect(mockSetOnDuty).toHaveBeenCalledWith([
        expect.objectContaining({ assigneeId: "m1" }),
      ]);
    });

    it("should handle missing notes field", async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockFile = createMockFile("test.xlsx", mockArrayBuffer);

      vi.mocked(XLSX.read).mockReturnValue({
        Sheets: { Sheet1: {} },
        SheetNames: ["Sheet1"],
      } as any);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([
        {
          start: "2024-01-15",
          end: "2024-01-15",
          assigneeEmail: "alice@example.com",
        },
      ]);

      const { result } = renderHook(() =>
        useScheduleExcel(mockMembers, 2024, mockOnCall, mockOnDuty, mockSetOnCall, mockSetOnDuty)
      );

      await act(async () => {
        await result.current.importOnDutyFromExcel(mockFile);
      });

      expect(mockSetOnDuty).toHaveBeenCalledWith([
        expect.objectContaining({ notes: "" }),
      ]);
    });

    it("should truncate dates to YYYY-MM-DD format", async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockFile = createMockFile("test.xlsx", mockArrayBuffer);

      vi.mocked(XLSX.read).mockReturnValue({
        Sheets: { Sheet1: {} },
        SheetNames: ["Sheet1"],
      } as any);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([
        {
          start: "2024-01-15T08:00:00.000Z",
          end: "2024-01-15T17:00:00.000Z",
          assigneeEmail: "alice@example.com",
          notes: "",
        },
      ]);

      const { result } = renderHook(() =>
        useScheduleExcel(mockMembers, 2024, mockOnCall, mockOnDuty, mockSetOnCall, mockSetOnDuty)
      );

      await act(async () => {
        await result.current.importOnDutyFromExcel(mockFile);
      });

      expect(mockSetOnDuty).toHaveBeenCalledWith([
        expect.objectContaining({
          start: "2024-01-15",
          end: "2024-01-15",
        }),
      ]);
    });
  });
});