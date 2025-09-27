
"use client";
import { useEffect, useState } from "react";
type Role = { id: string; name: string; colorHex: string; tier: number; isActive: boolean };

export function Legend({ roles: initial }:{ roles: Role[] }) {
  const [roles, setRoles] = useState<Role[]>(initial);

  async function updateRoleColor(id: string, colorHex: string){
    setRoles(prev => prev.map(r => r.id === id ? { ...r, colorHex } : r));
    await fetch(`/api/roles/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ colorHex }) });
  }

  useEffect(()=>{ setRoles(initial); }, [initial]);

  return (
    <div className="p-3 border rounded-xl bg-white shadow-sm text-sm">
      <div className="font-medium mb-2">Legend</div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {roles.map(r => (
          <li key={r.id} className="flex items-center gap-2">
            <input type="color" value={r.colorHex} onChange={(e)=>updateRoleColor(r.id, e.target.value)} />
            <span>{r.name}</span>
          </li>
        ))}
      </ul>
      <div className="text-xs text-gray-500 mt-2">
        Fill = Goal role color • Badge = Current role
      </div>
    </div>
  );
}
