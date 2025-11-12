import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Member } from "@/hooks/useScheduleData";
import { useScheduleData } from "@/hooks/useScheduleData";
import { useScheduleExcel } from "@/hooks/useScheduleExcel";
import { OnDuty } from "./OnDuty";
import { OnCall } from "./OnCall";
import { ScheduleHeader } from "./ScheduleHeader";

function YearPicker({ year, setYear }: { year: number; setYear: (y: number) => void }) {
  const years = [2025];
  return (
    <div className="w-28">
      <Select value={String(year)} onValueChange={(v)=>setYear(parseInt(v))}>
        <SelectTrigger>
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {years.map(y => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface OnDutyScheduleProps {
  members: Member[];
  year: number;
  setYear: (year: number) => void;
}

export function OnDutySchedule({ members, year, setYear }: OnDutyScheduleProps) {
  const scheduleData = useScheduleData(members, year);
  const excelOperations = useScheduleExcel(
    members,
    year,
    scheduleData.onCall,
    scheduleData.onDuty,
    scheduleData.setOnCall,
    scheduleData.setOnDuty
  );

  const [showOnCall, setShowOnCall] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const uploadTypeRef = useRef<"oncall" | "onduty">("oncall");
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function handleUploadConfirm() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const t = uploadTypeRef.current;
    if (t === "oncall") await excelOperations.importOnCallFromExcel(file);
    if (t === "onduty") await excelOperations.importOnDutyFromExcel(file);
    setUploadOpen(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const scheduleActions = {
    exportOnCallToExcel: excelOperations.exportOnCallToExcel,
    exportOnDutyToExcel: excelOperations.exportOnDutyToExcel,
    undo: () => {}, // Simplified - removed undo for now
    canUndo: false,
    save: () => {}, // Auto-saves via useScheduleData
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Schedule</h3>
        <YearPicker year={year} setYear={setYear} />
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{showOnCall ? "On Call" : "On Duty"} for {year}</CardTitle>
          <ScheduleHeader
            actions={scheduleActions}
            showOnCall={showOnCall}
            setShowOnCall={setShowOnCall}
            uploadOpen={uploadOpen}
            setUploadOpen={setUploadOpen}
            uploadTypeRef={uploadTypeRef}
            fileRef={fileRef}
            handleUploadConfirm={handleUploadConfirm}
          />
        </CardHeader>
        <CardContent>
          {!showOnCall ? (
            <OnDuty 
              shifts={scheduleData.onDuty} 
              members={members} 
              onUpdateShifts={scheduleData.setOnDuty} 
            />
          ) : (
            <OnCall 
              shifts={scheduleData.onCall} 
              members={members} 
              onUpdateShifts={scheduleData.setOnCall} 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
