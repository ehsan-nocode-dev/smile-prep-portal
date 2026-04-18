import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import {
  initialMembers,
  initialSubmissions,
  initialTasks,
  Member,
  Submission,
  SubmissionStatus,
  Task,
} from "./mock-data";

interface StoreContextValue {
  tasks: Task[];
  members: Member[];
  submissions: Submission[];
  currentUserId: string;
  setCurrentUserId: (id: string) => void;
  addTask: (t: Omit<Task, "id">) => void;
  updateTask: (id: string, t: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addMember: (m: Omit<Member, "id" | "joined">) => void;
  updateMember: (id: string, m: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  addSubmission: (s: Omit<Submission, "id" | "date" | "status">) => void;
  updateSubmissionStatus: (id: string, status: SubmissionStatus, reviewer: string) => void;
  updateSubmissionQuantity: (id: string, qty: number) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [currentUserId, setCurrentUserId] = useState<string>("m1");

  const value = useMemo<StoreContextValue>(() => ({
    tasks, members, submissions, currentUserId, setCurrentUserId,
    addTask: (t) => setTasks((p) => [...p, { ...t, id: `t${Date.now()}` }]),
    updateTask: (id, t) => setTasks((p) => p.map((x) => (x.id === id ? { ...x, ...t } : x))),
    deleteTask: (id) => setTasks((p) => p.filter((x) => x.id !== id)),
    addMember: (m) => setMembers((p) => [...p, { ...m, id: `m${Date.now()}`, joined: new Date().toISOString().split("T")[0] }]),
    updateMember: (id, m) => setMembers((p) => p.map((x) => (x.id === id ? { ...x, ...m } : x))),
    deleteMember: (id) => setMembers((p) => p.filter((x) => x.id !== id)),
    addSubmission: (s) => setSubmissions((p) => [
      ...p,
      { ...s, id: `s${Date.now()}`, date: new Date().toISOString().split("T")[0], status: "Pending" as const },
    ]),
    updateSubmissionStatus: (id, status, reviewer) => setSubmissions((p) =>
      p.map((x) => (x.id === id ? { ...x, status, reviewedBy: reviewer, reviewedDate: new Date().toISOString().split("T")[0] } : x))
    ),
    updateSubmissionQuantity: (id, qty) => setSubmissions((p) => p.map((x) => x.id === id ? { ...x, quantity: qty } : x)),
  }), [tasks, members, submissions, currentUserId]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
