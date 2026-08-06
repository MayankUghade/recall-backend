// backend/src/utils/dateRange.ts
export function parseDateRange(message: string): { start: Date; end: Date; label: string } {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lower = message.toLowerCase();

  if (/\byesterdays?\b/.test(lower)) {
    const start = new Date(startOfToday);
    start.setDate(start.getDate() - 1);
    const end = new Date(startOfToday);
    return { start, end, label: "yesterday" };
  }

  if (/\bthis week\b/.test(lower) || /\bweeks?\b/.test(lower)) {
    const start = new Date(startOfToday);
    start.setDate(start.getDate() - start.getDay());
    return { start, end: new Date(now), label: "this week" };
  }

  if (/\btodays?\b/.test(lower)) {
    return { start: startOfToday, end: new Date(now), label: "today" };
  }

  if (
    /\ball\b/.test(lower) ||
    /\bso far\b/.test(lower) ||
    /\bever\b/.test(lower) ||
    /\beverything\b/.test(lower)
  ) {
    return { start: new Date(0), end: new Date(now), label: "all time" };
  }

  return { start: startOfToday, end: new Date(now), label: "today" };
}