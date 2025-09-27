"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PersonCard } from "@/components/PersonCard";

type PersonVM = {
  id: string;
  name: string;
  currentRole?: string | null;
  goal?: { name: string; colorHex?: string | null } | null;
  goalId?: string | null;
  goalStatus?: string | null;
  progress?: string;
  progressPct?: number;
  ready?: boolean;
  readinessIndex?: number;
};

type Outreach = { id: string; name: string; wipLimit?: number | null; inProgressCount?: number };

type ColumnKey = "PLANNED" | "IN_PROGRESS" | "READY_NEXT" | "DEFERRED";

const COLUMNS: Array<{ key: ColumnKey; label: string }> = [
  { key: "PLANNED", label: "This Month Focus" },
  { key: "IN_PROGRESS", label: "Coaching Now" },
  { key: "READY_NEXT", label: "Ready Next" },
  { key: "DEFERRED", label: "Deferred" },
];

function bucketKey(person: PersonVM): ColumnKey {
  if (person.goalStatus === "DEFERRED") return "DEFERRED";
  if (person.ready) return "READY_NEXT";
  if (person.goalStatus === "IN_PROGRESS") return "IN_PROGRESS";
  return "PLANNED";
}

export function ClientBoard({ people, outreaches }: { people: PersonVM[]; outreaches: Outreach[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const selectedOutreach = params.get("outreachId") ?? "";

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState<"" | "readiness">("");

  const filteredPeople = useMemo(() => {
    let list = people;
    if (query.trim()) {
      const term = query.toLowerCase();
      list = list.filter(person => person.name.toLowerCase().includes(term));
    }
    if (roleFilter.trim()) {
      const term = roleFilter.toLowerCase();
      list = list.filter(person => {
        const current = person.currentRole?.toLowerCase() ?? "";
        const goalName = person.goal?.name?.toLowerCase() ?? "";
        return current.includes(term) || goalName.includes(term);
      });
    }
    if (statusFilter === "ready") {
      list = list.filter(person => person.ready);
    } else if (statusFilter === "planned") {
      list = list.filter(person => !person.ready && person.goalStatus !== "ACHIEVED");
    } else if (statusFilter === "achieved") {
      list = list.filter(person => person.goalStatus === "ACHIEVED");
    }
    if (sort === "readiness") {
      list = [...list].sort((a, b) => (b.readinessIndex ?? 0) - (a.readinessIndex ?? 0));
    }
    return list;
  }, [people, query, roleFilter, statusFilter, sort]);

  const buckets = useMemo(() => {
    const result: Record<ColumnKey, PersonVM[]> = {
      PLANNED: [],
      IN_PROGRESS: [],
      READY_NEXT: [],
      DEFERRED: [],
    };
    for (const person of filteredPeople) {
      const key = bucketKey(person);
      result[key].push(person);
    }
    return result;
  }, [filteredPeople]);

  function handleOutreachChange(value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set("outreachId", value);
    else next.delete("outreachId");
    router.push(`/outreach?${next.toString()}`);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <select
          value={selectedOutreach}
          onChange={event => handleOutreachChange(event.target.value)}
          className="rounded border px-2 py-1"
        >
          <option value="">All outreaches</option>
          {outreaches.map(outreach => (
            <option key={outreach.id} value={outreach.id}>
              {outreach.name}
            </option>
          ))}
        </select>
        <input
          className="rounded border px-2 py-1"
          placeholder="Search people"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        <input
          className="rounded border px-2 py-1"
          placeholder="Role or goal contains"
          value={roleFilter}
          onChange={event => setRoleFilter(event.target.value)}
        />
        <select
          className="rounded border px-2 py-1"
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value)}
        >
          <option value="">Status: Any</option>
          <option value="planned">Planned</option>
          <option value="ready">Ready</option>
          <option value="achieved">Achieved</option>
        </select>
        <select
          className="rounded border px-2 py-1"
          value={sort}
          onChange={event => setSort(event.target.value as "" | "readiness")}
        >
          <option value="">Sort: Default</option>
          <option value="readiness">Sort: Readiness</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {COLUMNS.map(column => (
          <div key={column.key} className="rounded-xl border bg-slate-50 p-3">
            <div className="mb-2 text-sm font-semibold">{column.label}</div>
            <div className="grid gap-3">
              {buckets[column.key].map(person => (
                <PersonCard
                  key={person.id}
                  id={person.id}
                  name={person.name}
                  currentRole={person.currentRole ?? undefined}
                  goal={person.goal ?? null}
                  progress={person.progress}
                  progressPct={person.progressPct}
                />
              ))}
              {buckets[column.key].length === 0 && (
                <div className="text-xs text-slate-500">No people in this column.</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
