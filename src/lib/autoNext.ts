
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";
import { audit } from "./audit";

function readNextMap(): Record<string, string> {
  try {
    const p = path.join(process.cwd(), "src", "config", "role-next.json");
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return {};
  }
}

export async function maybeAchieveAndAdvance(goalId: string, userEmail?: string|null){
  const goal = await db.goalPlan.findUnique({ where: { id: goalId }, include: { milestones: true, target: true, person: true } });
  if (!goal) return;
  const total = goal.milestones.length || 1;
  const done = goal.milestones.filter(m => m.completed).length;
  if (done < total) return;

  if (goal.status !== "ACHIEVED") {
    await db.goalPlan.update({ where: { id: goal.id }, data: { status: "ACHIEVED" } });
    await audit("goal.achieved", { userEmail: userEmail ?? undefined, entity: "goal", entityId: goal.id });
  }

  const map = readNextMap();
  const nextName = map[goal.target?.name || ""];

  if (nextName && goal.personId) {
    const nextRole = await db.role.findFirst({ where: { name: nextName } });
    if (nextRole) {
      const dt = new Date();
      dt.setDate(dt.getDate() + 60);
      const next = await db.goalPlan.create({
        data: {
          personId: goal.personId,
          targetRoleId: nextRole.id,
          targetDate: dt,
          status: "PLANNED"
        }
      });
      await audit("goal.autoNext", { userEmail: userEmail ?? undefined, entity: "goal", entityId: next.id, meta: { from: goal.target?.name, to: nextName } });
    }
  }
}
