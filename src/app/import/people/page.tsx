
"use client";
import { useState } from "react";

const sample = `name,outreach,coachEmail,currentRoleName,goalTargetRoleName,targetDate
Jane Doe,Manila Outreach,coach@org.org,BS Leader,HF Leader,2025-11-30
John Smith,Manila Outreach,,Cell Dev Completer,BS Leader,2025-10-15`;

export default function ImportPeople(){
  const [text, setText] = useState(sample);
  const [res, setRes] = useState<string>("");

  async function submit(){
    const r = await fetch("/api/import/people", { method: "POST", headers: { "Content-Type": "text/plain" }, body: text });
    const j = await r.json();
    setRes(JSON.stringify(j, null, 2));
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-4">Import People (CSV)</h1>
      <p className="text-sm text-gray-600 mb-2">Columns supported: <code>name</code>, <code>outreach</code>, <code>coachEmail</code>, <code>currentRoleName</code>, <code>goalTargetRoleName</code>, <code>targetDate (YYYY-MM-DD)</code>.</p>
      <textarea className="w-full h-64 border rounded p-2 font-mono text-xs" value={text} onChange={(e)=>setText(e.target.value)} />
      <div className="mt-2 flex gap-2">
        <button onClick={submit} className="px-3 py-1.5 rounded bg-black text-white">Import</button>
      </div>
      {res && <pre className="mt-3 text-xs bg-gray-50 p-2 rounded">{res}</pre>}
    </main>
  );
}
