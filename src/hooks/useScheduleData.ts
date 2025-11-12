import { useState, useMemo, useEffect } from "react";
import { isWeekend, isDateInRange } from "@/utils/schedule-utils";

export interface Member {
  id: string;
  fullName: string;
  email: string;
  role: string;
  avatar?: string;
  team?: string;
}

export interface OnCallShift {
  id: string;
  start: string;
  end: string;
  type: "week" | "weekend";
  assigneeId: string;
  called?: boolean;
}

export interface OnDutyShift {
  id: string;
  start: string;
  end: string;
  assigneeId: string;
  notes?: string;
}

interface ScheduleStore {
  onCall: Record<string, OnCallShift[]>;
  onDuty: Record<string, OnDutyShift[]>;
}

const STORAGE_KEY = "scheduleData";

function loadFromStorage(): ScheduleStore {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { onCall: {}, onDuty: {} };
  } catch {
    return { onCall: {}, onDuty: {} };
  }
}

function saveToStorage(data: ScheduleStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useScheduleData(members: Member[], year: number) {
  const [store, setStore] = useState<ScheduleStore>(loadFromStorage);
  
  // Auto-save to localStorage
  useEffect(() => {
    saveToStorage(store);
  }, [store]);

  const membersById = useMemo(() => 
    Object.fromEntries(members.map(m => [m.id, m])), 
    [members]
  );

  const onCall = store.onCall[String(year)] || [];
  const onDuty = store.onDuty[String(year)] || [];

  const setOnCall = (shifts: OnCallShift[]) => {
    setStore(prev => ({
      ...prev,
      onCall: { ...prev.onCall, [String(year)]: shifts }
    }));
  };

  const setOnDuty = (shifts: OnDutyShift[]) => {
    setStore(prev => ({
      ...prev,
      onDuty: { ...prev.onDuty, [String(year)]: shifts }
    }));
  };

  const todayAssignments = useMemo(() => {
    const today = new Date();

    // Find day shift
    const dayShift = onDuty.find(shift => 
      isDateInRange(today, shift.start, shift.end)
    );

    // Find night shift
    const nightShift = onCall.find(shift => {
      const inRange = isDateInRange(today, shift.start, shift.end);
      const isCorrectType = isWeekend(today) ? shift.type === "weekend" : shift.type === "week";
      return inRange && isCorrectType;
    });

    return {
      dayMember: dayShift ? membersById[dayShift.assigneeId] : undefined,
      nightMember: nightShift ? membersById[nightShift.assigneeId] : undefined,
    };
  }, [onDuty, onCall, membersById]);

  return {
    onCall,
    onDuty,
    setOnCall,
    setOnDuty,
    todayAssignments,
    membersById,
  };
}
