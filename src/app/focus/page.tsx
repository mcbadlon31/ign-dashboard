
"use client";
import { useEffect, useMemo, useState } from "react";

type Item = { id:string; name:string; pct:number; due?:string|null; last?:string|null };

export default function FocusPage(){
  const [coach, setCoach] = useState<string>("");
  const [items, setItems] = useState<Item[]>([]);

  async function load(){
    const j = await fetch(`/api/coach/summary?coach=${encodeURIComponent(coach||'')}`).then(r=>r.json());
    const rows = (j.items||[]).map((x:any)=>({ id:x.personId, name:x.name + (x.goal?` • ${x.goal}`:''), pct:x.pct||x.readinessIndex||0, last:x.lastActivity, due:null }));
    setItems(rows);
  }

  const dueSoon = useMemo(()=> items.filter(x=>x.pct<25).slice(0,10), [items]);
  const inactive = useMemo(()=> items.filter(x=>!x.last).slice(0,10), [items]);

  return (
    <main className="p-3 sm:p-6">
      <h1 className="text-2xl font-semibold mb-4">Daily Focus</h1>
      <div className="flex items-center gap-2 mb-4">
        <input className="border rounded px-2 py-1" placeholder="My email (coach)" value={coach} onChange={(e)=>setCoach(e.target.value)} />
        <button className="px-3 py-1.5 rounded border" onClick={load}>Load</button>
      </div>

      <section className="mb-5">
        <div className="text-sm text-gray-500 mb-1">Due soon / low progress</div>
        <div className="grid gap-2">
          {dueSoon.map(x=>(
            <div key={x.id} className="p-3 border rounded flex items-center justify-between text-sm">
              <div>{x.name}</div>
              <button className="px-2 py-1 rounded border text-xs" onClick={async()=>{ await fetch('/api/activities', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ personId: x.id, type: 'FollowUp', notes: 'Quick check-in' }) }); alert('Logged'); }}>+ Follow‑up</button>
            </div>
          ))}
          {!dueSoon.length && <div className="text-sm text-gray-500">All clear 🎉</div>}
        </div>
      </section>

      <section>
        <div className="text-sm text-gray-500 mb-1">Inactive (no recent activity)</div>
        <div className="grid gap-2">
          {inactive.map(x=>(
            <div key={x.id} className="p-3 border rounded flex items-center justify-between text-sm">
              <div>{x.name}</div>
              <button className="px-2 py-1 rounded border text-xs" onClick={async()=>{ await fetch('/api/activities', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ personId: x.id, type: 'Coaching', notes: 'Nudge to re-engage' }) }); alert('Logged'); }}>+ Coaching</button>
            </div>
          ))}
          {!inactive.length && <div className="text-sm text-gray-500">No inactive folks 🎉</div>}
        </div>
      </section>
    </main>
  );
}
