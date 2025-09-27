
"use client";
import { useEffect, useState } from "react";

export default function AlertsPage(){
  const [rows, setRows] = useState<any[]>([]);
  const [html, setHtml] = useState<string>("");

  async function load(){
    const r = await fetch('/api/alerts/logs').then(r=>r.json());
    setRows(r);
  }
  useEffect(()=>{ load(); }, []);

  async function preview(scope: string){
    const txt = await fetch(`/api/alerts/preview?scope=${encodeURIComponent(scope)}`).then(r=>r.text());
    setHtml(txt);
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-4">Alerts</h1>
      <div className="grid gap-2">
        {rows.map((r:any)=>(
          <div key={r.id} className="p-2 border rounded text-sm flex items-center justify-between">
            <div>
              <div><b>{r.type}</b> • {r.scope || '—'}</div>
              <div className="text-xs text-gray-600">{new Date(r.sentAt).toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-2 py-1 rounded border text-xs" onClick={()=>preview(r.scope || 'all')}>Preview</button>
            </div>
          </div>
        ))}
        {!rows.length && <div className="text-sm text-gray-500">No alerts yet.</div>}
      </div>
      {html && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={()=>setHtml("")}>
          <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[560px] bg-white p-4 overflow-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">HTML Preview</div>
              <button className="text-sm underline" onClick={()=>setHtml("")}>Close</button>
            </div>
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>
      )}
    </main>
  );
}
