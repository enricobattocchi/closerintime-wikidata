import type { Event, DatePrecision, TimelineResult, MarkerData, SegmentData, TimespanFormat } from "./types";
import {
  createUTCDate,
  diffYears,
  diffMonths,
  diffDays,
  formatEventDate,
  formatMonthDayYear,
  formatSpan,
  currentYear,
  type SpanTranslate,
} from "./date-utils";

function eventPrecision(events: Event[]): DatePrecision {
  if (events.some((e) => !e.month)) return "year";
  if (events.some((e) => !e.day)) return "month";
  return "day";
}

function eventToDate(event: Event, precision: DatePrecision): Date {
  if (precision === "year") {
    return createUTCDate(event.year);
  }
  if (precision === "month") {
    return createUTCDate(event.year, (event.month ?? 1) - 1, 1);
  }
  return createUTCDate(event.year, event.month! - 1, event.day!);
}

function formatNowLabel(precision: DatePrecision, now: Date, locale: string = "en-US"): string {
  if (precision === "year") return String(currentYear());
  if (precision === "month") {
    return now.toLocaleDateString(locale, { month: "long", timeZone: "UTC" }) + " " + currentYear();
  }
  return formatMonthDayYear(now, locale);
}

function spanValue(d1: Date, d2: Date, precision: DatePrecision): number {
  if (precision === "year") return diffYears(d1, d2);
  if (precision === "month") return diffMonths(d1, d2);
  return diffDays(d1, d2);
}

export function computeTimeline(
  events: Event[],
  timespanFormat: TimespanFormat = 2,
  locale: string = "en-US",
  nowName: string = "Now",
  spanT?: SpanTranslate
): TimelineResult {
  const precision = eventPrecision(events);
  const yearsOnly = precision === "year";
  const monthsOnly = precision === "month";
  const now = createUTCDate();

  // Sort events chronologically
  const sorted = [...events].sort((a, b) => {
    const da = eventToDate(a, precision);
    const db = eventToDate(b, precision);
    return da.getTime() - db.getTime();
  });

  const dates = sorted.map((e) => eventToDate(e, precision));

  // Total span from oldest event to now
  const totalSpan = spanValue(dates[0], now, precision);

  // Build segments: between each consecutive pair of points (events + now)
  const allDates = [...dates, now];
  const segments: SegmentData[] = [];
  const total = sorted.length; // number of segments = number of events

  for (let i = 0; i < sorted.length; i++) {
    const d1 = allDates[i];
    const d2 = allDates[i + 1];
    const span = spanValue(d1, d2, precision);
    const percentage = totalSpan > 0 ? (100 * span) / totalSpan : 100 / total;

    segments.push({
      startLabel: i === 0 ? formatEventDate(sorted[0], locale) : "",
      endLabel: i === sorted.length - 1 ? formatNowLabel(precision, now, locale) : "",
      spanLabel: formatSpan(d1, d2, yearsOnly, timespanFormat, monthsOnly, spanT),
      percentage,
      order: i,
      total,
    });
  }

  // Build markers: one per event + "Now"
  const markers: MarkerData[] = sorted.map((event, i) => {
    const pos = totalSpan > 0
      ? (100 * spanValue(dates[0], dates[i], precision)) / totalSpan
      : (100 * i) / (sorted.length);
    return {
      event,
      label: formatEventDate(event, locale),
      position: pos,
    };
  });

  // "Now" marker
  markers.push({
    event: { id: "0", name: nowName, description: null, year: currentYear(), month: null, day: null, type: "", link: null, dateProperty: null, deathYear: null, deathMonth: null, deathDay: null, useDeath: false },
    label: formatNowLabel(precision, now, locale),
    position: 100,
  });

  return { markers, segments, totalDays: totalSpan, yearsOnly, precision };
}
