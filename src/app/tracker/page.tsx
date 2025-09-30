"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import stages from "@/config/stages.json";
import { PageHeader } from "@/components/layout/PageHeader";
import { StageBadge } from "@/components/StageBadge";

const stageList = stages as { key: string; label: string; color: string; short: string }[];
const stageLookup = new Map(stageList.map(stage => [stage.key, stage]));

type BoardPerson = {
  id: string;
  name: string;
  currentStage?: string | null;
  stageSince?: string | null;
  progress?: string | null;
  goal?: { name?: string | null } | null;
  coachEmail?: string | null;
  assignee?: string | null;
  notes?: string | null;
};

type BoardResponse = {
  people?: BoardPerson[];
};

export default function TrackerPage() {
  const [rows, setRows] = useState<BoardPerson[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/board");
      if (!res.ok) return;
      const data = (await res.json()) as BoardResponse;
      setRows(Array.isArray(data.people) ? data.people : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const needle = query.trim().toLowerCase();
    return rows.filter(row => (row.name || "").toLowerCase().includes(needle));
  }, [rows, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trajectory Tracker"
        description="Monitor disciple movement across stages and capture next steps."
        actions={
          <button
            type="button"
            onClick={() => load()}
            className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100"
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search by name"
          className="w-full max-w-xs rounded-full border border-slate-300 px-4 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
          aria-label="Search people"
        />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Current Stage</th>
              <th className="px-4 py-3">Date Entered</th>
              <th className="px-4 py-3">Milestones</th>
              <th className="px-4 py-3">Next Step</th>
              <th className="px-4 py-3">Mentor</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-4 py-3" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(person => (
              <tr key={person.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-900">{person.name}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <StageBadge stage={person.currentStage ?? undefined} />
                    <span className="text-slate-700">{stageLabel(person.currentStage)}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{formatStageSince(person.stageSince)}</td>
                <td className="px-4 py-3 text-slate-600">{person.progress ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{person.goal?.name ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{person.coachEmail ?? person.assignee ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{person.notes ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <StageAdvance personId={person.id} onUpdated={load} />
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                  {loading ? "Loading tracker..." : "No people found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function stageLabel(stageKey?: string | null) {
  if (!stageKey) return "—";
  return stageLookup.get(stageKey)?.label ?? stageKey;
}

function formatStageSince(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString();
}

type StageAdvanceProps = {
  personId: string;
  onUpdated: () => void;
};

function StageAdvance({ personId, onUpdated }: StageAdvanceProps) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const close = () => {
    setOpen(false);
    setStage("");
    setNotes("");
  };

  async function save() {
    if (!stage) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId, stage, notes: notes.trim() || null }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(error.error || "Failed to update stage");
      }
      close();
      onUpdated();
    } catch (error) {
      console.error(error);
      window.alert(error instanceof Error ? error.message : "Failed to update stage");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
      >
        Advance
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40 px-4 py-6 backdrop-blur-sm sm:items-center sm:justify-center"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
            onClick={event => event.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-900">Set Stage</h2>
            <p className="mt-1 text-xs text-slate-500">Update the disciple's current milestone.</p>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Stage
              <select
                value={stage}
                onChange={event => setStage(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              >
                <option value="">Choose stage…</option>
                {stageList.map(item => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-sm font-medium text-slate-700">
              Notes (optional)
              <textarea
                value={notes}
                onChange={event => setNotes(event.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
                disabled={submitting || !stage}
              >
                {submitting ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
