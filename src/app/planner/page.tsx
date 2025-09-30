"use client";

import stages from "@/config/stages.json";
import { PageHeader } from "@/components/layout/PageHeader";
import { StageBadge } from "@/components/StageBadge";

type StageConfig = { key: string; label: string; color: string; short: string; description?: string };

const stageList = stages as StageConfig[];

export default function Planner() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Trajectory Planner"
        description="Roadmap of growth milestones across the discipleship journey."
      />
      <ol className="grid gap-4 md:grid-cols-2">
        {stageList.map((stage, index) => (
          <li
            key={stage.key}
            className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <span
              className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: stage.color }}
            >
              {index + 1}
            </span>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">{stage.label}</h2>
                <StageBadge stage={stage.key} />
              </div>
              {stage.description ? (
                <p className="text-sm text-slate-600">{stage.description}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
