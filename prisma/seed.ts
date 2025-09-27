
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  const roles = [
    { name: "Cell Dev Completer", tier: 1, colorHex: "#C084FC" },
    { name: "BS Leader",          tier: 2, colorHex: "#22C55E" },
    { name: "HF Leader",          tier: 3, colorHex: "#06B6D4" },
    { name: "DCL",                tier: 4, colorHex: "#F59E0B" },
    { name: "Outreach Leader",    tier: 5, colorHex: "#EF4444" },
  ];
  for (const r of roles) {
    await db.role.upsert({ where: { name: r.name }, update: r, create: r });
  }
  console.log("Seeded roles.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await db.$disconnect();
});
