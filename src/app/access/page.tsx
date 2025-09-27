
"use client";
import { useEffect, useState } from "react";

type Access = { id: string; userEmail: string; outreachId: string; role: "ADMIN"|"LEADER"|"COACH"|"VIEWER"; outreach: { id: string; name: string } };
type Outreach = { id: string; name: string };

export default function AccessPage(){
  const [rows, setRows] = useState<Access[]>([]);
  const [outreaches, setOutreaches] = useState<Outreach[]>([]);
  const [form, setForm] = useState({ userEmail: "", outreachId: "", role: "LEADER" });

  async function load(){
    const [r, o] = await Promise.all([
      fetch("/api/access").then(r=>r.json()),
      fetch("/api/board").then(r=>r.json()).then(d=>d.outreaches),
    ]);
    setRows(r);
    setOutreaches(o);
  }

  useEffect(()=>{ load(); }, []);

  async function add(){
    await fetch("/api/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ userEmail: "", outreachId: "", role: "LEADER" });
    await load();
  }

  async function remove(id: string){
    if (!confirm("Remove access?")) return;
    await fetch(`/api/access/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-4">Outreach Access (Admin)</h1>

      <div className="p-4 border rounded-xl bg-white shadow-sm mb-6 grid gap-2 max-w-2xl">
        <div className="font-medium">Add access</div>
        <input value={form.userEmail} onChange={(e)=>setForm({...form, userEmail: e.target.value})} placeholder="user@example.com" className="border rounded px-2 py-1" />
        <select value={form.outreachId} onChange={(e)=>setForm({...form, outreachId: e.target.value})} className="border rounded px-2 py-1">
          <option value="">Select outreach</option>
          {outreaches.map(o=>(<option key={o.id} value={o.id}>{o.name}</option>))}
        </select>
        <select value={form.role} onChange={(e)=>setForm({...form, role: e.target.value})} className="border rounded px-2 py-1">
          <option value="LEADER">LEADER</option>
          <option value="COACH">COACH</option>
          <option value="VIEWER">VIEWER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <button onClick={add} className="px-3 py-1.5 rounded bg-black text-white w-fit">Add</button>
      </div>

      <div className="grid gap-2 max-w-3xl">
        {rows.map(r => (
          <div key={r.id} className="p-3 border rounded-xl bg-white shadow-sm flex items-center justify-between">
            <div>
              <div className="font-medium">{r.userEmail}</div>
              <div className="text-xs text-gray-500">{r.outreach.name} • {r.role}</div>
            </div>
            <button onClick={()=>remove(r.id)} className="px-3 py-1.5 rounded border">Remove</button>
          </div>
        ))}
        {rows.length === 0 && <div className="text-sm text-gray-500">No access entries yet.</div>}
      </div>
    </main>
  );
}
