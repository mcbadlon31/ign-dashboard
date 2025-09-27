
"use client";
import { useEffect, useState } from "react";

export default function PrintSummary(){
  const [board, setBoard] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(()=>{
    (async ()=>{
      const [b, a] = await Promise.all([
        fetch("/api/board").then(r=>r.json()),
        fetch("/api/analytics").then(r=>r.json()),
      ]);
      setBoard(b);
      setAnalytics(a);
    })();
  }, []);

  useEffect(()=>{
    if (board && analytics) {
      // Give the browser a tick to render before print
      setTimeout(()=>window.print(), 500);
    }
  }, [board, analytics]);

  return (
    <main className="p-6 print:p-0">
      <style>{`
        @media print {
          nav, .no-print { display: none !important; }
          main { padding: 0 !important; }
          .card { page-break-inside: avoid; }
        }
      `}</style>
      <h1 className="text-2xl font-semibold mb-2">IGN Summary</h1>
      <div className="text-sm text-gray-600 mb-4">Printed on {new Date().toLocaleString()}</div>

      <section className="card p-4 border rounded mb-4">
        <div className="font-medium mb-2">Analytics</div>
        {!analytics ? "Loading…" : (
          <ul className="grid grid-cols-2 gap-2 text-sm">
            <li>Total People: {analytics.totals.people}</li>
            <li>Active Goals: {analytics.totals.goals}</li>
            <li>Ready (≤30d, ≥75%): {analytics.readinessReadyCount}</li>
            <li>Uncovered (14d): {analytics.followupUncovered}</li>
          </ul>
        )}
      </section>

      <section className="card p-4 border rounded">
        <div className="font-medium mb-2">Board Snapshot</div>
        {!board ? "Loading…" : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="border p-1 text-left">Person</th>
                <th className="border p-1 text-left">Outreach</th>
                <th className="border p-1 text-left">Current</th>
                <th className="border p-1 text-left">Goal</th>
                <th className="border p-1 text-left">Progress</th>
              </tr>
            </thead>
            <tbody>
              {board.people.map((p:any)=>{
                const [name, outreach] = p.name.split(" • ");
                return (
                  <tr key={p.id}>
                    <td className="border p-1">{name}</td>
                    <td className="border p-1">{outreach ?? ""}</td>
                    <td className="border p-1">{p.currentRole ?? ""}</td>
                    <td className="border p-1">{p.goal?.name ?? ""}</td>
                    <td className="border p-1">{p.progress ?? ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
