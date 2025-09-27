
"use client";
import { useEffect, useMemo, useState } from "react";

export default function CoachAssign(){
  const [board, setBoard] = useState<any>(null);
  const [coaches, setCoaches] = useState<{email:string; role:string}[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [coachEmail, setCoachEmail] = useState<string>("");

  useEffect(()=>{ (async()=>{
    setBoard(await fetch('/api/board').then(r=>r.json()));
    setCoaches(await fetch('/api/coaches').then(r=>r.json()));
  })(); }, []);

  const rows = useMemo(()=> board?.people || [], [board]);
  const chosenIds = useMemo(()=> Object.entries(selected).filter(([,v])=>v).map(([k])=>k), [selected]);

  async function submit(){
    if (!coachEmail || chosenIds.length===0) return alert('Pick at least one person and a coach');
    const r = await fetch('/api/coach/reassign', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ personIds: chosenIds, coachEmail }) });
    const j = await r.json();
    alert(`Updated ${j.updated} people`);
    setSelected({});
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-4">Bulk Coach Reassign</h1>
      <div className="flex items-center gap-2 mb-3">
        <select className="border rounded px-2 py-1" value={coachEmail} onChange={(e)=>setCoachEmail(e.target.value)}>
          <option value="">Select coach…</option>
          {coaches.map(c=>(<option key={c.email} value={c.email}>{c.email}</option>))}
        </select>
        <button className="px-3 py-1.5 rounded border" onClick={submit}>Reassign Selected</button>
      </div>

      {!rows.length ? <div className="text-sm text-gray-500">Loading…</div> : (
        <div className="grid gap-1 max-h-[60vh] overflow-auto pr-2">
          {rows.map((p:any)=>(
            <label key={p.id} className="p-2 border rounded flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!selected[p.id]} onChange={(e)=>setSelected(prev=>({ ...prev, [p.id]: e.target.checked }))} />
              <span>{p.name}</span>
            </label>
          ))}
        </div>
      )}
    </main>
  );
}
