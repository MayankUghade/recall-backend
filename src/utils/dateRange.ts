// backend/src/utils/dateRange.ts
export function parseDateRange(message: string): { start: Date; end: Date; label: string } {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lower = message.toLowerCase();

  if (/\byesterday\b/.test(lower)) {
    const start = new Date(startOfToday);
    start.setDate(start.getDate() - 1);
    const end = new Date(startOfToday); // exclusive upper bound = start of today
    return { start, end, label: "yesterday" };
  }

  if (/\bthis week\b/.test(lower) || /\bweek\b/.test(lower)) {
    const start = new Date(startOfToday);
    start.setDate(start.getDate() - start.getDay()); // back to Sunday
    return { start, end: new Date(now), label: "this week" };
  }

  if (/\btoday\b/.test(lower)) {
    return { start: startOfToday, end: new Date(now), label: "today" };
  }

  // catches "so far", "all", "ever", "all time", "everyone I've met", etc.
  if (
    /\ball\b/.test(lower) ||
    /\bso far\b/.test(lower) ||
    /\bever\b/.test(lower) ||
    /\beverything\b/.test(lower)
  ) {
    return { start: new Date(0), end: new Date(now), label: "all time" }; // epoch to now
  }

  // fallback default — no time keyword detected at all
  return { start: startOfToday, end: new Date(now), label: "today" };
}