"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type Role = {
  id: string;
  name: string;
  tier: number;
  colorHex: string;
  isActive: boolean;
};

const DEFAULT_ROLE = { name: "", tier: 1, colorHex: "#64748B", isActive: true };

type ToastState = { type: "success" | "error"; message: string } | null;

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [form, setForm] = useState(DEFAULT_ROLE);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  async function load() {
    const res = await fetch("/api/roles");
    if (!res.ok) return;
    const data = await res.json();
    setRoles(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
  }

  async function createRole() {
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          tier: form.tier,
          colorHex: form.colorHex,
          isActive: form.isActive,
        }),
      });
      if (!res.ok) throw new Error("Unable to create role");
      setForm(DEFAULT_ROLE);
      await load();
      showToast("success", "Role created.");
    } catch (error) {
      console.error(error);
      showToast("error", "Unable to create role.");
    } finally {
      setLoading(false);
    }
  }

  async function updateRole(id: string, patch: Partial<Role>) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/roles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Unable to update role");
      await load();
      showToast("success", "Role updated.");
    } catch (error) {
      console.error(error);
      showToast("error", "Unable to update role.");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteRole(id: string) {
    const confirmed = window.confirm("Delete this role?");
    if (!confirmed) return;
    setSavingId(id);
    try {
      const res = await fetch(`/api/roles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Unable to delete role");
      await load();
      showToast("success", "Role deleted.");
    } catch (error) {
      console.error(error);
      showToast("error", "Unable to delete role.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Roles"
        description="Manage the progression tiers and colors used across goals and outreach cards."
        actions={
          <Button
            variant="outline"
            onClick={() => void load()}
            disabled={loading || savingId !== null}
          >
            Refresh
          </Button>
        }
      />

      {toast && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {toast.message}
        </div>
      )}

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Create role</CardTitle>
          <CardDescription>
            Define the target role name, tier, and primary color. Newly created roles are active by default.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Role name
            </label>
            <Input
              placeholder="Role title"
              value={form.name}
              onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tier
            </label>
            <Input
              type="number"
              min={1}
              value={form.tier}
              onChange={event =>
                setForm(prev => ({ ...prev, tier: Number(event.target.value) || 1 }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Color
            </label>
            <Input
              type="color"
              value={form.colorHex}
              onChange={event => setForm(prev => ({ ...prev, colorHex: event.target.value }))}
              className="h-10 w-full cursor-pointer rounded-full border border-slate-300 bg-white px-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </label>
            <Select
              value={form.isActive ? "active" : "inactive"}
              onChange={event =>
                setForm(prev => ({ ...prev, isActive: event.target.value === "active" }))
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
          <div className="md:col-span-5 flex justify-end">
            <Button onClick={createRole} disabled={loading || !form.name.trim()}>
              {loading ? "Saving..." : "Add role"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles.map(role => {
          const isSaving = savingId === role.id;
          return (
            <Card key={role.id}>
              <CardHeader className="flex flex-col gap-3 border-b border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                  <Badge variant={role.isActive ? "success" : "warning"}>
                    {role.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription>Tier {role.tier}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200"
                    style={{ backgroundColor: role.colorHex }}
                    aria-hidden
                  />
                  <Input
                    defaultValue={role.colorHex}
                    type="color"
                    className="h-10 w-16 cursor-pointer rounded-full border border-slate-300 bg-white px-2"
                    onChange={event => updateRole(role.id, { colorHex: event.target.value })}
                    aria-label={`Update color for ${role.name}`}
                    disabled={isSaving}
                  />
                </div>
                <div className="grid gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Role name
                    </label>
                    <Input
                      defaultValue={role.name}
                      onBlur={event => {
                        const value = event.target.value.trim();
                        if (value && value !== role.name) {
                          void updateRole(role.id, { name: value });
                        } else {
                          event.target.value = role.name;
                        }
                      }}
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Tier
                    </label>
                    <Input
                      type="number"
                      defaultValue={role.tier}
                      min={1}
                      onBlur={event => {
                        const next = Number(event.target.value || role.tier);
                        if (!Number.isNaN(next) && next !== role.tier) {
                          void updateRole(role.id, { tier: next });
                        } else {
                          event.target.value = String(role.tier);
                        }
                      }}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Select
                      value={role.isActive ? "active" : "inactive"}
                      onChange={event =>
                        updateRole(role.id, { isActive: event.target.value === "active" })
                      }
                      disabled={isSaving}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => deleteRole(role.id)}
                      disabled={isSaving}
                    >
                      {isSaving ? "Removing..." : "Delete"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {roles.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-slate-500">
            No roles yet. Add your first target role to kick-start milestone planning.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
