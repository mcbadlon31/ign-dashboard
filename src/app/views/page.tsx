"use client";

import { useEffect, useState } from "react";

type SavedView = {
  id: string;
  name: string;
  slug: string;
  outreachId?: string | null;
  isPublic: boolean;
};

type ViewForm = {
  name: string;
  slug: string;
  outreachId: string;
  isPublic: boolean;
  role: string;
  status: string;
  tagIds: string;
  sort: string;
};

const INITIAL_FORM: ViewForm = {
  name: "",
  slug: "",
  outreachId: "",
  isPublic: true,
  role: "",
  status: "",
  tagIds: "",
  sort: "",
};

export default function ViewsPage() {
  const [views, setViews] = useState<SavedView[]>([]);
  const [form, setForm] = useState<ViewForm>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/views");
    if (!res.ok) return;
    const data = await res.json();
    setViews(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleSubmit() {
    if (!form.name.trim() || !form.slug.trim()) {
      alert("Name and slug are required.");
      return;
    }
    setLoading(true);
    try {
      const filters = {
        role: form.role || undefined,
        status: form.status || undefined,
        tagIds: form.tagIds
          ? form.tagIds.split(",").map(value => value.trim()).filter(Boolean)
          : undefined,
        sort: form.sort || undefined,
      };
      const payload = {
        name: form.name,
        slug: form.slug,
        outreachId: form.outreachId || undefined,
        isPublic: form.isPublic,
        filters,
      };
      const res = await fetch("/api/views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const message = await res.json().catch(() => ({}));
        alert(message.error ?? "Failed to save view");
        return;
      }
      setForm(INITIAL_FORM);
      await load();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1 className="mb-4 text-2xl font-semibold">Saved Views</h1>
      <div className="mb-6 grid max-w-xl gap-2 rounded-xl border bg-white p-4 shadow-sm text-sm">
        <input
          className="rounded border px-2 py-1"
          placeholder="Name"
          value={form.name}
          onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
        />
        <input
          className="rounded border px-2 py-1"
          placeholder="Slug (e.g. manila-q4)"
          value={form.slug}
          onChange={event => setForm(current => ({ ...current, slug: event.target.value }))}
        />
        <input
          className="rounded border px-2 py-1"
          placeholder="Outreach ID (optional)"
          value={form.outreachId}
          onChange={event => setForm(current => ({ ...current, outreachId: event.target.value }))}
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isPublic}
            onChange={event => setForm(current => ({ ...current, isPublic: event.target.checked }))}
          />
          Public
        </label>

        <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Filters</div>
        <input
          className="rounded border px-2 py-1"
          placeholder="Role contains"
          value={form.role}
          onChange={event => setForm(current => ({ ...current, role: event.target.value }))}
        />
        <select
          className="rounded border px-2 py-1"
          value={form.status}
          onChange={event => setForm(current => ({ ...current, status: event.target.value }))}
        >
          <option value="">Status (any)</option>
          <option value="planned">Planned / Coaching</option>
          <option value="ready">Ready (≥75%)</option>
          <option value="achieved">Achieved</option>
        </select>
        <input
          className="rounded border px-2 py-1"
          placeholder="Tag IDs (comma separated)"
          value={form.tagIds}
          onChange={event => setForm(current => ({ ...current, tagIds: event.target.value }))}
        />
        <select
          className="rounded border px-2 py-1"
          value={form.sort}
          onChange={event => setForm(current => ({ ...current, sort: event.target.value }))}
        >
          <option value="">Sort (default)</option>
          <option value="readiness">Sort by readiness</option>
        </select>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="mt-2 w-fit rounded bg-slate-900 px-3 py-1.5 text-sm text-white disabled:opacity-60"
        >
          {loading ? "Saving…" : "Save View"}
        </button>
      </div>

      <div className="grid gap-3">
        {views.map(view => (
          <div key={view.id} className="flex items-center justify-between rounded-xl border bg-white p-3 shadow-sm">
            <div>
              <div className="font-medium">{view.name}</div>
              <div className="text-xs text-slate-500">
                /{view.slug} · outreach: {view.outreachId ?? "-"} · {view.isPublic ? "Public" : "Private"}
              </div>
            </div>
            <a className="rounded border px-3 py-1.5 text-sm" href={`/dashboard/${view.slug}`} target="_blank">
              Open
            </a>
          </div>
        ))}
        {views.length === 0 && <div className="text-sm text-slate-500">No saved views yet.</div>}
      </div>
    </main>
  );
}
