import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { useStore } from "@/lib/store";

export type Clinic = {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  status: "Active" | "Inactive";
  adminName: string;
  adminEmail: string;
  createdAt: string;
  isOwnClinic?: boolean;
};

export type EmailOwner = { kind: "member" | "clinicAdmin"; clinicId: string } | null;

interface ClinicsContextValue {
  clinics: Clinic[];
  addClinic: (c: Omit<Clinic, "id" | "createdAt" | "status">) => void;
  updateClinic: (id: string, c: Partial<Pick<Clinic, "name" | "address" | "phone">>) => void;
  replaceAdmin: (id: string, adminName: string, adminEmail: string) => void;
  setStatus: (id: string, status: Clinic["status"]) => void;
  findEmailOwner: (email: string) => EmailOwner;
}

const ClinicsContext = createContext<ClinicsContextValue | null>(null);

export function ClinicsProvider({ children }: { children: ReactNode }) {
  const { members } = useStore();
  const [clinics, setClinics] = useState<Clinic[]>(() => {
    const admin = members.find((m) => m.role === "Admin");
    return [
      {
        id: "c1", name: "Molar Masters (Elan)", address: "12 Harley Street, London W1G 9PG",
        status: "Active", adminName: admin?.name ?? "Elan", adminEmail: admin?.email ?? "admin@molarup.com",
        createdAt: "2024-01-15T09:00:00.000Z", isOwnClinic: true,
      },
      {
        id: "c2", name: "Bright Smile Dental", address: "48 King Street, Manchester M2 4LY",
        status: "Active", adminName: "Sarah Patel", adminEmail: "sarah@brightsmile.co.uk",
        createdAt: "2025-03-02T10:30:00.000Z",
      },
      {
        id: "c3", name: "Riverside Family Dentistry", address: "7 Quayside, Newcastle NE1 3DX",
        status: "Inactive", adminName: "James O'Connor", adminEmail: "james@riversidedental.co.uk",
        createdAt: "2025-08-20T14:00:00.000Z",
      },
    ];
  });

  const ownId = clinics.find((c) => c.isOwnClinic)?.id ?? "";

  const findEmailOwner = useCallback((email: string): EmailOwner => {
    const e = email.trim().toLowerCase();
    if (!e) return null;
    const c = clinics.find((x) => x.adminEmail.toLowerCase() === e);
    if (c) return { kind: "clinicAdmin", clinicId: c.id };
    if (members.some((m) => m.email.toLowerCase() === e)) return { kind: "member", clinicId: ownId };
    return null;
  }, [clinics, members, ownId]);

  const value = useMemo<ClinicsContextValue>(() => ({
    clinics,
    addClinic: (c) => setClinics((p) => [...p, { ...c, id: `c${Date.now()}`, status: "Active", createdAt: new Date().toISOString() }]),
    updateClinic: (id, c) => setClinics((p) => p.map((x) => (x.id === id ? { ...x, ...c } : x))),
    replaceAdmin: (id, adminName, adminEmail) => setClinics((p) => p.map((x) => (x.id === id ? { ...x, adminName, adminEmail } : x))),
    setStatus: (id, status) => setClinics((p) => p.map((x) => (x.id === id ? { ...x, status } : x))),
    findEmailOwner,
  }), [clinics, findEmailOwner]);

  return <ClinicsContext.Provider value={value}>{children}</ClinicsContext.Provider>;
}

export function useClinics() {
  const ctx = useContext(ClinicsContext);
  if (!ctx) throw new Error("useClinics must be used within ClinicsProvider");
  return ctx;
}
