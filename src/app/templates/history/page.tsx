
"use client";
import { useEffect, useState } from "react";

export default function TemplateHistory(){
  const [roleId, setRoleId] = useState<string>("");
  const [goalId, setGoalId] = useState<string>(""); // optional: migrate target
  const [roles, setRoles] = useState<any[]>([]);
  const [list, setList] = useState<any[]>([]);
  const [selA, setSelA] = useState<string>("");
  const [selB, setSelB] = useState<string>("");
  const [diff, setDiff] = useState<any|null>(null);

  useEffect(()=>{ (async()=>{
    try {
      setRoles(await fetch('/api/roles').then(r=>r.json()));
    } catch {}
  })(); }, []);

  async function load(){
    if (!roleId) return;
    const rows = await fetch(`/api/templates/version/list?roleId=${roleId}`).then(r=>r.json());
    setList(rows);
  }

  async function doDiff(){
    if (!selA || !selB) return;
    const d = await fetch(`/api/templates/version/diff?a=${selA}&b=${selB}`).then(r=>r.json());
    setDiff(d);
  }

  async function migrate(){
    if (!goalId || !selB) return alert('Set goalId and pick "To" version');
    const r = await fetch(`/api/goals/${goalId}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ migrateToVersionId: selB }) });
    if (!r.ok) { const j = await r.json(); alert(j.error || 'Failed'); return; }
    alert('Goal migrated');
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-4">Template Version History</h1>
      <div className="grid gap-2 max-w-2xl">
        <div className="flex items-center gap-2">
          <select className="border rounded px-2 py-1" value={roleId} onChange={e=>setRoleId(e.target.value)}>
            <option value="">Select role…</option>
            {roles.map((r:any)=>(<option key={r.id} value={r.id}>{r.name}</option>))}
          </select>
          <button className="px-3 py-1.5 rounded border" onClick={load}>Load Versions</button>
        </div>

        {!!list.length && (
          <div className="p-3 border rounded">
            <div className="grid sm:grid-cols-2 gap-2">
              <div>
                <div className="text-sm text-gray-600">From (A)</div>
                <select className="border rounded px-2 py-1 w-full" value={selA} onChange={e=>setSelA(e.target.value)}>
                  <option value="">—</option>
                  {list.map((v:any)=>(<option key={v.id} value={v.id}>v{v.version}</option>))}
                </select>
              </div>
              <div>
                <div className="text-sm text-gray-600">To (B)</div>
                <select className="border rounded px-2 py-1 w-full" value={selB} onChange={e=>setSelB(e.target.value)}>
                  <option value="">—</option>
                  {list.map((v:any)=>(<option key={v.id} value={v.id}>v{v.version}</option>))}
                </select>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input className="border rounded px-2 py-1" placeholder="Goal ID (optional for migrate)" value={goalId} onChange={(e)=>setGoalId(e.target.value)} />
              <button className="px-3 py-1.5 rounded border" onClick={doDiff}>Diff</button>
              <button className="px-3 py-1.5 rounded border" onClick={migrate}>Migrate goal to (B)</button>
            </div>
          </div>
        )}

        {diff && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 border rounded">
              <div className="font-medium">Added</div>
              <ul className="text-sm mt-1">{diff.add.map((m:any,i:number)=>(<li key={i}>+ {m.title}</li>))}</ul>
            </div>
            <div className="p-3 border rounded">
              <div className="font-medium">Removed</div>
              <ul className="text-sm mt-1">{diff.rem.map((m:any,i:number)=>(<li key={i}>− {m.title}</li>))}</ul>
            </div>
            <div className="p-3 border rounded">
              <div className="font-medium">Unchanged</div>
              <ul className="text-sm mt-1">{diff.same.map((m:any,i:number)=>(<li key={i}>• {m.title}</li>))}</ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
