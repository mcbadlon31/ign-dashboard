"use client";

import { useEffect, useState } from "react";
import { ActivityHeatmap } from "@/components/Heatmap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
} from "recharts";

type Analytics = {
  pipeline: { role: string; count: number }[];
  completionBuckets: { range: string; count: number }[];
  readinessReadyCount: number;
  readinessTop3: { personId: string; name: string; readinessIndex: number }[];
  readinessIndexAvg: number;
  atRiskCount: number;
  followupUncovered: number;
  totals: { goals: number; people: number };
  coachLoads: { coach: string; count: number }[];
  activityTypeCounts: { type: string; count: number }[];
};

type OutreachOption = { id: string; name: string };

function OutreachPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [options, setOptions] = useState<OutreachOption[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/board");
        if (!res.ok) return;
        const data = await res.json();
        setOptions(Array.isArray(data.outreaches) ? data.outreaches : []);
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  return (
    <select
      value={value}
      onChange={event => onChange(event.target.value)}
      className="rounded border px-2 py-1"
    >
      <option value="">All outreaches</option>
      {options.map(option => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </select>
  );
}

export default function Home() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [outreachId, setOutreachId] = useState("");
  const [loading, setLoading] = useState(false);

  async function load(selectedOutreach: string) {
    try {
      setLoading(true);
      const qs = selectedOutreach ? `?outreachId=${selectedOutreach}` : "";
      const res = await fetch(`/api/analytics${qs}`);
      if (res.ok) {
        const json = (await res.json()) as Analytics;
        setAnalytics(json);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(outreachId);
  }, [outreachId]);

  const pieData = analytics
    ? [
        { name: "Ready", value: analytics.readinessReadyCount },
        {
          name: "Not Ready",
          value: Math.max(analytics.totals.goals - analytics.readinessReadyCount, 0),
        },
      ]
    : [];

  return (
    <main>
      <header className="mb-6 flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <OutreachPicker value={outreachId} onChange={setOutreachId} />
        <button
          type="button"
          onClick={() => load(outreachId)}
          className="rounded border px-3 py-1.5 text-sm"
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {analytics && analytics.atRiskCount > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>{analytics.atRiskCount}</strong> goal(s) flagged as at-risk (low progress or no recent activity).
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm text-slate-500">Pipeline by Target Role</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.pipeline ?? []}>
                <XAxis dataKey="role" hide={false} interval={0} tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563EB" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm text-slate-500">Readiness Snapshot</div>
          <div className="flex items-center gap-6">
            <div className="h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} fill="#0EA5E9" label />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-sm text-slate-600">
              <div>Average readiness index: <strong>{analytics?.readinessIndexAvg ?? 0}</strong></div>
              <div className="mt-2">
                Top focused people:
                <ul className="mt-1 space-y-1 text-xs">
                  {(analytics?.readinessTop3 ?? []).map(item => (
                    <li key={item.personId}>
                      {item.name} — {item.readinessIndex}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm text-slate-500">Milestone Completion Distribution</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.completionBuckets ?? []}>
                <XAxis dataKey="range" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#22C55E" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm text-slate-500">Coach Loads (active goals)</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.coachLoads ?? []}>
                <XAxis dataKey="coach" hide={(analytics?.coachLoads?.length ?? 0) > 5} interval={0} tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#F97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm text-slate-500">Activity Types (last 30 days)</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.activityTypeCounts ?? []}>
                <XAxis dataKey="type" interval={0} tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#7C3AED" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-3 text-sm text-slate-500">Activity Heatmap</div>
          <ActivityHeatmap days={168} />
        </div>
      </div>

      {analytics && (
        <footer className="mt-6 text-xs text-slate-500">
          {analytics.totals.people} people · {analytics.totals.goals} active goals · Uncovered (14d): {analytics.followupUncovered}
        </footer>
      )}
    </main>
  );
}
