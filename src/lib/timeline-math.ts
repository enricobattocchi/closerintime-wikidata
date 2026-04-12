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

  // Find where Now belongs chronologically among the sorted events
  const nowTime = now.getTime();
  let nowIndex = dates.findIndex(d => d.getTime() > nowTime);
  if (nowIndex === -1) nowIndex = dates.length; // Now is after all events

  // Build full ordered list of all timeline points (events + Now)
  const allDates = [...dates];
  allDates.splice(nowIndex, 0, now);

  // Total span from first to last point on the timeline
  const totalSpan = spanValue(allDates[0], allDates[allDates.length - 1], precision);

  // Build segments between each consecutive pair of points
  const segments: SegmentData[] = [];
  const total = allDates.length - 1; // number of segments = points - 1

  for (let i = 0; i < total; i++) {
    const d1 = allDates[i];
    const d2 = allDates[i + 1];
    const span = spanValue(d1, d2, precision);
    const percentage = totalSpan > 0 ? (100 * span) / totalSpan : 100 / total;

    const isFirst = i === 0;
    const isLast = i === total - 1;

    let startLabel = "";
    if (isFirst) {
      startLabel = nowIndex === 0
        ? formatNowLabel(precision, now, locale)
        : formatEventDate(sorted[0], locale);
    }

    let endLabel = "";
    if (isLast) {
      endLabel = nowIndex === dates.length
        ? formatNowLabel(precision, now, locale)
        : formatEventDate(sorted[sorted.length - 1], locale);
    }

    segments.push({
      startLabel,
      endLabel,
      spanLabel: formatSpan(d1, d2, yearsOnly, timespanFormat, monthsOnly, spanT),
      percentage,
      order: i,
      total,
    });
  }

  // Build markers in chronological order with Now at its correct position
  const nowEvent: Event = { id: "0", name: nowName, description: null, year: currentYear(), month: null, day: null, type: "", link: null, dateProperty: null, deathYear: null, deathMonth: null, deathDay: null, useDeath: false };
  const markers: MarkerData[] = [];
  let eventIdx = 0;

  for (let i = 0; i < allDates.length; i++) {
    if (i === nowIndex) {
      const pos = totalSpan > 0
        ? (100 * spanValue(allDates[0], now, precision)) / totalSpan
        : (100 * nowIndex) / (allDates.length - 1 || 1);
      markers.push({ event: nowEvent, label: formatNowLabel(precision, now, locale), position: pos });
    } else {
      const pos = totalSpan > 0
        ? (100 * spanValue(allDates[0], dates[eventIdx], precision)) / totalSpan
        : (100 * i) / (allDates.length - 1 || 1);
      markers.push({ event: sorted[eventIdx], label: formatEventDate(sorted[eventIdx], locale), position: pos });
      eventIdx++;
    }
  }

  return { markers, segments, totalDays: totalSpan, yearsOnly, precision };
}
