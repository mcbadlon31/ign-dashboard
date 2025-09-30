"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Legend } from "@/components/Legend";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
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
    <main className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Outreach Board</h1>
        <p className="mt-1 text-sm text-slate-500">
          Drag and drop people to update goal stages, monitor momentum, and rebalance coaching load.
        </p>
      </div>
      <Suspense fallback={<div className="text-sm text-slate-500">Loading board...</div>}>
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
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const paramsKey = searchParams.toString();

  async function load() {
    try {
      setLoading(true);
      const res = await fetch(paramsKey ? `/api/board?${paramsKey}` : "/api/board");
      if (!res.ok) return;
      const data = await res.json();
      setRoles(data.roles ?? []);
      setOutreaches(data.outreaches ?? []);
      setPeople(data.people ?? []);
      setLastUpdated(new Date().toISOString());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("data-updated", handler);
    return () => window.removeEventListener("data-updated", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  const stats = useMemo(() => {
    const total = people.length;
    const ready = people.filter(person => person.ready).length;
    const withGoal = people.filter(person => person.goal).length;
    const readinessSum = people.reduce((acc, person) => acc + (person.readinessIndex ?? 0), 0);
    const readinessAvg = total ? Math.round(readinessSum / total) : 0;
    return { total, ready, withGoal, readinessAvg };
  }, [people]);

  const activeFilters = useMemo(() => {
    if (!paramsKey) return [] as Array<[string, string]>;
    const result: Array<[string, string]> = [];
    searchParams.forEach((value, key) => {
      if (value) result.push([key, value]);
    });
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <StatPill label="People" value={stats.total} />
          <StatPill label="With active goal" value={stats.withGoal} />
          <StatPill label="Ready" value={stats.ready} tone="positive" />
          <StatPill label="Avg. readiness" value={stats.readinessAvg ? `${stats.readinessAvg}%` : "-"} />
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          {lastUpdated ? <span>Updated {new Date(lastUpdated).toLocaleTimeString()}</span> : null}
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-progress disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            {activeFilters.length === 0 && "Showing the full outreach."}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                {activeFilters.map(([key, value]) => (
                  <span key={`${key}-${value}`} className="rounded-full bg-slate-100 px-3 py-1 uppercase tracking-wide">
                    {key}: {value}
                  </span>
                ))}
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[260px,1fr]">
          <Legend roles={roles} />
          <div className="relative min-h-[480px] rounded-2xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/80 backdrop-blur-sm">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
                <span className="text-sm text-slate-500">Updating board...</span>
              </div>
            ) : null}
            <div className="h-full overflow-hidden rounded-2xl">
              {people.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-slate-500">
                  <span>No people match the current scope.</span>
                  <span className="text-xs">Try clearing filters or assign people to this outreach.</span>
                </div>
              ) : (
                <ClientBoard people={people} outreaches={outreaches} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type StatTone = "neutral" | "positive";

function StatPill({ label, value, tone = "neutral" }: { label: string; value: number | string; tone?: StatTone }) {
  const styles = tone === "positive" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${styles}`}>
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-base font-semibold text-slate-900">{value}</span>
    </span>
  );
}
