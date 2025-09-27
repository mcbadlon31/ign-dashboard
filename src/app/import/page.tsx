
"use client";
import { useState } from "react";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function upload() {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/import/excel", { method: "POST", body: fd });
    const data = await res.json();
    setMsg(JSON.stringify(data, null, 2));
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-4">Excel Import</h1>
      <input type="file" accept=".xlsx,.xls" onChange={(e)=>setFile(e.target.files?.[0] ?? null)} />
      <button className="ml-3 px-3 py-1.5 rounded bg-black text-white" onClick={upload}>Upload</button>
      <pre className="mt-4 text-xs bg-gray-100 p-3 rounded">{msg}</pre>
    </main>
  );
}
