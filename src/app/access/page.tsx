"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type AccessRow = {
  id: string;
  userEmail: string;
  outreachId: string;
  role: "ADMIN" | "LEADER" | "COACH" | "VIEWER";
  outreach: { id: string; name: string };
};

type Outreach = { id: string; name: string };

const ROLE_OPTIONS: Array<AccessRow["role"]> = ["LEADER", "COACH", "VIEWER", "ADMIN"];

export default function AccessPage() {
  const [rows, setRows] = useState<AccessRow[]>([]);
  const [outreaches, setOutreaches] = useState<Outreach[]>([]);
  const [form, setForm] = useState({ userEmail: "", outreachId: "", role: "LEADER" as AccessRow["role"] });
  const [loading, setLoading] = useState(false);

  async function load() {
    const [accessRes, boardRes] = await Promise.all([
      fetch("/api/access"),
      fetch("/api/board"),
    ]);
    if (accessRes.ok) {
      setRows(await accessRes.json());
    }
    if (boardRes.ok) {
      const data = await boardRes.json();
      setOutreaches(Array.isArray(data?.outreaches) ? data.outreaches : []);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function addAccess() {
    if (!form.userEmail || !form.outreachId) return;
    setLoading(true);
    try {
      await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm({ userEmail: "", outreachId: "", role: "LEADER" });
      await load();
    } finally {
      setLoading(false);
    }
  }

  async function removeAccess(id: string) {
    const confirmed = window.confirm("Remove access for this user?");
    if (!confirmed) return;
    setLoading(true);
    try {
      await fetch(`/api/access/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Outreach access"
        description="Control which leaders and coaches can manage each outreach."
        actions={
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Grant access</CardTitle>
          <CardDescription>
            Email addresses must match the identities returned by your authentication provider when bypass auth is disabled.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[2fr,2fr,1fr,auto]">
          <Input
            placeholder="user@example.com"
            value={form.userEmail}
            onChange={event => setForm(prev => ({ ...prev, userEmail: event.target.value }))}
          />
          <Select
            value={form.outreachId}
            onChange={event => setForm(prev => ({ ...prev, outreachId: event.target.value }))}
          >
            <option value="">Select outreach</option>
            {outreaches.map(outreach => (
              <option key={outreach.id} value={outreach.id}>
                {outreach.name}
              </option>
            ))}
          </Select>
          <Select
            value={form.role}
            onChange={event => setForm(prev => ({ ...prev, role: event.target.value as AccessRow["role"] }))}
          >
            {ROLE_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          <Button onClick={addAccess} disabled={loading || !form.userEmail || !form.outreachId}>
            Add
          </Button>
        </CardContent>
      </Card>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Existing access</CardTitle>
          <CardDescription>Admins inherit access to every outreach automatically.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          {rows.map(row => (
            <div
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
            >
              <div>
                <div className="font-medium text-slate-800">{row.userEmail}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <span>{row.outreach.name}</span>
                  <span>|</span>
                  <Badge variant="outline">{row.role}</Badge>
                </div>
              </div>
              <Button variant="outline" onClick={() => removeAccess(row.id)} disabled={loading}>
                Remove
              </Button>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
              No access entries yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
