import { GoalStatus, PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function daysFromNow(days: number) {
  const dt = new Date();
  dt.setDate(dt.getDate() + days);
  return dt;
}

function firstOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

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

  const peopleSeed = [
    {
      id: "seed-person-alex",
      fullName: "Alex Johnson",
      orgId: "seed-org-ignition",
      outreachId: "seed-outreach-downtown",
      coachEmail: "coach.lee@example.com",
      currentRole: "Cell Dev Completer",
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
    const record = await db.person.upsert({
      where: { id: person.id },
      update: {
        fullName: person.fullName,
        outreachId: person.outreachId,
        orgId: person.orgId,
        coachEmail: person.coachEmail,
        deletedAt: null,
      },
      create: {
        id: person.id,
        fullName: person.fullName,
        outreachId: person.outreachId,
        orgId: person.orgId,
        coachEmail: person.coachEmail,
      },
    });

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
