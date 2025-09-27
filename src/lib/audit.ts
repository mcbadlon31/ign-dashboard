
import { db } from "@/lib/db";

export async function audit(action: string, opts?: { userEmail?: string|null; entity?: string; entityId?: string; meta?: any, sourceHeader?: string }){
  try {
    await db.auditLog.create({ data: { action, userEmail: opts?.userEmail ?? null, entity: opts?.entity, entityId: opts?.entityId, meta: opts?.meta ?? null } });
  } catch (e) {
    console.error("audit error", e);
  }
}
