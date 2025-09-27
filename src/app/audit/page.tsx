
"use client";
import { useEffect, useState } from "react";

export default function AuditPage(){
  const [rows, setRows] = useState<any[]>([]);
  useEffect(()=>{ (async ()=>{ const data = await fetch('/api/audit?limit=300').then(r=>r.json()); setRows(data); })(); }, []);
  return (
    <main>
      <h1 className="text-2xl font-semibold mb-4">Audit Log</h1>
      <div className="grid gap-2">
        {rows.map(r => (
          <div key={r.id} className="p-2 border rounded text-sm">
            <div className="text-gray-500">{new Date(r.at).toLocaleString()}</div>
            <div><b>{r.action}</b> {r.entity ? `• ${r.entity} (${r.entityId})` : ""}</div>
            <div className="text-gray-600">{r.userEmail || "system"}</div>
            {r.meta && <pre className="text-[11px] bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(r.meta, null, 2)}</pre>}
          </div>
        ))}
      </div>
    </main>
  );
}
