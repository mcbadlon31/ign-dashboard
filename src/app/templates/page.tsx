
"use client";
import { useEffect, useState } from "react";

export default function TemplatesPage(){
  const [data, setData] = useState<Record<string, string[]>>({});
  const [role, setRole] = useState("");
  const [newMs, setNewMs] = useState("");

  async function load(){
    const d = await fetch("/api/templates").then(r=>r.json());
    setData(d);
  }
  useEffect(()=>{ load(); }, []);

  function addMs(){
    if (!role || !newMs) return;
    setData(prev => ({ ...prev, [role]: [...(prev[role] || []), newMs] }));
    setNewMs("");
  }

  function removeMs(roleName: string, idx: number){
    setData(prev => ({ ...prev, [roleName]: prev[roleName].filter((_,i)=>i!==idx) }));
  }

  async function save(){
    await fetch("/api/templates", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    alert("Saved");
  }

  function move(roleName: string, from: number, to: number){
    setData(prev => {
      const list = [...(prev[roleName] || [])];
      const [it] = list.splice(from, 1);
      list.splice(to, 0, it);
      return { ...prev, [roleName]: list };
    });
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-4">Milestone Templates</h1>

      <div className="p-4 border rounded-xl bg-white shadow-sm mb-4 flex gap-2 items-center">
        <select className="border rounded px-2 py-1" value={role} onChange={(e)=>setRole(e.target.value)}>
          <option value="">Select role</option>
          {Object.keys(data).map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <input className="border rounded px-2 py-1" placeholder="New milestone" value={newMs} onChange={(e)=>setNewMs(e.target.value)} />
        <button onClick={addMs} className="px-3 py-1.5 rounded border">Add</button>
        <button onClick={save} className="px-3 py-1.5 rounded bg-black text-white">Save All</button>
      </div>

      {role && (
        <div className="p-4 border rounded-xl bg-white shadow-sm">
          <div className="font-medium mb-2">{role}</div>
          <ul className="grid gap-2">
            {(data[role] || []).map((m, i) => (
              <li key={i} className="flex items-center justify-between" draggable onDragStart={(e)=>{ e.dataTransfer.setData("text/plain", String(i)); }} onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{ const from = Number(e.dataTransfer.getData("text/plain")); move(role, from, i); }}>
                <span>{m}</span>
                <button onClick={()=>removeMs(role, i)} className="px-2 py-1 rounded border text-xs">Remove</button>
              </li>
            ))}
            {(data[role] || []).length === 0 && <div className="text-sm text-gray-500">No milestones yet</div>}
          </ul>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-4">Note: template edits write to <code>src/config/role-milestones.json</code> (fine for local dev).</div>
    </main>
  );
}
