"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

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
  const [loadingSummary, setLoadingSummary] = useState(false);

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
    setLoadingSummary(true);
    try {
      const res = await fetch(`/api/coach/summary?coach=${encodeURIComponent(coachEmail)}`);
      if (!res.ok) return;
      const data = (await res.json()) as CoachSummary;
      setSummary(data);
    } finally {
      setLoadingSummary(false);
    }
  }

  function handleSelectCoach(value: string) {
    setCoach(value);
    if (!value) {
      setSummary(null);
      return;
    }
    void loadSummary(value);
  }

  const focusStats = useMemo(() => {
    if (!summary) return null;
    return {
      total: summary.items.length,
      atRisk: summary.items.filter(item => item.atRisk).length,
      progressAvg: summary.items.length
        ? Math.round(
            summary.items.reduce((acc, item) => acc + (item.pct ?? 0), 0) / summary.items.length,
          )
        : 0,
    };
  }, [summary]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Coach focus"
        description="Spot coaching overload, review milestone progress, and take action on redistribution suggestions."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Select
              className="w-56"
              value={coach}
              onChange={event => handleSelectCoach(event.target.value)}
            >
              <option value="">Select coach</option>
              {coaches.map(option => (
                <option key={option.email} value={option.email}>
                  {option.email}
                </option>
              ))}
            </Select>
            <Button
              variant="outline"
              onClick={() => coach && loadSummary(coach)}
              disabled={!coach || loadingSummary}
            >
              Refresh
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Focus list</CardTitle>
          <CardDescription>
            Choose a coach to see the people they are actively discipling along with milestone momentum and recent activity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!coach ? (
            <p className="text-sm text-slate-500">Select a coach above to load their focus list.</p>
          ) : loadingSummary ? (
            <p className="text-sm text-slate-500">Loading focus list...</p>
          ) : !summary ? (
            <p className="text-sm text-slate-500">No summary available for this coach.</p>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={summary.overWip ? "danger" : "success"}>
                  {summary.inProgress}/{summary.limit} active goals
                </Badge>
                {summary.overWip && (
                  <span className="text-xs text-rose-600">
                    WIP limit exceeded -- consider redistributing or adjusting capacity.
                  </span>
                )}
              </div>

              {focusStats && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <FocusStat label="Focus list" value={focusStats.total} />
                  <FocusStat label="At risk" value={focusStats.atRisk} tone={focusStats.atRisk ? "danger" : "neutral"} />
                  <FocusStat label="Average progress" value={`${focusStats.progressAvg}%`} />
                </div>
              )}

              <div className="grid gap-3">
                {summary.items.map(item => {
                  const lastActivity = item.lastActivity
                    ? dateFormatter.format(new Date(item.lastActivity))
                    : "No activity recorded";
                  return (
                    <div
                      key={item.personId}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold text-slate-800">{item.name}</div>
                          <div className="text-sm text-slate-500">
                            {item.goal} - {item.pct}% complete
                          </div>
                        </div>
                        <Badge variant={item.atRisk ? "warning" : "outline"}>
                          {item.atRisk ? "Needs attention" : lastActivity}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
                {summary.items.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                    This coach has no active focus items right now.
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CoachLimitsSection />
      <CoachTrendsSection coach={coach} />
      <RedistributionSection />
    </div>
  );
}

function FocusStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "danger";
}) {
  const toneClasses = tone === "danger" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-700";
  return (
    <div className={`rounded-2xl border border-slate-200 px-4 py-3 text-sm ${toneClasses}`}>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function CoachLimitsSection() {
  const [limits, setLimits] = useState<CoachLimit[]>([]);
  const [coachEmail, setCoachEmail] = useState("");
  const [limit, setLimit] = useState(8);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/coach/limits");
    if (!res.ok) return;
    const data = await res.json();
    setLimits(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    if (!coachEmail) return;
    setSaving(true);
    try {
      await fetch("/api/coach/limits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachEmail, limit }),
      });
      setCoachEmail("");
      setLimit(8);
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coach WIP limits</CardTitle>
        <CardDescription>
          Override the default working-in-progress capacity for individual coaches to prevent overload.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[2fr,1fr,auto]">
          <Input
            placeholder="coach@example.org"
            value={coachEmail}
            onChange={event => setCoachEmail(event.target.value)}
          />
          <Input
            type="number"
            min={1}
            value={limit}
            onChange={event => setLimit(Number(event.target.value || 0))}
          />
          <Button onClick={save} disabled={saving || !coachEmail.trim()}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
        <div className="grid gap-2 text-sm">
          {limits.map(item => (
            <div key={item.coachEmail} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
              <span className="font-medium text-slate-700">{item.coachEmail}</span>
              <span className="ml-2 text-xs text-slate-500">Limit {item.limit}</span>
            </div>
          ))}
          {limits.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
              No coach-specific limits yet.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
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
    <Card>
      <CardHeader>
        <CardTitle>Trends</CardTitle>
        <CardDescription>90-day snapshot of weekly follow-ups, coaching activities, and achieved goals.</CardDescription>
      </CardHeader>
      <CardContent>
        {!coach ? (
          <p className="text-sm text-slate-500">Select a coach to load trend data.</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">No trend data available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Week</th>
                  <th className="px-3 py-2">Follow-ups</th>
                  <th className="px-3 py-2">Coaching</th>
                  <th className="px-3 py-2">Achieved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(row => (
                  <tr key={row.week}>
                    <td className="px-3 py-2 font-medium text-slate-700">{row.week}</td>
                    <td className="px-3 py-2">{row.followups}</td>
                    <td className="px-3 py-2">{row.coaching}</td>
                    <td className="px-3 py-2">{row.achieved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
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

  async function applySuggestion(suggestion: RedistributionSuggestion) {
    const confirmed = window.confirm(
      `Move ${suggestion.personIds.length} people from ${suggestion.from} to ${suggestion.to}?`,
    );
    if (!confirmed) return;
    const res = await fetch("/api/coach/reassign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personIds: suggestion.personIds, coachEmail: suggestion.to }),
    });
    const result = await res.json();
    window.alert(`Reassigned ${result.updated ?? suggestion.personIds.length} people.`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Redistribution suggestions</CardTitle>
        <CardDescription>
          Identify opportunities to balance load between coaches when WIP limits are stretched.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {suggestions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-slate-500">
            No redistribution suggestions at the moment.
          </div>
        ) : (
          suggestions.map((item, index) => (
            <div
              key={`${item.from}-${item.to}-${index}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
            >
              <div>
                <span className="font-semibold text-slate-700">{item.from}</span>
                <span className="mx-2 text-slate-400">-&gt;</span>
                <span className="font-semibold text-slate-700">{item.to}</span>
                <span className="ml-2 text-xs text-slate-500">{item.personIds.length} people</span>
              </div>
              <Button variant="outline" onClick={() => applySuggestion(item)}>
                Apply suggestion
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
