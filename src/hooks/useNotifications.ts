import { useEffect, useMemo, useState } from "react";
// Commented out mock data import
// import seed from "@/data/team/notifications.json";

export type Notification = {
  id: string;
  title: string;
  message: string;
  createdAt: string; // ISO
  dueDate?: string; // ISO optional
  severity?: "info" | "warning" | "success" | "error";
  readBy: string[]; // user ids
};

const STORAGE_KEY = "portal.notifications.v2";
const EVENT_KEY = "notifications-changed";

function load(): Notification[] {
  // Temporarily return empty array instead of loading mock data
  return [];
  
  // Original code (commented out for now):
  // try {
  //   const raw = localStorage.getItem(STORAGE_KEY);
  //   if (raw) return JSON.parse(raw) as Notification[];
  // } catch {}
  // return (seed as Notification[]);
}

function save(list: Notification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } finally {
    window.dispatchEvent(new CustomEvent(EVENT_KEY));
  }
}

export function bootstrapNotifications() {
  // Temporarily disabled - don't seed mock data
  // const existing = (() => {
  //   try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; }
  // })();
  // if (!existing) save(load());
  
  // Clear any existing notifications in localStorage
  localStorage.removeItem(STORAGE_KEY);
}

export function useNotifications(userId?: string) {
  const [list, setList] = useState<Notification[]>(() => load());

  useEffect(() => {
    // Ensure no mock data is seeded
    bootstrapNotifications();
    setList(load());
  }, []);

  useEffect(() => {
    const onStorage = () => setList(load());
    const onCustom = () => setList(load());
    window.addEventListener("storage", onStorage);
    window.addEventListener(EVENT_KEY, onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(EVENT_KEY, onCustom as EventListener);
    };
  }, []);

  const unreadCount = useMemo(() => {
    // Always return 0 until we connect to real API
    return 0;
    
    // Original code (commented out):
    // if (!userId) return 0;
    // return list.filter((n) => !(n.readBy || []).includes(userId)).length;
  }, [list, userId]);

  const markAllRead = (uid: string) => {
    const next = list.map((n) => ({ ...n, readBy: Array.from(new Set([...(n.readBy || []), uid])) }));
    save(next);
    setList(next);
  };

  const markRead = (id: string, uid: string) => {
    const next = list.map((n) => (n.id === id ? { ...n, readBy: Array.from(new Set([...(n.readBy || []), uid])) } : n));
    save(next);
    setList(next);
  };

  const addNotification = (n: Omit<Notification, "id" | "readBy" | "createdAt"> & { id?: string; createdAt?: string; readBy?: string[] }) => {
    const obj: Notification = {
      id: n.id || "n" + Date.now(),
      createdAt: n.createdAt || new Date().toISOString(),
      dueDate: n.dueDate,
      readBy: n.readBy || [],
      severity: n.severity || "info",
      title: n.title,
      message: n.message,
    };
    const next = [obj, ...list];
    save(next);
    setList(next);
  };

  const clearAll = () => {
    save([]);
    setList([]);
  };

  return { notifications: list, unreadCount, markAllRead, markRead, addNotification, clearAll };
}