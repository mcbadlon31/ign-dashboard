"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type ToastState = { type: "success" | "error"; message: string } | null;

type TemplatesResponse = Record<string, string[]>;

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplatesResponse>({});
  const [selectedRole, setSelectedRole] = useState("");
  const [newMilestone, setNewMilestone] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  async function load() {
    try {
      const res = await fetch("/api/templates");
      if (!res.ok) throw new Error("Failed to load templates");
      const data = (await res.json()) as TemplatesResponse;
      setTemplates(data ?? {});
      if (!selectedRole) {
        const firstRole = Object.keys(data ?? {})[0];
        if (firstRole) setSelectedRole(firstRole);
      }
    } catch (error) {
      console.error(error);
      setToast({ type: "error", message: "Unable to load templates." });
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const milestones = useMemo(() => templates[selectedRole] ?? [], [templates, selectedRole]);

  function addMilestone() {
    const value = newMilestone.trim();
    if (!selectedRole || !value) return;
    setTemplates(prev => ({ ...prev, [selectedRole]: [...(prev[selectedRole] || []), value] }));
    setNewMilestone("");
  }

  function removeMilestone(index: number) {
    setTemplates(prev => ({
      ...prev,
      [selectedRole]: prev[selectedRole].filter((_, idx) => idx !== index),
    }));
  }

  function reorderMilestone(from: number, to: number) {
    setTemplates(prev => {
      const list = [...(prev[selectedRole] || [])];
      const [item] = list.splice(from, 1);
      list.splice(to, 0, item);
      return { ...prev, [selectedRole]: list };
    });
  }

  async function saveAll() {
    setSaving(true);
    try {
      const res = await fetch("/api/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templates),
      });
      if (!res.ok) throw new Error("Failed to save templates");
      setToast({ type: "success", message: "Templates saved." });
    } catch (error) {
      console.error(error);
      setToast({ type: "error", message: "Unable to save templates." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Milestone templates"
        description="Curate the checklist each role starts with. Drag milestones to reorder and publish changes when you are ready."
        actions={
          <Button variant="outline" onClick={() => void load()} disabled={saving}>
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

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Role templates</CardTitle>
          <CardDescription>
            Select a target role to adjust its checklist. Saving will update src/config/role-milestones.json for local development.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[220px,1fr]">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Role
              </label>
              <Select value={selectedRole} onChange={event => setSelectedRole(event.target.value)}>
                <option value="">Select role</option>
                {Object.keys(templates).map(role => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Add milestone
              </label>
              <Input
                placeholder="Write the next milestone"
                value={newMilestone}
                onChange={event => setNewMilestone(event.target.value)}
                disabled={!selectedRole}
              />
              <Button onClick={addMilestone} disabled={!selectedRole || !newMilestone.trim()}>
                Add milestone
              </Button>
            </div>
            <Button variant="outline" onClick={saveAll} disabled={saving}>
              {saving ? "Saving..." : "Save all changes"}
            </Button>
          </div>

          <div className="space-y-4">
            {!selectedRole ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center text-sm text-slate-500">
                  Choose a role to review or edit its milestone checklist.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedRole}</CardTitle>
                  <CardDescription>
                    Drag milestones to reorder. Changes are saved locally until you publish them.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="grid gap-2">
                    {milestones.map((milestone, index) => (
                      <li
                        key={`${milestone}-${index}`}
                        draggable
                        onDragStart={event => event.dataTransfer.setData("text/plain", String(index))}
                        onDragOver={event => event.preventDefault()}
                        onDrop={event => {
                          const from = Number(event.dataTransfer.getData("text/plain"));
                          reorderMilestone(from, index);
                        }}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"
                      >
                        <span className="truncate font-medium text-slate-700">{milestone}</span>
                        <Button variant="ghost" onClick={() => removeMilestone(index)}>
                          Remove
                        </Button>
                      </li>
                    ))}
                    {milestones.length === 0 && (
                      <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-4 text-center text-sm text-slate-500">
                        No milestones yet for this role.
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
