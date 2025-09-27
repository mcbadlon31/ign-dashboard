
"use client";
import { useEffect, useState } from "react";

type Role = {
  id: string;
  name: string;
  tier: number;
  colorHex: string;
  isActive: boolean;
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [newRole, setNewRole] = useState({ name: "", tier: 1, colorHex: "#64748B", isActive: true });
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/roles");
    const data = await res.json();
    setRoles(data);
  }

  useEffect(() => { load(); }, []);

  async function createRole() {
    setLoading(true);
    await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRole),
    });
    setNewRole({ name: "", tier: 1, colorHex: "#64748B", isActive: true });
    await load();
    setLoading(false);
  }

  async function updateRole(id: string, patch: Partial<Role>) {
    setLoading(true);
    await fetch(`/api/roles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await load();
    setLoading(false);
  }

  async function deleteRole(id: string) {
    if (!confirm("Delete this role?")) return;
    setLoading(true);
    await fetch(`/api/roles/${id}`, { method: "DELETE" });
    await load();
    setLoading(false);
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-4">Roles</h1>

      <div className="mb-6 p-4 border rounded-xl bg-white shadow-sm">
        <h2 className="font-medium mb-3">Create Role</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
          <input
            className="border rounded px-2 py-1"
            placeholder="Name"
            value={newRole.name}
            onChange={(e)=>setNewRole({...newRole, name: e.target.value})}
          />
          <input
            className="border rounded px-2 py-1"
            type="number"
            min={1}
            placeholder="Tier"
            value={newRole.tier}
            onChange={(e)=>setNewRole({...newRole, tier: Number(e.target.value)})}
          />
          <input
            className="border rounded px-2 py-1"
            type="color"
            value={newRole.colorHex}
            onChange={(e)=>setNewRole({...newRole, colorHex: e.target.value})}
          />
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={newRole.isActive}
              onChange={(e)=>setNewRole({...newRole, isActive: e.target.checked})}
            />
            Active
          </label>
          <button
            disabled={loading || !newRole.name}
            onClick={createRole}
            className="px-3 py-1.5 rounded bg-black text-white disabled:opacity-60"
          >
            Add
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {roles.map((r)=> (
          <div key={r.id} className="p-4 border rounded-xl bg-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded" style={{ backgroundColor: r.colorHex }}/>
              <div>
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-gray-500">Tier {r.tier} • {r.isActive ? "Active" : "Inactive"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                className="border rounded px-2 py-1 w-36"
                value={r.name}
                onChange={(e)=>updateRole(r.id, { name: e.target.value })}
                onBlur={(e)=>updateRole(r.id, { name: e.target.value })}
              />
              <input
                className="border rounded px-2 py-1 w-20"
                type="number"
                value={r.tier}
                onChange={(e)=>updateRole(r.id, { tier: Number(e.target.value) })}
                onBlur={(e)=>updateRole(r.id, { tier: Number(e.target.value) })}
              />
              <input
                type="color"
                value={r.colorHex}
                onChange={(e)=>updateRole(r.id, { colorHex: e.target.value })}
              />
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={r.isActive}
                  onChange={(e)=>updateRole(r.id, { isActive: e.target.checked })}
                />
                Active
              </label>
              <button onClick={()=>deleteRole(r.id)} className="px-3 py-1.5 rounded border text-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
