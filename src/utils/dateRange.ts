import * as chrono from "chrono-node";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function getStartOfDayIST(daysAgo: number = 0): Date {
  const now = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  const istMidnight = new Date(
    Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() - daysAgo)
  );
  return new Date(istMidnight.getTime() - IST_OFFSET_MS);
}

// Given any JS Date, return the IST-midnight-to-midnight range containing it
function dayRangeFor(date: Date): { start: Date; end: Date } {
  const istDate = new Date(date.getTime() + IST_OFFSET_MS);
  const istMidnight = new Date(
    Date.UTC(istDate.getUTCFullYear(), istDate.getUTCMonth(), istDate.getUTCDate())
  );
  const start = new Date(istMidnight.getTime() - IST_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export function parseDateRange(message: string): { start: Date; end: Date; label: string } {
  const now = new Date();
  const lower = message.toLowerCase();

  // --- explicit keyword checks first (fast path, no parsing needed) ---
  if (/\byesterdays?\b/.test(lower)) {
    return { start: getStartOfDayIST(1), end: getStartOfDayIST(0), label: "yesterday" };
  }

  if (/\btodays?\b/.test(lower)) {
    return { start: getStartOfDayIST(0), end: now, label: "today" };
  }

  if (/\bthis week\b/.test(lower) || /\bweeks?\b/.test(lower)) {
    const istNow = new Date(now.getTime() + IST_OFFSET_MS);
    const dayOfWeek = istNow.getUTCDay();
    return { start: getStartOfDayIST(dayOfWeek), end: now, label: "this week" };
  }

  if (/\ball\b/.test(lower) || /\bso far\b/.test(lower) || /\bever\b/.test(lower) || /\beverything\b/.test(lower)) {
    return { start: new Date(0), end: now, label: "all time" };
  }

  // --- fall back to natural-language date parsing for specific dates ---
  // handles "July 8, 2026", "Wednesday, July 8, 2026", "07/08/2026", "8th July", "last Tuesday", etc.
  const parsed = chrono.parseDate(message, now);
  if (parsed) {
    const { start, end } = dayRangeFor(parsed);
    const label = parsed.toDateString();
    return { start, end, label };
  }

  // --- true default: no date info found at all ---
  return { start: getStartOfDayIST(0), end: now, label: "today" };
}