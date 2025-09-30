"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ViewFilters = {
  role?: string;
  status?: "ready" | "planned" | "achieved";
  tagIds?: string[];
  sort?: "readiness";
};

type SavedView = {
  name: string;
  slug: string;
  outreachId?: string | null;
  filters?: ViewFilters | null;
};

type BoardPerson = {
  id: string;
  name: string;
  currentRole?: string | null;
  goal?: { name: string | null } | null;
  progress?: string;
  ready?: boolean;
  readinessIndex?: number;
};

type BoardResponse = {
  people: BoardPerson[];
};

type AnalyticsResponse = {
  totals: { people: number; goals: number };
  readinessReadyCount: number;
  followupUncovered: number;
};

export default function SavedDashboard({ params }: { params: { slug: string } }) {
  const [view, setView] = useState<SavedView | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [board, setBoard] = useState<BoardResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const viewRes = await fetch(`/api/views/${params.slug}`);
        if (!viewRes.ok) throw new Error("Failed to load view");
        const viewData: SavedView = await viewRes.json();
        if (cancelled) return;
        setView(viewData);

        const qs = viewData.outreachId ? `?outreachId=${viewData.outreachId}` : "";
        const [analyticsRes, boardRes] = await Promise.all([
          fetch(`/api/analytics${qs}`).then(res => (res.ok ? res.json() : null)),
          fetch(`/api/board${qs}`).then(res => (res.ok ? res.json() : null)),
        ]);

        if (cancelled) return;

        setAnalytics(analyticsRes);

        let boardData: BoardResponse | null = boardRes;
        if (boardData && viewData.filters && boardData.people) {
          const filters = viewData.filters;
          let filteredPeople = boardData.people.slice();
          if (filters.role) {
            const roleTerm = filters.role.toLowerCase();
            filteredPeople = filteredPeople.filter(person => {
              const current = person.currentRole?.toLowerCase() ?? "";
              const goalName = person.goal?.name?.toLowerCase() ?? "";
              return current.includes(roleTerm) || goalName.includes(roleTerm);
            });
          }
          if (filters.status === "ready") {
            filteredPeople = filteredPeople.filter(person => person.ready);
          } else if (filters.status === "planned") {
            filteredPeople = filteredPeople.filter(person => !person.ready);
          } else if (filters.status === "achieved") {
            filteredPeople = filteredPeople.filter(person => person.goal?.name?.startsWith("✅"));
          }
          if (filters.sort === "readiness") {
            filteredPeople = filteredPeople.sort((a, b) => (b.readinessIndex ?? 0) - (a.readinessIndex ?? 0));
          }
          boardData = { ...boardData, people: filteredPeople };
        }

        setBoard(boardData);
      } catch (error) {
        console.error(error);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [params.slug]);

  if (!view) {
    return <main className="text-sm text-slate-500">Loading…</main>;
  }

  return (
    <main>
      <h1 className="mb-4 text-2xl font-semibold">{view.name}</h1>
      <div className="mb-4 text-xs text-slate-500">
        Share: <Link className="underline" href={`/dashboard/${view.slug}`}>/dashboard/{view.slug}</Link>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-2 font-medium">Analytics</div>
          {!analytics ? (
            "Loading…"
          ) : (
            <ul className="grid grid-cols-2 gap-2 text-sm">
              <li>People: {analytics.totals.people}</li>
              <li>Active Goals: {analytics.totals.goals}</li>
              <li>Ready (≤30d & ≥75%): {analytics.readinessReadyCount}</li>
              <li>Uncovered (14d): {analytics.followupUncovered}</li>
            </ul>
          )}
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-2 font-medium">Board Snapshot</div>
          {!board ? (
            "Loading…"
          ) : board.people.length === 0 ? (
            <div className="text-sm text-slate-500">No people match this view.</div>
          ) : (
            <ul className="grid gap-1 text-sm">
              {board.people.slice(0, 12).map(person => (
                <li key={person.id}>
                  {person.name} – {person.goal?.name ?? "-"} ({person.progress ?? "0/0"})
                </li>
              ))}
              {board.people.length > 12 && (
                <li className="text-slate-500">…and {board.people.length - 12} more</li>
              )}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
