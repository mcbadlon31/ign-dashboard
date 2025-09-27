
"use client";
import { useEffect, useState } from "react";

type User = { id: string; email: string; displayName?: string; appRole: "ADMIN"|"LEADER"|"COACH"|"VIEWER" };

export default function UsersPage(){
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({ email: "", displayName: "", appRole: "VIEWER" });

  async function load(){
    const data = await fetch("/api/users").then(r=>r.json());
    setUsers(data);
  }

  useEffect(()=>{ load(); }, []);

  async function add(){
    await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ email: "", displayName: "", appRole: "VIEWER" });
    await load();
  }

  async function updateRole(id: string, appRole: string){
    await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ appRole }) });
    await load();
  }

  async function remove(id: string){
    if (!confirm("Delete user?")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-4">Users (Admin)</h1>

      <div className="p-4 border rounded-xl bg-white shadow-sm mb-6 grid gap-2 max-w-2xl">
        <div className="font-medium">Add user</div>
        <input value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} placeholder="user@example.com" className="border rounded px-2 py-1" />
        <input value={form.displayName} onChange={(e)=>setForm({...form, displayName: e.target.value})} placeholder="Display name (optional)" className="border rounded px-2 py-1" />
        <select value={form.appRole} onChange={(e)=>setForm({...form, appRole: e.target.value})} className="border rounded px-2 py-1">
          <option value="VIEWER">VIEWER</option>
          <option value="COACH">COACH</option>
          <option value="LEADER">LEADER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <button onClick={add} className="px-3 py-1.5 rounded bg-black text-white w-fit">Add</button>
      </div>

      <div className="grid gap-2 max-w-3xl">
        {users.map(u => (
          <div key={u.id} className="p-3 border rounded-xl bg-white shadow-sm flex items-center justify-between">
            <div>
              <div className="font-medium">{u.displayName || u.email}</div>
              <div className="text-xs text-gray-500">{u.email}</div>
            </div>
            <div className="flex items-center gap-2">
              <select value={u.appRole} onChange={(e)=>updateRole(u.id, e.target.value)} className="border rounded px-2 py-1 text-sm">
                <option value="VIEWER">VIEWER</option>
                <option value="COACH">COACH</option>
                <option value="LEADER">LEADER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <button onClick={()=>remove(u.id)} className="px-3 py-1.5 rounded border">Delete</button>
            </div>
          </div>
        ))}
        {users.length === 0 && <div className="text-sm text-gray-500">No users yet.</div>}
      </div>
    </main>
  );
}
