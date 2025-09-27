"use client";

import { useEffect, useState } from "react";

type CoachOption = { email: string; role?: string };
type CoachSummary = {
  overWip: boolean;
  limit: number;
  inProgress: number;
  items: Array<{
    personId: string;
    name: string;
    goal: string;
    pct: number;
    lastActivity?: string | null;
    atRisk?: boolean;
  }>;
};

type CoachLimit = { coachEmail: string; limit: number };
type TrendRow = { week: string; followups: number; coaching: number; achieved: number };
type RedistributionSuggestion = { from: string; to: string; personIds: string[] };

export default function CoachFocusPage() {
  const [coach, setCoach] = useState("");
  const [coaches, setCoaches] = useState<CoachOption[]>([]);
  const [summary, setSummary] = useState<CoachSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/coaches");
        if (!res.ok) return;
        const data = await res.json();
        setCoaches(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  async function loadSummary(coachEmail: string) {
    setCoach(coachEmail);
    if (!coachEmail) {
      setSummary(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/coach/summary?coach=${encodeURIComponent(coachEmail)}`);
      if (!res.ok) return;
      const data = (await res.json()) as CoachSummary;
      setSummary(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1 className="mb-4 text-2xl font-semibold">Coach Focus</h1>
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <select
          className="rounded border px-2 py-1"
          value={coach}
          onChange={event => loadSummary(event.target.value)}
        >
          <option value="">Select coach…</option>
          {coaches.map(option => (
            <option key={option.email} value={option.email}>
              {option.email}
            </option>
          ))}
        </select>
        {summary && summary.overWip && (
          <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-700">
            WIP exceeded ({summary.inProgress}/{summary.limit})
          </span>
        )}
        {loading && <span className="text-xs text-slate-500">Loading…</span>}
      </div>

      {!summary ? (
        <div className="text-sm text-slate-500">Select a coach to see their focus list.</div>
      ) : (
        <section className="grid gap-2">
          {summary.items.map(item => (
            <div key={item.personId} className="rounded border bg-white p-3 text-sm">
              <div className="font-medium">
                {item.name}
                <span className="ml-2 text-xs text-slate-500">
                  {item.goal} ({item.pct}%)
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Last activity: {item.lastActivity ? new Date(item.lastActivity).toLocaleDateString() : "-"}
              </div>
              {item.atRisk && (
                <div className="text-xs text-amber-700">Needs attention (low progress or inactive)</div>
              )}
            </div>
          ))}
        </section>
      )}

      <hr className="my-6" />
      <CoachLimitsSection />

      <hr className="my-6" />
      <CoachTrendsSection coach={coach} />

      <hr className="my-6" />
      <RedistributionSection />
    </main>
  );
}

function CoachLimitsSection() {
  const [limits, setLimits] = useState<CoachLimit[]>([]);
  const [coachEmail, setCoachEmail] = useState("");
  const [limit, setLimit] = useState(8);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/coach/limits");
      if (!res.ok) return;
      setLimits(await res.json());
    })();
  }, []);

  async function save() {
    if (!coachEmail) return;
    setSaving(true);
    try {
      const res = await fetch("/api/coach/limits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachEmail, limit }),
      });
      if (!res.ok) {
        alert("Unable to save limit");
        return;
      }
      const refreshed = await fetch("/api/coach/limits").then(r => r.json());
      setLimits(refreshed);
      setCoachEmail("");
      setLimit(8);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">Coach WIP Limits</h2>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <input
          className="rounded border px-2 py-1"
          placeholder="coach@example.org"
          value={coachEmail}
          onChange={event => setCoachEmail(event.target.value)}
        />
        <input
          type="number"
          className="w-24 rounded border px-2 py-1"
          value={limit}
          onChange={event => setLimit(Number(event.target.value || 0))}
        />
        <button
          type="button"
          onClick={save}
          disabled={saving || !coachEmail}
          className="rounded border px-3 py-1.5 disabled:opacity-60"
        >
          Save
        </button>
      </div>
      <div className="grid gap-1 text-sm">
        {limits.map(item => (
          <div key={item.coachEmail} className="rounded border bg-white p-2">
            {item.coachEmail} — limit {item.limit}
          </div>
        ))}
        {limits.length === 0 && <div className="text-slate-500">No overrides defined.</div>}
      </div>
    </section>
  );
}

function CoachTrendsSection({ coach }: { coach: string }) {
  const [rows, setRows] = useState<TrendRow[]>([]);

  useEffect(() => {
    if (!coach) {
      setRows([]);
      return;
    }
    (async () => {
      const res = await fetch(`/api/coach/trends?coach=${encodeURIComponent(coach)}&window=90`);
      if (!res.ok) return;
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    })();
  }, [coach]);

  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">Trends (last 90 days)</h2>
      {!rows.length ? (
        <div className="text-sm text-slate-500">Select a coach to load trend data.</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th>Week</th>
              <th>Follow-ups</th>
              <th>Coaching</th>
              <th>Achieved</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.week}>
                <td>{row.week}</td>
                <td>{row.followups}</td>
                <td>{row.coaching}</td>
                <td>{row.achieved}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function RedistributionSection() {
  const [suggestions, setSuggestions] = useState<RedistributionSuggestion[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/coach/redistribute");
      if (!res.ok) return;
      const data = await res.json();
      setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
    })();
  }, []);

  async function apply(suggestion: RedistributionSuggestion) {
    const confirmed = window.confirm(
      `Move ${suggestion.personIds.length} people from ${suggestion.from} to ${suggestion.to}?`
    );
    if (!confirmed) return;
    const res = await fetch("/api/coach/reassign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personIds: suggestion.personIds, coachEmail: suggestion.to }),
    });
    const result = await res.json();
    alert(`Reassigned ${result.updated ?? suggestion.personIds.length} people.`);
  }

  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">Redistribution Suggestions</h2>
      {!suggestions.length ? (
        <div className="text-sm text-slate-500">No suggestions at the moment.</div>
      ) : (
        <div className="grid gap-2 text-sm">
          {suggestions.map((item, index) => (
            <div key={`${item.from}-${item.to}-${index}`} className="flex items-center justify-between rounded border bg-white p-3">
              <div>
                <strong>{item.from}</strong> → <strong>{item.to}</strong> — {item.personIds.length} people
              </div>
              <button type="button" className="rounded border px-2 py-1" onClick={() => apply(item)}>
                Apply
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
