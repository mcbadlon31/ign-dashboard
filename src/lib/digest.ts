import { db } from "./db";

type DigestPreviewOptions = {
  orgId: string;
  outreachId?: string;
};

export async function buildDigestPreviewHtml({ orgId, outreachId }: DigestPreviewOptions) {
  const where: { orgId: string; outreachId?: string } = { orgId };
  if (outreachId) where.outreachId = outreachId;

  const people = await db.person.findMany({
    where,
    include: {
      outreach: true,
      goalPlans: {
        where: { status: { in: ["PLANNED", "IN_PROGRESS"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { milestones: true, target: true },
      },
      activities: { orderBy: { date: "desc" }, take: 5 },
    },
    orderBy: { fullName: "asc" },
  });

  const rows = people
    .map(person => {
      const goal = person.goalPlans[0];
      const total = goal?.milestones.length ?? 0;
      const done = goal ? goal.milestones.filter(m => m.completed).length : 0;
      const lastActivityDate = person.activities[0]?.date ? new Date(person.activities[0].date) : null;
      const lastActivity = lastActivityDate ? lastActivityDate.toISOString().slice(0, 10) : "";

      return `<tr>
      <td style="padding:6px;border-bottom:1px solid #eee">${person.fullName}</td>
      <td style="padding:6px;border-bottom:1px solid #eee">${person.outreach?.name ?? ""}</td>
      <td style="padding:6px;border-bottom:1px solid #eee">${goal?.target.name ?? ""}</td>
      <td style="padding:6px;border-bottom:1px solid #eee">${done}/${total}</td>
      <td style="padding:6px;border-bottom:1px solid #eee">${lastActivity}</td>
    </tr>`;
    })
    .join("");

  return `
    <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial">
      <h2>Weekly Digest${outreachId ? " - Outreach" : ""}</h2>
      <table cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;max-width:720px">
        <thead>
          <tr>
            <th align="left" style="padding:6px;border-bottom:2px solid #000">Person</th>
            <th align="left" style="padding:6px;border-bottom:2px solid #000">Outreach</th>
            <th align="left" style="padding:6px;border-bottom:2px solid #000">Goal</th>
            <th align="left" style="padding:6px;border-bottom:2px solid #000">Progress</th>
            <th align="left" style="padding:6px;border-bottom:2px solid #000">Last Activity</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}
