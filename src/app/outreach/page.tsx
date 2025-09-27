"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Legend } from "@/components/Legend";
import { ClientBoard } from "./ClientBoard";

type Role = { id: string; name: string; colorHex: string; tier: number; isActive: boolean };
type Outreach = { id: string; name: string };

type PersonVM = {
  id: string;
  name: string;
  currentRole?: string | null;
  goal?: { name: string; colorHex?: string | null } | null;
  progress?: string;
  goalId?: string | null;
  ready?: boolean;
  readinessIndex?: number;
  progressPct?: number;
};

export default function OutreachBoard() {
  return (
    <main>
      <h1 className="mb-4 text-2xl font-semibold">Outreach Board</h1>
      <Suspense fallback={<div className="text-sm text-slate-500">Loading board…</div>}>
        <BoardContent />
      </Suspense>
    </main>
  );
}

function BoardContent() {
  const searchParams = useSearchParams();
  const [roles, setRoles] = useState<Role[]>([]);
  const [outreaches, setOutreaches] = useState<Outreach[]>([]);
  const [people, setPeople] = useState<PersonVM[]>([]);

  async function load() {
    const query = searchParams.toString();
    const res = await fetch(query ? `/api/board?${query}` : "/api/board");
    if (!res.ok) return;
    const data = await res.json();
    setRoles(data.roles ?? []);
    setOutreaches(data.outreaches ?? []);
    setPeople(data.people ?? []);
  }

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("data-updated", handler);
    return () => window.removeEventListener("data-updated", handler);
  }, [searchParams]);

  return (
    <div>
      <Legend roles={roles} />
      <div className="mt-4">
        <ClientBoard people={people} outreaches={outreaches} />
      </div>
    </div>
  );
}
