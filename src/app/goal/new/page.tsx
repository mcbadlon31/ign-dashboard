
"use client";
import { useEffect, useState } from "react";

type Person = { id: string; fullName: string };
type Role = { id: string; name: string };

export default function NewGoal() {
  const [people, setPeople] = useState<Person[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [personId, setPersonId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [targetDate, setTargetDate] = useState<string>("");
  const [rationale, setRationale] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const p = await fetch("/api/people-min").then(r=>r.json());
      const r = await fetch("/api/roles").then(r=>r.json());
      setPeople(p);
      setRoles(r);
    })();
  }, []);

  async function submit() {
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personId, targetRoleId: roleId, targetDate, rationale }),
    });
    const data = await res.json();
    setMsg(JSON.stringify(data));
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-4">Start a Goal</h1>
      <div className="p-4 border bg-white rounded-xl shadow-sm grid gap-3 max-w-xl">
        <select className="border rounded px-2 py-1" value={personId} onChange={(e)=>setPersonId(e.target.value)}>
          <option value="">Select person</option>
          {people.map(p=>(<option key={p.id} value={p.id}>{p.fullName}</option>))}
        </select>

        <select className="border rounded px-2 py-1" value={roleId} onChange={(e)=>setRoleId(e.target.value)}>
          <option value="">Target role</option>
          {roles.map(r=>(<option key={r.id} value={r.id}>{r.name}</option>))}
        </select>

        <input type="date" className="border rounded px-2 py-1" value={targetDate} onChange={(e)=>setTargetDate(e.target.value)} />

        <textarea className="border rounded px-2 py-1" placeholder="Rationale (optional)" value={rationale} onChange={(e)=>setRationale(e.target.value)} />

        <button onClick={submit} className="px-3 py-1.5 rounded bg-black text-white w-fit">Create Goal</button>
        {msg && <pre className="text-xs bg-gray-100 p-2 rounded">{msg}</pre>}
      </div>
    </main>
  );
}
