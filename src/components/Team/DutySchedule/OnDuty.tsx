import { TableCell } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ScheduleTable } from "./ScheduleTable";
import { OnDutyShift, Member } from "@/hooks/useScheduleData";
import { splitDateRange, toISODate, getNextDay } from "@/utils/schedule-utils";

interface OnDutyProps {
  shifts: OnDutyShift[];
  members: Member[];
  onUpdateShifts: (shifts: OnDutyShift[]) => void;
}

export function OnDuty({ shifts, members, onUpdateShifts }: OnDutyProps) {
  const updateShift = (id: string, updates: Partial<OnDutyShift>) => {
    onUpdateShifts(shifts.map(shift => 
      shift.id === id ? { ...shift, ...updates } : shift
    ));
  };

  const addShift = () => {
    const today = toISODate(new Date());
    const tomorrow = getNextDay(today);
    const newShift: OnDutyShift = {
      id: `od_${Date.now()}`,
      start: today,
      end: tomorrow,
      assigneeId: members[0]?.id || "",
      notes: "",
    };
    onUpdateShifts([...shifts, newShift]);
  };

  const addShiftAfter = (afterId: string) => {
    const afterShift = shifts.find(s => s.id === afterId);
    const startDate = afterShift?.end || toISODate(new Date());
    const endDate = getNextDay(startDate);
    
    const newShift: OnDutyShift = {
      id: `od_${Date.now()}`,
      start: startDate,
      end: endDate,
      assigneeId: members[0]?.id || "",
      notes: "",
    };

    const afterIndex = shifts.findIndex(s => s.id === afterId);
    const newShifts = [...shifts];
    newShifts.splice(afterIndex + 1, 0, newShift);
    onUpdateShifts(newShifts);
  };

  const splitShift = (id: string) => {
    const shift = shifts.find(s => s.id === id);
    if (!shift) return;

    const { first, second } = splitDateRange(shift.start, shift.end);
    const shiftA = { ...shift, id: `${shift.id}_a`, ...first };
    const shiftB = { ...shift, id: `${shift.id}_b`, ...second };

    onUpdateShifts(shifts.flatMap(s => s.id === id ? [shiftA, shiftB] : [s]));
  };

  const deleteShift = (id: string) => {
    onUpdateShifts(shifts.filter(s => s.id !== id));
  };

  const renderExtraColumns = (shift: OnDutyShift) => [
    <TableCell key="notes">
      <Textarea 
        placeholder="Enter notes..." 
        value={shift.notes || ""} 
        onChange={(e) => updateShift(shift.id, { notes: e.target.value })}
        className="min-h-[60px] resize-none"
      />
    </TableCell>
  ];

  return (
    <ScheduleTable
      shifts={shifts}
      members={members}
      headers={["Start", "End", "Type", "Assignee", "Days", "Notes"]}
      onUpdateShift={updateShift}
      onAddShift={addShift}
      onAddShiftAfter={addShiftAfter}
      onSplitShift={splitShift}
      onDeleteShift={deleteShift}
      renderExtraColumns={renderExtraColumns}
      emptyMessage="No on duty assignments yet."
    />
  );
}
