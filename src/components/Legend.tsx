"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type Role = { id: string; name: string; colorHex: string; tier: number; isActive: boolean };

type Props = {
  roles: Role[];
  className?: string;
};

export function Legend({ roles: initial, className }: Props) {
  const [roles, setRoles] = useState<Role[]>(initial);

  async function updateRoleColor(id: string, colorHex: string) {
    setRoles(prev => prev.map(role => (role.id === id ? { ...role, colorHex } : role)));
    await fetch(`/api/roles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ colorHex }),
    });
  }

  useEffect(() => {
    setRoles(initial);
  }, [initial]);

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="font-semibold text-slate-800">Legend</div>
        <span className="text-xs uppercase tracking-wide text-slate-400">Goal / Role</span>
      </div>
      <ul className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        {roles.map(role => (
          <li key={role.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
            <div className="flex items-center gap-3">
              <span
                className="h-4 w-4 rounded-full border border-slate-300"
                style={{ backgroundColor: role.colorHex }}
                aria-hidden
              />
              <span className="font-medium text-slate-700">{role.name}</span>
            </div>
            <input
              type="color"
              value={role.colorHex}
              onChange={event => updateRoleColor(role.id, event.target.value)}
              className="h-7 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0"
              aria-label={`Select color for ${role.name}`}
            />
          </li>
        ))}
      </ul>
      <div className="mt-3 text-xs text-slate-500">
        Fill represents the target role color. The badge on each card shows the person's current role.
      </div>
    </div>
  );
}
