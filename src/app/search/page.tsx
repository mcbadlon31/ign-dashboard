
"use client";
import { useEffect, useState } from "react";

export default function SearchPage(){
  const [q, setQ] = useState("");
  const [res, setRes] = useState<any>(null);

  async function run(){
    const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`).then(r=>r.json());
    setRes(r);
  }

  useEffect(()=>{
    const sp = new URLSearchParams(window.location.search);
    const init = sp.get('q') || '';
    if (init) { setQ(init); setTimeout(run, 0); }
  }, []);

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-4">Search</h1>
      <div className="mb-4 flex gap-2">
        <input className="border rounded px-2 py-1" placeholder="Type a name, tag, outreach…" value={q} onChange={(e)=>setQ(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter') run(); }} />
        <button onClick={run} className="px-3 py-1.5 rounded border">Search</button>
      </div>

      {!res ? <div className="text-sm text-gray-500">No results</div> : (
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <div className="font-medium mb-2">People</div>
            <ul className="text-sm grid gap-1">
              {res.people.map((p:any)=>(<li key={p.id}>{p.fullName}{p.outreach?.name ? ` • ${p.outreach.name}` : ''}</li>))}
              {!res.people.length && <li className="text-gray-500">—</li>}
            </ul>
          </div>
          <div>
            <div className="font-medium mb-2">Tags</div>
            <ul className="text-sm grid gap-1">
              {res.tags.map((t:any)=>(<li key={t.id}>{t.name}</li>))}
              {!res.tags.length && <li className="text-gray-500">—</li>}
            </ul>
          </div>
          <div>
            <div className="font-medium mb-2">Outreaches</div>
            <ul className="text-sm grid gap-1">
              {res.outreaches.map((o:any)=>(<li key={o.id}>{o.name}</li>))}
              {!res.outreaches.length && <li className="text-gray-500">—</li>}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}
