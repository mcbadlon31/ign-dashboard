export function startOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setUTCHours(0, 0, 0, 0);
  const day = result.getUTCDay();
  const diff = (day + 6) % 7; // convert Sunday=0 to Monday=0 baseline
  result.setUTCDate(result.getUTCDate() - diff);
  return result;
}

type ActivityRecord = {
  personId: string;
  date: Date | string;
};

export function computeWeeklyStreak(records: ActivityRecord[], maxWeeks = 8): Map<string, number> {
  const weekMillis = 7 * 86_400_000;
  const now = new Date();
  const currentWeekStart = startOfWeek(now).getTime();
  const buckets = new Map<string, Set<number>>();

  for (const record of records) {
    if (!record.personId || !record.date) continue;
    const date = new Date(record.date);
    if (Number.isNaN(date.getTime())) continue;
    if (date.getTime() > now.getTime()) continue;
    const diff = currentWeekStart - startOfWeek(date).getTime();
    if (diff < 0) continue;
    const weeksAgo = Math.floor(diff / weekMillis);
    if (weeksAgo >= maxWeeks) continue;
    const set = buckets.get(record.personId) ?? new Set<number>();
    set.add(weeksAgo);
    buckets.set(record.personId, set);
  }

  const streaks = new Map<string, number>();
  for (const [personId, weeks] of buckets) {
    let streak = 0;
    while (weeks.has(streak)) {
      streak += 1;
    }
    streaks.set(personId, streak);
  }
  return streaks;
}
