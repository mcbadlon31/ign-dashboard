"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import stages from "@/config/stages.json";
import { PageHeader } from "@/components/layout/PageHeader";

const stageList = stages as { key: string; label: string }[];
const stageKeys = stageList.map(stage => stage.key);

type Granularity = "month" | "quarter" | "year";

type EvaluationRow = {
  bucket: string;
  counts: Record<string, number>;
};

type EvaluationResponse = {
  granularity: Granularity;
  series: Record<string, Record<string, number>>;
};

export default function EvaluationsPage() {
  const [granularity, setGranularity] = useState<Granularity>("month");
  const [rows, setRows] = useState<EvaluationRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/evaluations?g=" + granularity);
      if (!res.ok) return;
      const data = (await res.json()) as EvaluationResponse;
      const buckets = Object.keys(data.series || {}).sort();
      const mapped = buckets.map(bucket => ({ bucket, counts: data.series[bucket] || {} }));
      setRows(mapped);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [granularity]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const aggregate: Record<string, number> = {};
    for (const row of rows) {
      for (const key of stageKeys) {
        aggregate[key] = (aggregate[key] || 0) + (row.counts[key] || 0);
      }
    }
    return aggregate;
  }, [rows]);

  function exportCsv() {
    if (!rows.length) return;
    let csv = "Period";
    for (const key of stageKeys) {
      csv += "," + stageLabel(key);
    }
    csv += "\n";
    for (const row of rows) {
      const values = stageKeys.map(key => String(row.counts[key] || 0));
      csv += row.bucket + "," + values.join(",") + "\n";
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "evaluations.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Evaluations"
        description="Track stage transitions by month, quarter, or year."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={granularity}
              onChange={event => setGranularity(event.target.value as Granularity)}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm focus:border-slate-500 focus:outline-none"
            >
              <option value="month">Monthly</option>
              <option value="quarter">Quarterly</option>
              <option value="year">Annual</option>
            </select>
            <button
              type="button"
              onClick={() => load()}
              className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100"
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              disabled={!rows.length}
            >
              Export CSV
            </button>
          </div>
        }
      />
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Period</th>
              {stageKeys.map(key => (
                <th key={key} className="px-4 py-3">
                  {stageLabel(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.bucket} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-900">{row.bucket}</td>
                {stageKeys.map(key => (
                  <td key={key} className="px-4 py-3 text-slate-600">
                    {row.counts[key] || 0}
                  </td>
                ))}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={stageKeys.length + 1} className="px-4 py-8 text-center text-sm text-slate-500">
                  {loading ? "Loading evaluations..." : "No evaluation data."}
                </td>
              </tr>
            )}
          </tbody>
          {rows.length ? (
            <tfoot className="border-t border-slate-200 bg-slate-50/60 text-sm text-slate-600">
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-900">Total</td>
                {stageKeys.map(key => (
                  <td key={key} className="px-4 py-3">
                    {totals[key] || 0}
                  </td>
                ))}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </div>
  );
}

function stageLabel(key: string) {
  const stage = stageList.find(item => item.key === key);
  return stage ? stage.label : key;
}
