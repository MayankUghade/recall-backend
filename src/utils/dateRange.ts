// backend/src/utils/dateRange.ts

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30

// Converts a UTC "now" into IST, gets midnight in IST, then converts that back to UTC
// so Prisma (which stores/compares in UTC) gets the correct boundary.
function getStartOfDayIST(daysAgo: number = 0): Date {
  const now = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);

  const istMidnight = new Date(
    Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() - daysAgo)
  );

  // convert IST midnight back to the equivalent UTC instant
  return new Date(istMidnight.getTime() - IST_OFFSET_MS);
}

export function parseDateRange(message: string): { start: Date; end: Date; label: string } {
  const now = new Date();
  const lower = message.toLowerCase();

  if (/\byesterdays?\b/.test(lower)) {
    const start = getStartOfDayIST(1);
    const end = getStartOfDayIST(0); // exclusive upper bound = start of today
    return { start, end, label: "yesterday" };
  }

  if (/\bthis week\b/.test(lower) || /\bweeks?\b/.test(lower)) {
    const now = new Date();
    const istNow = new Date(now.getTime() + IST_OFFSET_MS);
    const dayOfWeek = istNow.getUTCDay(); // 0 = Sunday
    const start = getStartOfDayIST(dayOfWeek);
    return { start, end: now, label: "this week" };
  }

  if (/\btodays?\b/.test(lower)) {
    return { start: getStartOfDayIST(0), end: now, label: "today" };
  }

  if (
    /\ball\b/.test(lower) ||
    /\bso far\b/.test(lower) ||
    /\bever\b/.test(lower) ||
    /\beverything\b/.test(lower)
  ) {
    return { start: new Date(0), end: now, label: "all time" };
  }

  return { start: getStartOfDayIST(0), end: now, label: "today" };
}