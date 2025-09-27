
"use client";
import { useEffect, useMemo, useState } from "react";

type PersonRow = { id: string; name: string; progressPct?: number };

export default function BatchMilestones(){
  const [rows, setRows] = useState<PersonRow[]>([]);
  const [q, setQ] = useState("");
  const [changes, setChanges] = useState<Record<string, number>>({});

  useEffect(()=>{
    (async ()=>{
      const board = await fetch("/api/board").then(r=>r.json());
      const map = board.people.map((p:any)=>({ id: p.id, name: p.name, progressPct: p.progressPct ?? 0 }));
      setRows(map);
    })();
  }, []);

  const filtered = useMemo(()=> rows.filter(r => r.name.toLowerCase().includes(q.toLowerCase())), [q, rows]);

  async function submit(){
    const updates = Object.entries(changes).map(([personId, pct]) => ({ personId, pct }));
    if (updates.length === 0) return alert("No changes");
    const res = await fetch("/api/milestones/batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ updates }) });
    const json = await res.json();
    if (!res.ok) return alert(json.error || "Failed");
    setChanges({});
    window.dispatchEvent(new Event("data-updated"));
    alert(`Updated ${json.updated} people`);
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-4">Batch Milestone Update</h1>
      <div className="p-4 border rounded-xl bg-white shadow-sm grid gap-2 mb-4">
        <input className="border rounded px-2 py-1" placeholder="Search…" value={q} onChange={(e)=>setQ(e.target.value)} />
        <button className="px-3 py-1.5 rounded bg-black text-white w-fit" onClick={submit}>Apply Changes</button>
      </div>

      <div className="grid gap-2 max-h-[60vh] overflow-auto pr-2">
        {filtered.map(r => (
          <div key={r.id} className="p-2 border rounded flex items-center justify-between">
            <span className="text-sm">{r.name}</span>
            <input type="number" min={0} max={100} step={5} className="border rounded px-2 py-1 w-24"
                   defaultValue={r.progressPct ?? 0}
                   onChange={(e)=>setChanges(prev => ({ ...prev, [r.id]: parseInt(e.target.value || '0', 10) }))} />
          </div>
        ))}
        {filtered.length === 0 && <div className="text-sm text-gray-500">No results</div>}
      </div>
    </main>
  );
}
