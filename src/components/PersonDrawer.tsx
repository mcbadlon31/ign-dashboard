"use client";

import { useEffect, useState } from "react";

type Milestone = { id: string; name: string; completed: boolean };
type Activity = { id: string; date: string; type: string; notes?: string | null };
type Role = { id: string; name: string; colorHex?: string | null };

type PersonDetail = {
  id: string;
  name: string;
  currentRole: string | null;
  goal: { id: string; name: string; colorHex?: string | null } | null;
  milestones: Milestone[];
  activities: Activity[];
};

type Props = {
  personId: string;
  onClose: () => void;
};

export function PersonDrawer({ personId, onClose }: Props) {
  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const [personRes, roleRes] = await Promise.all([
        fetch(`/api/person/${personId}`).then(r => {
          if (!r.ok) throw new Error("Failed to load person");
          return r.json();
        }),
        fetch("/api/roles").then(r => (r.ok ? r.json() : [])),
      ]);
      setPerson(personRes);
      setRoles(Array.isArray(roleRes) ? roleRes : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [personId]);

  async function updatePerson(data: Record<string, unknown>) {
    try {
      await fetch(`/api/person/${personId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      await load();
    } catch (error) {
      console.error(error);
    }
  }

  async function toggleMilestone(milestone: Milestone) {
    setPerson(prev =>
      prev
        ? {
            ...prev,
            milestones: prev.milestones.map(m =>
              m.id === milestone.id ? { ...m, completed: !m.completed } : m,
            ),
          }
        : prev,
    );
    try {
      await fetch(`/api/milestones/${milestone.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !milestone.completed }),
      });
      await load();
    } catch (error) {
      console.error(error);
    }
  }

  async function addActivity() {
    if (!note.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId, type: "Coaching", notes: note.trim() }),
      });
      setNote("");
      await load();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  async function createGoal(targetRoleId: string) {
    if (!targetRoleId) return;
    setSaving(true);
    try {
      await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId, targetRoleId }),
      });
      await load();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-black/40" onClick={onClose}>
      <div
        className="ml-auto h-full w-full max-w-xl overflow-y-auto bg-white p-4 shadow-xl"
        onClick={event => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="text-lg font-semibold">Person Details</div>
          <button className="text-sm text-slate-500 hover:text-slate-900" onClick={onClose}>
            Close
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-slate-500">Loading…</div>
        ) : !person ? (
          <div className="text-sm text-red-500">Unable to load person details.</div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500">Name</label>
              <input
                className="mt-1 w-full rounded border px-2 py-1"
                value={person.name}
                onChange={event =>
                  setPerson(prev => (prev ? { ...prev, name: event.target.value } : prev))
                }
                onBlur={event => updatePerson({ fullName: event.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Current Role</label>
              <select
                className="mt-1 w-full rounded border px-2 py-1"
                value={person.currentRole ?? ""}
                onChange={event => updatePerson({ currentRoleName: event.target.value })}
              >
                <option value="">-</option>
                {roles.map(role => (
                  <option key={role.id} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Goal Role</label>
              <select
                className="mt-1 w-full rounded border px-2 py-1"
                value={person.goal?.id ?? ""}
                onChange={event => createGoal(event.target.value)}
              >
                <option value="">-</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-2 text-sm font-medium">Milestones</div>
              <ul className="space-y-2">
                {person.milestones.length === 0 && (
                  <li className="text-sm text-slate-500">No milestones yet.</li>
                )}
                {person.milestones.map(milestone => (
                  <li key={milestone.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={milestone.completed}
                      onChange={() => toggleMilestone(milestone)}
                    />
                    <span className={milestone.completed ? "line-through text-slate-400" : ""}>
                      {milestone.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="mb-2 text-sm font-medium">Recent Activity</div>
              <div className="mb-2 flex gap-2">
                <input
                  className="flex-1 rounded border px-2 py-1 text-sm"
                  placeholder="Add coaching note"
                  value={note}
                  onChange={event => setNote(event.target.value)}
                />
                <button
                  onClick={addActivity}
                  disabled={saving}
                  className="rounded bg-slate-900 px-3 py-1 text-sm text-white disabled:opacity-60"
                >
                  Add
                </button>
              </div>
              <ul className="space-y-1 text-sm">
                {person.activities.length === 0 && (
                  <li className="text-slate-500">No recent activity.</li>
                )}
                {person.activities.map(activity => (
                  <li key={activity.id} className="flex justify-between gap-2">
                    <span>
                      {new Date(activity.date).toLocaleDateString()} · {activity.type}
                    </span>
                    {activity.notes && <span className="text-slate-500">{activity.notes}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
