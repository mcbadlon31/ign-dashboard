"use client";

import { useState } from "react";
import { PersonDrawer } from "./PersonDrawer";

type GoalSummary = { name: string; colorHex?: string | null } | null;

type Props = {
  id?: string;
  name: string;
  currentRole?: string;
  goal?: GoalSummary;
  progress?: string;
  progressPct?: number;
};

export function PersonCard({ id, name, currentRole, goal, progress, progressPct }: Props) {
  const backgroundTint = goal?.colorHex ? `${goal.colorHex}22` : "#CBD5E133";
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function addActivity() {
    if (!id || !note.trim()) return;
    setIsSubmitting(true);
    try {
      await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: id, type: "FollowUp", notes: note.trim() }),
      });
      setNote("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function completeNextMilestone() {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await fetch(`/api/milestones/complete-next?personId=${id}`, { method: "POST" });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-3 shadow-sm" style={{ backgroundColor: backgroundTint }}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="text-left text-sm font-medium hover:underline"
          onClick={() => setDrawerOpen(true)}
        >
          {name}
        </button>
        {currentRole && (
          <span className="rounded-full border px-2 py-0.5 text-xs text-slate-700" title="Current Role">
            {currentRole}
          </span>
        )}
      </div>

      <div className="mt-2 text-xs text-slate-600">Goal: {goal?.name ?? "-"}</div>

      {progress && (
        <div className="mt-2 text-xs">
          <div className="h-2 rounded bg-slate-200">
            <div
              className="h-2 rounded"
              style={{ width: `${Math.min(100, Math.max(0, progressPct ?? 0))}%`, background: goal?.colorHex ?? "#64748B" }}
            />
          </div>
          <div className="mt-1 text-slate-600">{progress}</div>
        </div>
      )}

      {id && (
        <div className="mt-3 space-y-2 text-xs">
          <div className="flex gap-2">
            <input
              value={note}
              onChange={event => setNote(event.target.value)}
              placeholder="Quick note"
              className="flex-1 rounded border px-2 py-1"
            />
            <button
              type="button"
              onClick={addActivity}
              disabled={isSubmitting || !note.trim()}
              className="rounded bg-slate-900 px-3 py-1 text-white disabled:opacity-60"
            >
              Add
            </button>
          </div>
          <button
            type="button"
            onClick={completeNextMilestone}
            disabled={isSubmitting}
            className="rounded border px-3 py-1 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Complete next milestone
          </button>
        </div>
      )}

      {drawerOpen && id && (
        <PersonDrawer personId={id} onClose={() => setDrawerOpen(false)} />
      )}
    </div>
  );
}
