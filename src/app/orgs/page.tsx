
"use client";
import { useEffect, useState } from "react";

export default function OrgsPage(){
  const [rows, setRows] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  async function load(){
    const r = await fetch('/api/orgs').then(r=>r.json());
    setRows(r);
  }
  useEffect(()=>{ load(); }, []);

  async function setOrg(slugOrId: string){
    document.cookie = `ign_org=${slugOrId}; path=/; max-age=31536000`;
    alert('Organization switched');
  }

  async function create(){
    const r = await fetch('/api/orgs', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, slug }) });
    if (!r.ok) { const j=await r.json(); alert(j.error||'Failed'); return; }
    setName(""); setSlug(""); load();
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-4">Organizations</h1>
      <div className="grid gap-3 max-w-xl">
        <div className="p-3 border rounded">
          <div className="font-medium mb-1">Create New</div>
          <div className="flex flex-wrap items-center gap-2">
            <input className="border rounded px-2 py-1" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
            <input className="border rounded px-2 py-1" placeholder="slug" value={slug} onChange={e=>setSlug(e.target.value)} />
            <button className="px-3 py-1.5 rounded border" onClick={create}>Create</button>
          </div>
        </div>
        <div className="p-3 border rounded">
          <div className="font-medium mb-1">Switch</div>
          <ul className="text-sm grid gap-1">
            {rows.map((o:any)=>(
              <li key={o.id} className="flex items-center justify-between">
                <span>{o.name} <span className="text-gray-500">({o.slug})</span></span>
                <button className="px-2 py-1 rounded border text-xs" onClick={()=>setOrg(o.slug)}>Use</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
