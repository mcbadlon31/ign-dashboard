
"use client";
import { postWithQueue } from "@/lib/offlineQueue";
import { useEffect, useMemo, useState } from "react";

type Person = { id: string; fullName: string; outreach?: { id: string; name: string } | null };

export default function BatchActivities(){
  const [people, setPeople] = useState<Person[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [type, setType] = useState("FollowUp");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState<string>("");
  const [q, setQ] = useState("");

  useEffect(()=>{
    (async () => {
      const res = await fetch("/api/board");
      const data = await res.json();
      const list = await fetch("/api/people-min").then(r=>r.json());
      // enrich with outreach names from board data (if present)
      const outreachById = new Map<string, string>(data.outreaches.map((o: any)=>[o.id, o.name]));
      setPeople(list.map((p: any) => ({ ...p, outreach: p.outreachId ? { id: p.outreachId, name: outreachById.get(p.outreachId) } : null })));
    })();
  }, []);

  const filtered = useMemo(()=>{
    const qq = q.toLowerCase();
    return people.filter(p => p.fullName.toLowerCase().includes(qq));
  }, [q, people]);

  function toggleAll(val: boolean){
    const m: Record<string, boolean> = {};
    for (const p of filtered) m[p.id] = val;
    setChecked(m);
  }

  async function submit(){
    const ids = Object.keys(checked).filter(k => checked[k]);
    if (ids.length === 0) return alert("Pick at least one person");
    const res = await fetch("/api/activities/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personIds: ids, type, notes, date: date || undefined }),
    });
    const json = await res.json();
    if (!res.ok) return alert(json.error || "Failed");
    setChecked({});
    setNotes("");
    setDate("");
    window.dispatchEvent(new Event("data-updated"));
    alert(`Logged ${json.created} activities`);
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-4">Batch Activity Logging</h1>

      <div className="p-4 border rounded-xl bg-white shadow-sm grid gap-2 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input className="border rounded px-2 py-1" placeholder="Search name…" value={q} onChange={(e)=>setQ(e.target.value)} />
          <select className="border rounded px-2 py-1" value={type} onChange={(e)=>setType(e.target.value)}>
            <option>FollowUp</option>
            <option>Coaching</option>
            <option>Prayer</option>
            <option>Training</option>
            <option>Outreach</option>
          </select>
          <input type="date" className="border rounded px-2 py-1" value={date} onChange={(e)=>setDate(e.target.value)} />
          <button className="px-3 py-1.5 rounded border" onClick={()=>toggleAll(true)}>Select all (filtered)</button>
        </div>
        <textarea className="border rounded px-2 py-1" placeholder="Notes (optional)" value={notes} onChange={(e)=>setNotes(e.target.value)} />
        <button onClick={submit} className="px-3 py-1.5 rounded bg-black text-white w-fit">Log Activities</button>
      </div>

      <div className="grid gap-2 max-h-[50vh] overflow-auto pr-2">
        {filtered.map(p => (
          <label key={p.id} className="flex items-center justify-between p-2 border rounded">
            <span className="text-sm">{p.fullName}{p.outreach?.name ? ` • ${p.outreach.name}` : ""}</span>
            <input type="checkbox" checked={!!checked[p.id]} onChange={(e)=>setChecked(prev => ({ ...prev, [p.id]: e.target.checked }))} />
          </label>
        ))}
        {filtered.length === 0 && <div className="text-sm text-gray-500">No results</div>}
      </div>
    </main>
  );
}
