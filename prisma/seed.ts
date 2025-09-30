import { GoalStatus, PrismaClient, Stage } from "@prisma/client";

const db = new PrismaClient();

function daysFromNow(days: number) {
  const dt = new Date();
  dt.setDate(dt.getDate() + days);
  return dt;
}

function firstOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function monthsAgo(months: number) {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date;
}

type MilestoneSeed = { id: string; name: string; completed: boolean; dueInDays: number };
type ActivitySeed = { id: string; type: string; daysAgo: number; notes: string };
type StageHistoryEntry = { stage: Stage; enteredAt: Date; notes?: string | null };
type GoalSeed = {
  id: string;
  targetRole: string;
  status: GoalStatus;
  targetDate: Date;
  milestones: MilestoneSeed[];
};

type PersonSeed = {
  id: string;
  fullName: string;
  orgId: string;
  outreachId: string;
  coachEmail: string;
  currentRole: string | null;
  goal?: GoalSeed | null;
  activities: ActivitySeed[];
  tags: string[];
  currentStage?: Stage | null;
  stageHistory?: StageHistoryEntry[];
};

async function main() {
  const roleSeed = [
    { name: "Cell Dev Completer", tier: 1, colorHex: "#C084FC" },
    { name: "BS Leader", tier: 2, colorHex: "#22C55E" },
    { name: "HF Leader", tier: 3, colorHex: "#06B6D4" },
    { name: "DCL", tier: 4, colorHex: "#F59E0B" },
    { name: "Outreach Leader", tier: 5, colorHex: "#EF4444" },
  ];

  for (const role of roleSeed) {
    await db.role.upsert({ where: { name: role.name }, update: role, create: role });
  }

  const roles = await db.role.findMany();
  const roleByName = new Map(roles.map(role => [role.name, role.id]));

  const orgSeed = [
    { id: "seed-org-ignition", name: "Ignition City", slug: "ignition-city" },
    { id: "seed-org-north", name: "North Metro", slug: "north-metro" },
  ];

  for (const org of orgSeed) {
    await db.org.upsert({
      where: { id: org.id },
      update: { name: org.name, slug: org.slug },
      create: org,
    });
  }

  const outreachSeed = [
    {
      id: "seed-outreach-downtown",
      orgId: "seed-org-ignition",
      name: "Downtown",
      city: "Austin",
      wipLimit: 12,
    },
    {
      id: "seed-outreach-riverside",
      orgId: "seed-org-ignition",
      name: "Riverside",
      city: "Austin",
      wipLimit: 10,
    },
    {
      id: "seed-outreach-northhill",
      orgId: "seed-org-north",
      name: "North Hill",
      city: "Denver",
      wipLimit: 8,
    },
  ];

  for (const outreach of outreachSeed) {
    await db.outreach.upsert({
      where: { id: outreach.id },
      update: { name: outreach.name, city: outreach.city, orgId: outreach.orgId, wipLimit: outreach.wipLimit },
      create: outreach,
    });
  }

  const tagSeed = [
    { id: "seed-tag-launch", orgId: "seed-org-ignition", name: "Launch Ready", colorHex: "#2563EB" },
    { id: "seed-tag-intro", orgId: "seed-org-ignition", name: "Needs Intro", colorHex: "#10B981" },
    { id: "seed-tag-nurture", orgId: "seed-org-north", name: "Nurture", colorHex: "#F97316" },
  ];

  for (const tag of tagSeed) {
    await db.tag.upsert({
      where: { id: tag.id },
      update: { name: tag.name, colorHex: tag.colorHex, orgId: tag.orgId },
      create: tag,
    });
  }

  const accessSeed = [
    { userEmail: "leader.sanchez@example.com", outreachId: "seed-outreach-downtown" },
    { userEmail: "coach.lee@example.com", outreachId: "seed-outreach-downtown" },
    { userEmail: "coach.lee@example.com", outreachId: "seed-outreach-riverside" },
    { userEmail: "leader.ngo@example.com", outreachId: "seed-outreach-northhill" },
  ];

  for (const access of accessSeed) {
    await db.outreachAccess.upsert({
      where: { userEmail_outreachId: { userEmail: access.userEmail, outreachId: access.outreachId } },
      update: {},
      create: { userEmail: access.userEmail, outreachId: access.outreachId },
    });
  }

  const coachLimits = [
    { coachEmail: "coach.lee@example.com", limit: 8 },
    { coachEmail: "coach.khan@example.com", limit: 6 },
  ];

  for (const limit of coachLimits) {
    await db.coachLimit.upsert({
      where: { coachEmail: limit.coachEmail },
      update: { limit: limit.limit },
      create: limit,
    });
  }

  const peopleSeed: PersonSeed[] = [
    {
      id: "seed-person-alex",
      fullName: "Alex Johnson",
      orgId: "seed-org-ignition",
      outreachId: "seed-outreach-downtown",
      coachEmail: "coach.lee@example.com",
      currentRole: "Cell Dev Completer",
      currentStage: Stage.BIBLE_STUDY_LEADER,
      stageHistory: [
        { stage: Stage.NEW_FOLLOW_UPS, enteredAt: monthsAgo(8), notes: "Attended welcome dinner" },
        { stage: Stage.PGS, enteredAt: monthsAgo(6) },
        { stage: Stage.FIC_SERIES_COMPLETER, enteredAt: monthsAgo(5) },
        { stage: Stage.CELL_DEV_COMPLETER, enteredAt: monthsAgo(3) },
        { stage: Stage.BIBLE_STUDY_LEADER, enteredAt: monthsAgo(1), notes: "Leading weekly study" },
      ],
      goal: {
        id: "seed-goal-alex",
        targetRole: "BS Leader",
        status: GoalStatus.IN_PROGRESS,
        targetDate: daysFromNow(45),
        milestones: [
          { id: "seed-ms-alex-1", name: "Shadow weekly huddle", completed: true, dueInDays: -7 },
          { id: "seed-ms-alex-2", name: "Lead outreach night", completed: false, dueInDays: 14 },
          { id: "seed-ms-alex-3", name: "Recruit apprentice", completed: false, dueInDays: 35 },
        ],
      },
      activities: [
        { id: "seed-activity-alex-1", type: "Coaching", daysAgo: 3, notes: "Reviewed milestone progress" },
        { id: "seed-activity-alex-2", type: "Outreach", daysAgo: 12, notes: "Hosted neighborhood dinner" },
      ],
      tags: ["seed-tag-launch"],
    },
    {
      id: "seed-person-briana",
      fullName: "Briana Patel",
      orgId: "seed-org-ignition",
      outreachId: "seed-outreach-riverside",
      coachEmail: "coach.khan@example.com",
      currentRole: "BS Leader",
      currentStage: Stage.HOUSE_FELLOWSHIP_LEADER,
      stageHistory: [
        { stage: Stage.NEW_FOLLOW_UPS, enteredAt: monthsAgo(10) },
        { stage: Stage.PGS, enteredAt: monthsAgo(8) },
        { stage: Stage.FIC_SERIES_COMPLETER, enteredAt: monthsAgo(6) },
        { stage: Stage.CELL_DEV_COMPLETER, enteredAt: monthsAgo(4) },
        { stage: Stage.BIBLE_STUDY_LEADER, enteredAt: monthsAgo(2) },
        { stage: Stage.HOUSE_FELLOWSHIP_LEADER, enteredAt: monthsAgo(1), notes: "Launched HF beta group" },
      ],
      goal: {
        id: "seed-goal-briana",
        targetRole: "HF Leader",
        status: GoalStatus.PLANNED,
        targetDate: daysFromNow(80),
        milestones: [
          { id: "seed-ms-briana-1", name: "Complete HF track", completed: false, dueInDays: 20 },
          { id: "seed-ms-briana-2", name: "Launch beta group", completed: false, dueInDays: 45 },
          { id: "seed-ms-briana-3", name: "Train apprentice coach", completed: false, dueInDays: 70 },
        ],
      },
      activities: [
        { id: "seed-activity-briana-1", type: "Coaching", daysAgo: 8, notes: "Discussed HF expectations" },
        { id: "seed-activity-briana-2", type: "Training", daysAgo: 18, notes: "Attended HF intensive" },
      ],
      tags: ["seed-tag-intro"],
    },
    {
      id: "seed-person-devon",
      fullName: "Devon Lee",
      orgId: "seed-org-north",
      outreachId: "seed-outreach-northhill",
      coachEmail: "coach.lee@example.com",
      currentRole: "Cell Dev Completer",
      currentStage: Stage.CELL_DEV_COMPLETER,
      stageHistory: [
        { stage: Stage.NEW_FOLLOW_UPS, enteredAt: monthsAgo(7) },
        { stage: Stage.PGS, enteredAt: monthsAgo(6) },
        { stage: Stage.FIC_SERIES_COMPLETER, enteredAt: monthsAgo(5) },
        { stage: Stage.CELL_DEV_COMPLETER, enteredAt: monthsAgo(2), notes: "Completed core training" },
      ],
      goal: {
        id: "seed-goal-devon",
        targetRole: "BS Leader",
        status: GoalStatus.IN_PROGRESS,
        targetDate: daysFromNow(30),
        milestones: [
          { id: "seed-ms-devon-1", name: "Complete Core training", completed: true, dueInDays: -14 },
          { id: "seed-ms-devon-2", name: "Host preview night", completed: true, dueInDays: -3 },
          { id: "seed-ms-devon-3", name: "Confirm launch team", completed: false, dueInDays: 10 },
        ],
      },
      activities: [
        { id: "seed-activity-devon-1", type: "Outreach", daysAgo: 2, notes: "Preview night recap" },
        { id: "seed-activity-devon-2", type: "Coaching", daysAgo: 15, notes: "Team alignment" },
      ],
      tags: ["seed-tag-nurture"],
    },
  ];

  for (const person of peopleSeed) {
    const stageHistory = person.stageHistory ?? [];
    const latestStage = stageHistory.reduce<StageHistoryEntry | null>((latest, entry) => {
      if (!latest) return entry;
      return latest.enteredAt > entry.enteredAt ? latest : entry;
    }, null);
    const derivedStage = person.currentStage ?? latestStage?.stage ?? null;
    const stageSince = latestStage?.enteredAt ?? null;

    const record = await db.person.upsert({
      where: { id: person.id },
      update: {
        fullName: person.fullName,
        outreachId: person.outreachId,
        orgId: person.orgId,
        coachEmail: person.coachEmail,
        currentStage: derivedStage,
        stageSince,
        deletedAt: null,
      },
      create: {
        id: person.id,
        fullName: person.fullName,
        outreachId: person.outreachId,
        orgId: person.orgId,
        coachEmail: person.coachEmail,
        currentStage: derivedStage,
        stageSince,
      },
    });

    await db.personStage.deleteMany({ where: { personId: record.id } });
    if (stageHistory.length) {
      for (const entry of stageHistory) {
        await db.personStage.create({
          data: {
            personId: record.id,
            stage: entry.stage,
            enteredAt: entry.enteredAt,
            notes: entry.notes ?? null,
          },
        });
      }
    }

    const roleId = person.currentRole ? roleByName.get(person.currentRole) ?? null : null;
    await db.assignment.upsert({
      where: { personId: person.id },
      update: { outreachId: person.outreachId, activeRoleId: roleId ?? undefined },
      create: { personId: person.id, outreachId: person.outreachId, activeRoleId: roleId ?? undefined },
    });

    if (person.goal) {
      const targetRoleId = roleByName.get(person.goal.targetRole);
      if (!targetRoleId) throw new Error(`Missing role for ${person.goal.targetRole}`);

      await db.goalPlan.upsert({
        where: { id: person.goal.id },
        update: {
          targetRoleId,
          targetDate: person.goal.targetDate,
          status: person.goal.status,
          rationale: null,
        },
        create: {
          id: person.goal.id,
          personId: record.id,
          targetRoleId,
          targetDate: person.goal.targetDate,
          status: person.goal.status,
        },
      });

      await db.milestone.deleteMany({ where: { goalPlanId: person.goal.id } });
      for (const milestone of person.goal.milestones) {
        await db.milestone.create({
          data: {
            id: milestone.id,
            goalPlanId: person.goal.id,
            name: milestone.name,
            completed: milestone.completed,
            dueDate: daysFromNow(milestone.dueInDays),
          },
        });
      }
    }

    await db.activityLog.deleteMany({ where: { personId: person.id } });
    for (const activity of person.activities) {
      const date = daysFromNow(activity.daysAgo * -1);
      await db.activityLog.create({
        data: {
          id: activity.id,
          personId: person.id,
          type: activity.type,
          date,
          month: firstOfMonth(date),
          notes: activity.notes,
        },
      });
    }

    await db.personTag.deleteMany({ where: { personId: person.id } });
    for (const tagId of person.tags) {
      await db.personTag.create({ data: { personId: person.id, tagId } });
    }
  }

  await db.outreach.update({
    where: { id: "seed-outreach-downtown" },
    data: { leaderId: "seed-person-alex" },
  }).catch(() => undefined);
  await db.outreach.update({
    where: { id: "seed-outreach-riverside" },
    data: { leaderId: "seed-person-briana" },
  }).catch(() => undefined);
  await db.outreach.update({
    where: { id: "seed-outreach-northhill" },
    data: { leaderId: "seed-person-devon" },
  }).catch(() => undefined);

  await db.savedView.upsert({
    where: { slug: "ready-now" },
    update: {
      name: "Ready Next",
      outreachId: "seed-outreach-downtown",
      filters: { status: "ready" },
      isPublic: false,
    },
    create: {
      id: "seed-view-ready",
      name: "Ready Next",
      slug: "ready-now",
      outreachId: "seed-outreach-downtown",
      filters: { status: "ready" },
      isPublic: false,
    },
  });

  await db.userOrg.upsert({
    where: { id: "seed-userorg-admin" },
    update: { userEmail: "leader.sanchez@example.com", orgId: "seed-org-ignition", role: "Admin" },
    create: { id: "seed-userorg-admin", userEmail: "leader.sanchez@example.com", orgId: "seed-org-ignition", role: "Admin" },
  });

  console.log("Seeded roles, orgs, outreaches, people, and supporting data.");
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
