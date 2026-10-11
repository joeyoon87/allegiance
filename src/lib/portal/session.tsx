"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, clearSessionToken, getSessionToken, setSessionToken } from "@/lib/api";

export type Membership = {
  facilityId: string;
  facilityName: string;
  role: "FACILITY_ADMIN" | "FACILITY_SCHEDULER" | "FACILITY_VIEWER";
};

export type PortalUser = { id: string; name: string; email: string };

type SessionState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: PortalUser; memberships: Membership[] };

const ACTIVE_FACILITY_KEY = "allegiance_active_facility";

type Ctx = {
  state: SessionState;
  activeFacilityId: string | null;
  setActiveFacilityId: (id: string) => void;
  activeMembership: Membership | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const PortalSessionContext = createContext<Ctx | null>(null);

export function PortalSessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: "loading" });
  const [activeFacilityId, setActiveFacilityIdState] = useState<string | null>(null);

  const load = useCallback(() => {
    const token = getSessionToken();
    if (!token) {
      return Promise.resolve().then(() => setState({ status: "unauthenticated" }));
    }
    return apiFetch<{ user: PortalUser; memberships: Membership[] }>("/auth/me", { auth: true }).then(
      (data) => {
        setState({ status: "authenticated", user: data.user, memberships: data.memberships });
        const stored = typeof window !== "undefined" ? window.localStorage.getItem(ACTIVE_FACILITY_KEY) : null;
        const valid = data.memberships.find((m) => m.facilityId === stored);
        setActiveFacilityIdState((valid ?? data.memberships[0])?.facilityId ?? null);
      },
      () => {
        clearSessionToken();
        setState({ status: "unauthenticated" });
      },
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function setActiveFacilityId(id: string) {
    setActiveFacilityIdState(id);
    window.localStorage.setItem(ACTIVE_FACILITY_KEY, id);
  }

  async function login(email: string, password: string) {
    const data = await apiFetch<{ token: string; user: PortalUser; memberships: Membership[] }>("/auth/login", {
      body: { email, password },
    });
    setSessionToken(data.token);
    setState({ status: "authenticated", user: data.user, memberships: data.memberships });
    setActiveFacilityId(data.memberships[0]?.facilityId ?? "");
  }

  function logout() {
    clearSessionToken();
    window.localStorage.removeItem(ACTIVE_FACILITY_KEY);
    setState({ status: "unauthenticated" });
  }

  const activeMembership =
    state.status === "authenticated" ? state.memberships.find((m) => m.facilityId === activeFacilityId) ?? null : null;

  return (
    <PortalSessionContext.Provider
      value={{ state, activeFacilityId, setActiveFacilityId, activeMembership, login, logout, refresh: load }}
    >
      {children}
    </PortalSessionContext.Provider>
  );
}

export function usePortalSession() {
  const ctx = useContext(PortalSessionContext);
  if (!ctx) throw new Error("usePortalSession must be used within PortalSessionProvider");
  return ctx;
}

/** Drop into any /portal/(app) page: redirects to login if not authenticated. */
export function usePortalGuard() {
  const { state } = usePortalSession();
  const router = useRouter();

  useEffect(() => {
    if (state.status === "unauthenticated") {
      router.replace("/portal/login");
    }
  }, [state.status, router]);

  return state;
}

export function canCreateRides(role: Membership["role"]) {
  return role === "FACILITY_ADMIN" || role === "FACILITY_SCHEDULER";
}
