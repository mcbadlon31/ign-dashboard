"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const numberFormatter = new Intl.NumberFormat("en-US");
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

const monthPresets = [3, 6, 9, 12, 18, 24];

const timelineMetricOptions = {
  created: { label: "Goals created", color: "#2563EB" },
  achieved: { label: "Goals achieved", color: "#22C55E" },
  ready: { label: "Ready (>=75%)", color: "#0EA5E9" },
  atRisk: { label: "At risk", color: "#F97316" },
} as const;

type TimelineMetricKey = keyof typeof timelineMetricOptions;

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

type TimelineResponse = {
  months: Array<{
    key: string;
    label: string;
    totals: MetricTotals;
    outreach: Array<MetricTotals & { outreachId: string | null; outreachName: string }>;
  }>;
};

type MetricTotals = {
  created: number;
  achieved: number;
  ready: number;
  atRisk: number;
};

function KpiTile({
  label,
  value,
  helper,
  tone = "neutral",
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "neutral" | "positive" | "warning" | "danger";
}) {
  const toneClasses = {
    neutral: "bg-slate-100 text-slate-600",
    positive: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-rose-100 text-rose-700",
  } as const;

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="space-y-2 p-5">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}>
          {label}
        </span>
        <div className="text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
        {helper ? <p className="text-sm text-slate-500">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
            <div className="h-4 w-24 rounded-full bg-slate-200" />
            <div className="mt-4 h-8 w-16 rounded-lg bg-slate-200" />
            <div className="mt-3 h-3 w-32 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-8" />
        ))}
      </div>
    </div>
  );
}

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
    <label className="flex items-center gap-2 text-sm text-slate-600">
      Outreach
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition focus:border-slate-500 focus:outline-none"
      >
        <option value="">All outreaches</option>
        {options.map(option => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function Home() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [outreachId, setOutreachId] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [timelineMonthsRange, setTimelineMonthsRange] = useState(6);
  const [timelineData, setTimelineData] = useState<TimelineResponse | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [timelineMetrics, setTimelineMetrics] = useState<Record<TimelineMetricKey, boolean>>({
    created: true,
    achieved: true,
    ready: false,
    atRisk: false,
  });
  const [timelineView, setTimelineView] = useState<"chart" | "table">("chart");

  const summary = useMemo(() => {
    return {
      totalGoals: analytics?.totals.goals ?? 0,
      totalPeople: analytics?.totals.people ?? 0,
      readyCount: analytics?.readinessReadyCount ?? 0,
      atRisk: analytics?.atRiskCount ?? 0,
      uncovered: analytics?.followupUncovered ?? 0,
      readinessAvg: analytics?.readinessIndexAvg ?? 0,
      topThree: analytics?.readinessTop3 ?? [],
      pipeline: analytics?.pipeline ?? [],
      buckets: analytics?.completionBuckets ?? [],
      coachLoads: analytics?.coachLoads ?? [],
      activityTypes: analytics?.activityTypeCounts ?? [],
    };
  }, [analytics]);

  async function load(selectedOutreach: string) {
    try {
      setLoading(true);
      const qs = selectedOutreach ? `?outreachId=${selectedOutreach}` : "";
      const res = await fetch(`/api/analytics${qs}`);
      if (res.ok) {
        const json = (await res.json()) as Analytics;
        setAnalytics(json);
        setLastUpdated(new Date().toISOString());
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

  useEffect(() => {
    let cancelled = false;
    setTimelineLoading(true);
    setTimelineError(null);
    const params = new URLSearchParams({ months: String(timelineMonthsRange) });
    if (outreachId) params.set("outreachId", outreachId);
    fetch(`/api/analytics/monthly?${params.toString()}`)
      .then(async res => {
        if (!res.ok) throw new Error("Failed to load timeline");
        const data = (await res.json()) as TimelineResponse;
        if (!cancelled) setTimelineData(data);
      })
      .catch(error => {
        console.error(error);
        if (!cancelled) {
          setTimelineError("Unable to load timeline analytics.");
          setTimelineData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setTimelineLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [timelineMonthsRange, outreachId]);

  const activeTimelineMetrics = useMemo(() =>
    (Object.keys(timelineMetricOptions) as TimelineMetricKey[]).filter(key => timelineMetrics[key]),
  [timelineMetrics]);

  const timelineChartData = useMemo(() => {
    if (!timelineData) return [];
    return timelineData.months.map(month => ({
      month: month.label,
      created: month.totals.created,
      achieved: month.totals.achieved,
      ready: month.totals.ready,
      atRisk: month.totals.atRisk,
    }));
  }, [timelineData]);

  const timelineTableRows = useMemo(() => {
    if (!timelineData) return [] as Array<{
      monthKey: string;
      monthLabel: string;
      outreachId: string | null;
      outreachName: string;
      created: number;
      achieved: number;
      ready: number;
      atRisk: number;
      isTotal: boolean;
    }>;

    const rows: Array<{
      monthKey: string;
      monthLabel: string;
      outreachId: string | null;
      outreachName: string;
      created: number;
      achieved: number;
      ready: number;
      atRisk: number;
      isTotal: boolean;
    }> = [];

    for (const month of timelineData.months) {
      rows.push({
        monthKey: month.key,
        monthLabel: month.label,
        outreachId: null,
        outreachName: "All outreaches",
        created: month.totals.created,
        achieved: month.totals.achieved,
        ready: month.totals.ready,
        atRisk: month.totals.atRisk,
        isTotal: true,
      });
      for (const outreach of month.outreach) {
        rows.push({
          monthKey: month.key,
          monthLabel: month.label,
          outreachId: outreach.outreachId,
          outreachName: outreach.outreachName,
          created: outreach.created,
          achieved: outreach.achieved,
          ready: outreach.ready,
          atRisk: outreach.atRisk,
          isTotal: false,
        });
      }
    }

    return rows.sort((a, b) => a.monthKey.localeCompare(b.monthKey) || a.outreachName.localeCompare(b.outreachName));
  }, [timelineData]);

  function handleTimelineMetricToggle(metric: TimelineMetricKey) {
    setTimelineMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
  }

  function handleTimelineCsv() {
    if (!timelineData || timelineData.months.length === 0) return;
    const header = ["Month", "Outreach", "Goals created", "Goals achieved", "Ready >=75%", "At risk"];
    const rows = timelineData.months.flatMap(month => {
      const bucketRows = month.outreach.length
        ? month.outreach
        : [{ outreachId: null, outreachName: "All outreaches", created: month.totals.created, achieved: month.totals.achieved, ready: month.totals.ready, atRisk: month.totals.atRisk }];
      return bucketRows.map(outreach => [
        month.label,
        outreach.outreachName,
        outreach.created,
        outreach.achieved,
        outreach.ready,
        outreach.atRisk,
      ]);
    });

    const csv = [header, ...rows]
      .map(line => line.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `timeline-${timelineMonthsRange}m.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

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
    <div className="space-y-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track readiness, momentum, and coaching load across every outreach.
            {lastUpdated ? ` Updated ${timeFormatter.format(new Date(lastUpdated))}.` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <OutreachPicker value={outreachId} onChange={setOutreachId} />
          <button
            type="button"
            onClick={() => load(outreachId)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-progress disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      {!analytics && loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile
              label="People with plans"
              value={numberFormatter.format(summary.totalPeople)}
              helper={`${numberFormatter.format(summary.totalGoals)} active goals`}
            />
            <KpiTile
              label="Ready to launch"
              value={numberFormatter.format(summary.readyCount)}
              helper="Milestones >=75% complete"
              tone="positive"
            />
            <KpiTile
              label="At-risk goals"
              value={numberFormatter.format(summary.atRisk)}
              helper="Due soon or inactive >30 days"
              tone="danger"
            />
            <KpiTile
              label="Needs follow-up"
              value={numberFormatter.format(summary.uncovered)}
              helper="No activity in 14 days"
              tone="warning"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline by target role</CardTitle>
                <CardDescription>Live goal count for each target role.</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.pipeline}>
                    <XAxis dataKey="role" interval={0} tick={{ fontSize: 12 }} angle={-15} textAnchor="end" height={70} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ fill: "rgba(15,23,42,0.08)" }} />
                    <Bar dataKey="count" fill="#2563EB" radius={6} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Readiness snapshot</CardTitle>
                <CardDescription>
                  Average index {summary.readinessAvg}% with top focus cards highlighted below.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6 lg:flex-row">
                <div className="h-56 w-full lg:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} fill="#0EA5E9" label />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 text-sm">
                  <div className="font-semibold text-slate-700">Top focus people</div>
                  <ul className="mt-3 space-y-2">
                    {summary.topThree.map(item => (
                      <li
                        key={item.personId}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm"
                      >
                        <span className="font-medium text-slate-700">{item.name}</span>
                        <span className="text-xs font-semibold text-slate-500">RD {item.readinessIndex}</span>
                      </li>
                    ))}
                    {summary.topThree.length === 0 ? (
                      <li className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
                        No readiness data yet.
                      </li>
                    ) : null}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Milestone completion</CardTitle>
                <CardDescription>Distribution by completion cohort.</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.buckets}>
                    <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ fill: "rgba(15,23,42,0.08)" }} />
                    <Bar dataKey="count" fill="#22C55E" radius={6} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Coach load</CardTitle>
                <CardDescription>Active goals coached per leader.</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.coachLoads}>
                    <XAxis dataKey="coach" tick={{ fontSize: 12 }} interval={0} angle={-25} textAnchor="end" height={70} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ fill: "rgba(15,23,42,0.08)" }} />
                    <Bar dataKey="count" fill="#F97316" radius={6} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Activity types (30-day)</CardTitle>
                <CardDescription>Breakdown of logged activity categories.</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.activityTypes}>
                    <XAxis dataKey="type" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={70} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ fill: "rgba(15,23,42,0.08)" }} />
                    <Bar dataKey="count" fill="#7C3AED" radius={6} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Activity heatmap</CardTitle>
                <CardDescription>Every coaching interaction over the last 24 weeks.</CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityHeatmap days={168} />
              </CardContent>
            </Card>
          </section>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Timeline analyzer</CardTitle>
          <CardDescription>
            Review goals created, achieved, ready, or at risk across recent months. Toggle KPIs, change the time range, export to CSV, or jump to an outreach board.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-slate-600">Months</span>
              {monthPresets.map(preset => (
                <Button
                  key={preset}
                  variant={timelineMonthsRange === preset ? "primary" : "outline"}
                  onClick={() => setTimelineMonthsRange(preset)}
                >
                  {preset}m
                </Button>
              ))}
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>Custom</span>
                <Input
                  type="number"
                  min={1}
                  max={24}
                  value={timelineMonthsRange}
                  onChange={event => {
                    const next = Number(event.target.value);
                    if (Number.isNaN(next)) return;
                    setTimelineMonthsRange(Math.min(Math.max(1, Math.floor(next)), 24));
                  }}
                  className="w-20"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(Object.keys(timelineMetricOptions) as TimelineMetricKey[]).map(metric => (
                <Button
                  key={metric}
                  variant={timelineMetrics[metric] ? "primary" : "outline"}
                  onClick={() => handleTimelineMetricToggle(metric)}
                >
                  {timelineMetricOptions[metric].label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={timelineView === "chart" ? "primary" : "outline"}
                onClick={() => setTimelineView("chart")}
              >
                Chart view
              </Button>
              <Button
                variant={timelineView === "table" ? "primary" : "outline"}
                onClick={() => setTimelineView("table")}
              >
                Table view
              </Button>
              <Button
                variant="outline"
                onClick={handleTimelineCsv}
                disabled={!timelineData || timelineData.months.length === 0}
              >
                Export CSV
              </Button>
            </div>
          </div>

          {timelineLoading ? (
            <p className="text-sm text-slate-500">Loading timeline analytics...</p>
          ) : timelineError ? (
            <p className="text-sm text-rose-600">{timelineError}</p>
          ) : !timelineData || timelineData.months.length === 0 ? (
            <p className="text-sm text-slate-500">No timeline data available for the selected range.</p>
          ) : timelineView === "chart" ? (
            activeTimelineMetrics.length === 0 ? (
              <p className="text-sm text-slate-500">Select at least one metric to plot.</p>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineChartData} margin={{ top: 12, right: 16, left: 0, bottom: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    {activeTimelineMetrics.map(metric => (
                      <Line
                        key={metric}
                        type="monotone"
                        dataKey={metric}
                        stroke={timelineMetricOptions[metric].color}
                        strokeWidth={2}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Month</th>
                    <th className="px-3 py-2">Outreach</th>
                    {activeTimelineMetrics.includes("created") && <th className="px-3 py-2">Created</th>}
                    {activeTimelineMetrics.includes("achieved") && <th className="px-3 py-2">Achieved</th>}
                    {activeTimelineMetrics.includes("ready") && <th className="px-3 py-2">Ready</th>}
                    {activeTimelineMetrics.includes("atRisk") && <th className="px-3 py-2">At risk</th>}
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timelineTableRows.map(row => (
                    <tr key={`${row.monthKey}-${row.outreachId ?? "all"}`} className={row.isTotal ? "bg-slate-50/80" : undefined}>
                      <td className="px-3 py-2 font-medium text-slate-700">{row.monthLabel}</td>
                      <td className="px-3 py-2 text-slate-600">{row.outreachName}</td>
                      {activeTimelineMetrics.includes("created") && <td className="px-3 py-2">{row.created}</td>}
                      {activeTimelineMetrics.includes("achieved") && <td className="px-3 py-2">{row.achieved}</td>}
                      {activeTimelineMetrics.includes("ready") && <td className="px-3 py-2">{row.ready}</td>}
                      {activeTimelineMetrics.includes("atRisk") && <td className="px-3 py-2">{row.atRisk}</td>}
                      <td className="px-3 py-2">
                        {row.outreachId ? (
                          <Link
                            href={{ pathname: "/outreach", query: { outreachId: row.outreachId } }}
                            className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                          >
                            View board
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">All outreach</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
