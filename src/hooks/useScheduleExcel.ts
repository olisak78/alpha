import * as XLSX from "xlsx";
import { OnCallShift, OnDutyShift, Member } from "./useScheduleData";

export function useScheduleExcel(
  members: Member[],
  year: number,
  onCall: OnCallShift[],
  onDuty: OnDutyShift[],
  setOnCall: (shifts: OnCallShift[]) => void,
  setOnDuty: (shifts: OnDutyShift[]) => void
) {
  const membersById = Object.fromEntries(members.map(m => [m.id, m]));
  const membersByEmail = Object.fromEntries(
    members.map(m => [m.email?.toLowerCase(), m])
  );

  const exportOnCallToExcel = () => {
    const rows = onCall.map(shift => ({
      start: shift.start,
      end: shift.end,
      type: shift.type,
      assigneeEmail: membersById[shift.assigneeId]?.email || shift.assigneeId,
      called: shift.called ? "yes" : "no",
    }));
    
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `OnCall_${year}`);
    XLSX.writeFile(wb, `on-call-${year}.xlsx`);
  };

  const exportOnDutyToExcel = () => {
    const rows = onDuty.map(shift => ({
      start: shift.start,
      end: shift.end,
      assigneeEmail: membersById[shift.assigneeId]?.email || shift.assigneeId,
      notes: shift.notes || "",
    }));
    
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `OnDuty_${year}`);
    XLSX.writeFile(wb, `on-duty-${year}.xlsx`);
  };

  const importOnCallFromExcel = async (file: File) => {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json: any[] = XLSX.utils.sheet_to_json(sheet);
    
    const parsed: OnCallShift[] = json.map((row, idx) => {
      const email = String(row.assigneeEmail || "").toLowerCase();
      const member = membersByEmail[email];
      
      return {
        id: `oc_${Date.now()}_${idx}`,
        start: String(row.start).slice(0, 10),
        end: String(row.end).slice(0, 10),
        type: String(row.type).toLowerCase() === "weekend" ? "weekend" : "week",
        assigneeId: member?.id || String(row.assigneeId || ""),
        called: String(row.called || "no").toLowerCase().startsWith("y"),
      };
    });
    
    setOnCall(parsed);
  };

  const importOnDutyFromExcel = async (file: File) => {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json: any[] = XLSX.utils.sheet_to_json(sheet);
    
    const parsed: OnDutyShift[] = json.map((row, idx) => {
      const email = String(row.assigneeEmail || "").toLowerCase();
      const member = membersByEmail[email];
      
      return {
        id: `od_${Date.now()}_${idx}`,
        start: String(row.start).slice(0, 10),
        end: String(row.end).slice(0, 10),
        assigneeId: member?.id || String(row.assigneeId || ""),
        notes: String(row.notes || ""),
      };
    });
    
    setOnDuty(parsed);
  };

  return {
    exportOnCallToExcel,
    exportOnDutyToExcel,
    importOnCallFromExcel,
    importOnDutyFromExcel,
  };
}
