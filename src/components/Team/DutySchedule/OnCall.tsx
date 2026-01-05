import { TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ScheduleTable } from "./ScheduleTable";
import { OnCallShift, Member } from "@/hooks/useScheduleData";
import { splitDateRange, toISODate, getWeekFromDate } from "@/utils/schedule-utils";

interface OnCallProps {
  shifts: OnCallShift[];
  members: Member[];
  onUpdateShifts: (shifts: OnCallShift[]) => void;
}

export function OnCall({ shifts, members, onUpdateShifts }: OnCallProps) {
  const updateShift = (id: string, updates: Partial<OnCallShift>) => {
    onUpdateShifts(shifts.map(shift => 
      shift.id === id ? { ...shift, ...updates } : shift
    ));
  };

  const addShift = () => {
    const today = toISODate(new Date());
    const endDate = getWeekFromDate(today);
    const newShift: OnCallShift = {
      id: `oc_${Date.now()}`,
      start: today,
      end: endDate,
      type: "week",
      assigneeId: members[0]?.id || "",
      called: false,
    };
    onUpdateShifts([...shifts, newShift]);
  };

  const addShiftAfter = (afterId: string) => {
    const afterShift = shifts.find(s => s.id === afterId);
    const startDate = afterShift?.end || toISODate(new Date());
    const endDate = getWeekFromDate(startDate);
    
    const newShift: OnCallShift = {
      id: `oc_${Date.now()}`,
      start: startDate,
      end: endDate,
      type: "week",
      assigneeId: members[0]?.id || "",
      called: false,
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

  const renderExtraColumns = (shift: OnCallShift) => [
    <TableCell key="called">
      <Checkbox 
        checked={!!shift.called} 
        onCheckedChange={(checked) => updateShift(shift.id, { called: !!checked })} 
      />
    </TableCell>
  ];

  return (
    <ScheduleTable
      shifts={shifts}
      members={members}
      headers={["Start", "End", "Type", "Assignee", "Days", "Called?"]}
      onUpdateShift={updateShift}
      onAddShift={addShift}
      onAddShiftAfter={addShiftAfter}
      onSplitShift={splitShift}
      onDeleteShift={deleteShift}
      renderExtraColumns={renderExtraColumns}
      emptyMessage="No on call assignments yet."
    />
  );
}
