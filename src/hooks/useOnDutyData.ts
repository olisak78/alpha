import { useEffect, useMemo, useState, useRef } from "react";
import teamData from "@/data/team/my-team.json";
import * as XLSX from "xlsx";

export type Member = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  iuser?: string;
  avatar?: string;
  team?: string;
  team_id?: string; // Add team_id property for API compatibility
  uuid?: string; // Add uuid property for API operations
  mobile?: string;
};

export type OnCallShift = {
  id: string;
  start: string;
  end: string;
  type: "week" | "weekend";
  assigneeId: string;
  called?: boolean;
};

export type OnDutyShift = {
  id: string;
  date?: string;
  start?: string;
  end?: string;
  assigneeId: string;
  notes?: string;
};

type Store = {
  onCall: Record<string, OnCallShift[]>; // key: year
  onDuty: Record<string, OnDutyShift[]>; // key: year
};

const STORAGE_BASE = "onDutyStore";
const MAX_HISTORY_SIZE = 10;

function loadStore(key: string): Store {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { onCall: {}, onDuty: {} };
    return JSON.parse(raw) as Store;
  } catch {
    return { onCall: {}, onDuty: {} };
  }
}

function saveStore(key: string, store: Store) {
  localStorage.setItem(key, JSON.stringify(store));
}

export function useOnDutyData(teamKey?: string, customMembers?: Member[]) {
  const storageKey = teamKey ? `${STORAGE_BASE}:${teamKey}` : STORAGE_BASE;
  const [store, setStore] = useState<Store>(() => loadStore(storageKey));
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [history, setHistory] = useState<Store[]>([]);
  
  // Use refs to track previous state and debounce timer
  const historyTimeoutRef = useRef<NodeJS.Timeout>();

  // persist
  useEffect(() => {
    saveStore(storageKey, store);
  }, [store, storageKey]);

  // Add to history when store changes (for undo functionality)
  // Debounced to prevent excessive memory usage
  useEffect(() => {
    if (historyTimeoutRef.current) {
      clearTimeout(historyTimeoutRef.current);
    }

    historyTimeoutRef.current = setTimeout(() => {
      setHistory(prev => {
        // Only add if different from last entry
        const lastEntry = prev[prev.length - 1];
        if (lastEntry && JSON.stringify(lastEntry) === JSON.stringify(store)) {
          return prev;
        }
        
        const newHistory = [...prev, JSON.parse(JSON.stringify(store))];
        return newHistory.slice(-MAX_HISTORY_SIZE);
      });
    }, 300);

    return () => {
      if (historyTimeoutRef.current) {
        clearTimeout(historyTimeoutRef.current);
      }
    };
  }, [store]);

  const members = useMemo<Member[]>(() => (customMembers && customMembers.length ? customMembers : (teamData.members as Member[])) || [], [customMembers]);
  const membersById = useMemo(() => Object.fromEntries(members.map(m => [m.id, m])), [members]);
  const membersByEmail = useMemo(() => Object.fromEntries(members.map(m => [m.email?.toLowerCase(), m])), [members]);

  const onCall = store.onCall[String(year)] || [];
  const onDuty = store.onDuty[String(year)] || [];

  const setOnCall = (rows: OnCallShift[]) => setStore(s => ({ ...s, onCall: { ...s.onCall, [String(year)]: rows } }));
  const setOnDuty = (rows: OnDutyShift[]) => setStore(s => ({ ...s, onDuty: { ...s.onDuty, [String(year)]: rows } }));

  // Undo functionality
  const undo = () => {
    if (history.length > 1) {
      const previousState = history[history.length - 2];
      setStore(previousState);
      setHistory(prev => prev.slice(0, -1));
    }
  };

  // Save functionality (force persist to localStorage)
  const save = () => {
    saveStore(storageKey, store);
  };

  const canUndo = history.length > 1;

  function toISODate(d: Date) {
    return d.toISOString().slice(0, 10);
  }

  function isWeekend(d: Date) {
    const day = d.getDay();
    return day === 0 || day === 6;
  }

  const todayAssignments = useMemo(() => {
    const today = new Date();
    const todayStr = toISODate(today);

    // Day-hours from OnDuty (exact date match or within date range)
    const dayShift = onDuty.find(r => {
      if (r.date === todayStr) return true;
      if (r.start && r.end) {
        return todayStr >= r.start && todayStr <= r.end;
      }
      if (r.start === todayStr) return true;
      return false;
    });

    // Night-hours from OnCall
    const inRange = (row: OnCallShift) => todayStr >= row.start && todayStr <= row.end;
    let nightShift: OnCallShift | undefined;
    if (isWeekend(today)) {
      nightShift = onCall.find(r => r.type === "weekend" && inRange(r));
    } else {
      nightShift = onCall.find(r => r.type === "week" && inRange(r));
    }

    return {
      dayMember: dayShift ? membersById[dayShift.assigneeId] : undefined,
      nightMember: nightShift ? membersById[nightShift.assigneeId] : undefined,
    };
  }, [onDuty, onCall, membersById]);

  // Excel helpers
  function exportOnCallToExcel() {
    const rows = onCall.map(r => ({
      start: r.start,
      end: r.end,
      type: r.type,
      assigneeEmail: membersById[r.assigneeId]?.email || r.assigneeId,
      called: r.called ? "yes" : "no",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `OnCall_${year}`);
    XLSX.writeFile(wb, `on-call-${year}.xlsx`);
  }

  async function importOnCallFromExcel(file: File) {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json: any[] = XLSX.utils.sheet_to_json(sheet);
    const parsed: OnCallShift[] = json.map((r, idx) => {
      const email = String(r.assigneeEmail || "").toLowerCase();
      const m = membersByEmail[email];
      return {
        id: `oc_${Date.now()}_${idx}`,
        start: String(r.start).slice(0, 10),
        end: String(r.end).slice(0, 10),
        type: (String(r.type).toLowerCase() === "weekend" ? "weekend" : "week") as "week" | "weekend",
        assigneeId: m?.id || String(r.assigneeId || ""),
        called: String(r.called || "no").toLowerCase().startsWith("y"),
      };
    });
    setOnCall(parsed);
  }

  function exportOnDutyToExcel() {
    const rows = onDuty.map(r => ({
      start: r.start || r.date || "",
      end: r.end || "",
      assigneeEmail: membersById[r.assigneeId]?.email || r.assigneeId,
      notes: r.notes || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `OnDuty_${year}`);
    XLSX.writeFile(wb, `on-duty-${year}.xlsx`);
  }

  async function importOnDutyFromExcel(file: File) {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json: any[] = XLSX.utils.sheet_to_json(sheet);
    const parsed: OnDutyShift[] = json.map((r, idx) => {
      const email = String(r.assigneeEmail || "").toLowerCase();
      const m = membersByEmail[email];
      return {
        id: `od_${Date.now()}_${idx}`,
        start: String(r.start || r.date || "").slice(0, 10),
        end: String(r.end || "").slice(0, 10),
        assigneeId: m?.id || String(r.assigneeId || ""),
        notes: String(r.notes || ""),
        // Keep backward compatibility
        date: String(r.date || r.start || "").slice(0, 10),
      };
    });
    setOnDuty(parsed);
  }

  return {
    year,
    setYear,
    members,
    membersById,
    onCall,
    setOnCall,
    onDuty,
    setOnDuty,
    todayAssignments,
    exportOnCallToExcel,
    importOnCallFromExcel,
    exportOnDutyToExcel,
    importOnDutyFromExcel,
    undo,
    canUndo,
    save,
  } as const;
}
