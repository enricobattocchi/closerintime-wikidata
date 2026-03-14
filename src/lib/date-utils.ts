/**
 * Creates a UTC date at noon. Uses setUTCFullYear to handle years 0-99 and negative years.
 * With no args: current date at noon UTC.
 * With year only: current month/day but given year.
 * With year+month+day: specific date at noon UTC.
 * Month is 0-based (0 = January).
 */
export function createUTCDate(year?: number, month?: number, day?: number): Date {
  const now = new Date();
  const y = year !== undefined ? year : now.getUTCFullYear();
  const m = month !== undefined ? month : now.getUTCMonth();
  const d = day !== undefined ? day : now.getUTCDate();
  const date = new Date(Date.UTC(2000, m, d, 12, 0, 0, 0));
  date.setUTCFullYear(y);
  return date;
}

export function currentYear(): number {
  return new Date().getUTCFullYear();
}

/**
 * Returns true if years span the BC/AD boundary (one is <= 0, the other > 0).
 * Year 0 doesn't exist historically, so crossing from non-positive to positive
 * means the mathematical difference overcounts by 1.
 */
function spansBCBoundary(y1: number, y2: number): boolean {
  return (y1 <= 0 && y2 > 0) || (y2 <= 0 && y1 > 0);
}

export function diffYears(d1: Date, d2: Date): number {
  const y1 = d1.getUTCFullYear();
  const y2 = d2.getUTCFullYear();
  let diff = Math.abs(y1 - y2);
  if (spansBCBoundary(y1, y2)) diff--;
  return diff;
}

export function diffMonths(d1: Date, d2: Date): number {
  let [m1, m2] = d1 < d2 ? [d1, d2] : [d2, d1];
  let months = (m2.getUTCFullYear() - m1.getUTCFullYear()) * 12 + m2.getUTCMonth() - m1.getUTCMonth();
  if (spansBCBoundary(m1.getUTCFullYear(), m2.getUTCFullYear())) months -= 12;
  return months;
}

export function diffDays(d1: Date, d2: Date): number {
  const msPerDay = 86400000;
  return Math.round(Math.abs(d1.getTime() - d2.getTime()) / msPerDay);
}

export function isBefore(d1: Date, d2: Date): boolean {
  return d1.getTime() < d2.getTime();
}

export function daysInMonth(year: number, month: number): number {
  const d = new Date(Date.UTC(2000, 0, 1));
  d.setUTCFullYear(year);
  d.setUTCMonth(month + 1, 0);
  return d.getUTCDate();
}

/**
 * Reimplementation of moment-precise-range logic.
 * Returns a human-readable string like "2 years, 3 months and 5 days".
 */
export type SpanTranslate = (key: string, values?: Record<string, string | number>) => string;

const defaultSpanT: SpanTranslate = (key, values) => {
  const count = Number(values?.count ?? 0);
  switch (key) {
    case "year": return count === 1 ? `${count} year` : `${count} years`;
    case "month": return count === 1 ? `${count} month` : `${count} months`;
    case "day": return count === 1 ? `${count} day` : `${count} days`;
    case "zeroDays": return "0 days";
    case "zeroMonths": return "0 months";
    case "and": return "and";
    default: return key;
  }
};

export function preciseDiff(d1: Date, d2: Date, t: SpanTranslate = defaultSpanT): string {
  let m1 = new Date(d1.getTime());
  let m2 = new Date(d2.getTime());

  if (m1 > m2) {
    [m1, m2] = [m2, m1];
  }

  let yDiff = m2.getUTCFullYear() - m1.getUTCFullYear();
  // Year 0 doesn't exist historically; adjust when crossing BC/AD boundary
  if (spansBCBoundary(m1.getUTCFullYear(), m2.getUTCFullYear())) yDiff--;
  let mDiff = m2.getUTCMonth() - m1.getUTCMonth();
  let dDiff = m2.getUTCDate() - m1.getUTCDate();
  let hourDiff = m2.getUTCHours() - m1.getUTCHours();
  let minDiff = m2.getUTCMinutes() - m1.getUTCMinutes();
  let secDiff = m2.getUTCSeconds() - m1.getUTCSeconds();

  if (secDiff < 0) { secDiff += 60; minDiff--; }
  if (minDiff < 0) { minDiff += 60; hourDiff--; }
  if (hourDiff < 0) { hourDiff += 24; dDiff--; }
  if (dDiff < 0) {
    const prevMonth = new Date(Date.UTC(m2.getUTCFullYear(), m2.getUTCMonth(), 0));
    const daysInLastMonth = prevMonth.getUTCDate();
    if (daysInLastMonth < m1.getUTCDate()) {
      dDiff = daysInLastMonth + dDiff + (m1.getUTCDate() - daysInLastMonth);
    } else {
      dDiff = daysInLastMonth + dDiff;
    }
    mDiff--;
  }
  if (mDiff < 0) { mDiff += 12; yDiff--; }

  const parts: string[] = [];
  if (yDiff) parts.push(t("year", { count: yDiff }));
  if (mDiff) parts.push(t("month", { count: mDiff }));
  if (dDiff) parts.push(t("day", { count: dDiff }));

  if (parts.length === 0) return t("zeroDays");
  if (parts.length === 1) return parts[0];
  return parts.slice(0, -1).join(", ") + " " + t("and") + " " + parts[parts.length - 1];
}

export function formatMonthDay(d: Date, locale: string = "en-US"): string {
  return d.toLocaleDateString(locale, { month: "long", day: "numeric", timeZone: "UTC" });
}

export function formatMonthDayYear(d: Date, locale: string = "en-US"): string {
  return d.toLocaleDateString(locale, { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/**
 * Format a Date with Intl, correcting the year for BC dates.
 * Intl uses astronomical year numbering (year 0 exists), so -30 renders as
 * "31 BC". We replace the year part with Math.abs(year) to get historical
 * numbering where -30 = 30 BC.
 */
function formatDateBC(d: Date, locale: string, opts: Intl.DateTimeFormatOptions): string {
  const parts = new Intl.DateTimeFormat(locale, opts).formatToParts(d);
  const historicalYear = String(Math.abs(d.getUTCFullYear()));
  return parts.map((p) => p.type === "year" ? historicalYear : p.value).join("");
}

export function formatYear(year: number, locale: string = "en-US"): string {
  if (year <= 0) {
    const d = createUTCDate(year, 0, 1);
    return formatDateBC(d, locale, { year: "numeric", era: "short", timeZone: "UTC" });
  }
  return String(year);
}

export function formatEventDate(
  event: { year: number; month: number | null; day: number | null },
  locale: string = "en-US"
): string {
  if (event.month && event.day) {
    const d = createUTCDate(event.year, event.month - 1, event.day);
    if (event.year <= 0) {
      return formatDateBC(d, locale, { month: "long", day: "numeric", year: "numeric", era: "short", timeZone: "UTC" });
    }
    return formatMonthDayYear(d, locale);
  }
  if (event.month) {
    const d = createUTCDate(event.year, event.month - 1, 1);
    if (event.year <= 0) {
      return formatDateBC(d, locale, { month: "long", year: "numeric", era: "short", timeZone: "UTC" });
    }
    return d.toLocaleDateString(locale, { month: "long", year: "numeric", timeZone: "UTC" });
  }
  return formatYear(event.year, locale);
}

export function formatSpan(
  d1: Date,
  d2: Date,
  yearsOnly: boolean,
  timespanFormat: number,
  monthsOnly?: boolean,
  t: SpanTranslate = defaultSpanT
): string {
  if (yearsOnly || timespanFormat === 1) {
    const years = diffYears(d1, d2);
    return t("year", { count: years });
  }
  if (monthsOnly) {
    const totalMonths = diffMonths(d1, d2);
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    const parts: string[] = [];
    if (years) parts.push(t("year", { count: years }));
    if (months) parts.push(t("month", { count: months }));
    if (parts.length === 0) return t("zeroMonths");
    if (parts.length === 1) return parts[0];
    return parts[0] + " " + t("and") + " " + parts[1];
  }
  if (timespanFormat === 2) {
    return preciseDiff(d1, d2, t);
  }
  // timespanFormat === 0: days
  const days = diffDays(d1, d2);
  return t("day", { count: days });
}
