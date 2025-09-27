"use client";

import { useEffect, useState } from "react";

type DuplicateGroup = Array<{
  id: string;
  fullName: string;
  outreach?: { name: string | null } | null;
}>;

type MergeLog = {
  id: string;
  sourceId: string;
  targetId: string;
  createdAt: string;
  stats?: Record<string, unknown> | null;
  undone: boolean;
};

export default function DuplicatesPage() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/people/duplicates");
      if (!res.ok) return;
      setGroups(await res.json());
    })();
  }, []);

  return (
    <main>
      <h1 className="mb-4 text-2xl font-semibold">Possible Duplicates</h1>
      <div className="grid gap-3">
        {groups.map((group, index) => (
          <DuplicateCard key={index} index={index} people={group} />
        ))}
        {groups.length === 0 && <div className="text-sm text-slate-500">No duplicates found.</div>}
      </div>

      <hr className="my-6" />
      <RecentMerges />
    </main>
  );
}

function DuplicateCard({ index, people }: { index: number; people: DuplicateGroup }) {
  async function mergeInto(targetId: string) {
    const others = people.map(person => person.id).filter(id => id !== targetId);
    let merged = 0;
    for (const sourceId of others) {
      const res = await fetch("/api/people/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId, targetId }),
      });
      if (res.ok) merged += 1;
    }
    alert(`Merged ${merged} records into ${targetId.slice(0, 6)}`);
    window.location.reload();
  }

  return (
    <div className="rounded border bg-white p-3">
      <div className="mb-2 font-medium">{people[0]?.fullName ?? "Unknown"}</div>
      <div className="mb-2 flex flex-wrap gap-2">
        {people.map(person => (
          <code key={person.id} className="rounded bg-slate-100 px-2 py-1 text-xs">
            {person.id}
          </code>
        ))}
      </div>
      <div className="mb-2 text-xs text-slate-500">Choose a target to keep and merge the others into it.</div>
      <div className="mb-3 flex items-center gap-2 text-sm">
        <select id={`dup-target-${index}`} className="rounded border px-2 py-1">
          {people.map(person => (
            <option key={person.id} value={person.id}>
              {person.fullName} ({person.id.slice(0, 6)})
            </option>
          ))}
        </select>
        <button
          type="button"
          className="rounded border px-3 py-1.5"
          onClick={() => {
            const select = document.getElementById(`dup-target-${index}`) as HTMLSelectElement | null;
            if (select?.value) mergeInto(select.value);
          }}
        >
          Merge into selected
        </button>
      </div>
      <ul className="grid gap-1 text-sm">
        {people.map(person => (
          <li key={person.id}>
            {person.fullName} · {person.outreach?.name ?? "-"} (id: {person.id})
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecentMerges() {
  const [rows, setRows] = useState<MergeLog[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/people/merges");
      if (!res.ok) return;
      setRows(await res.json());
    })();
  }, []);

  return (
    <section>
      <h2 className="mb-2 text-xl font-semibold">Recent Merges</h2>
      <div className="grid gap-2 text-sm">
        {rows.map(row => (
          <div key={row.id} className="rounded border bg-white p-2">
            <div>
              {row.id.slice(0, 6)} — {row.sourceId.slice(0, 6)} → {row.targetId.slice(0, 6)} ·
              {" "}
              {new Date(row.createdAt).toLocaleString()}
            </div>
            {row.stats && (
              <div className="text-xs text-slate-500">stats: {JSON.stringify(row.stats)}</div>
            )}
            {!row.undone && (
              <button
                type="button"
                className="mt-1 rounded border px-2 py-1 text-xs"
                onClick={async () => {
                  await fetch("/api/people/merge", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mergeId: row.id }),
                  });
                  alert("Merge undone; source reactivated.");
                  window.location.reload();
                }}
              >
                Undo (reactivate source)
              </button>
            )}
          </div>
        ))}
        {rows.length === 0 && <div className="text-sm text-slate-500">No recent merges.</div>}
      </div>
    </section>
  );
}
