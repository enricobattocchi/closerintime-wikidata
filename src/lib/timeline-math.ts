import type { Event, TimelineResult, MarkerData, SegmentData, TimespanFormat } from "./types";
import {
  createUTCDate,
  diffYears,
  diffDays,
  isBefore,
  formatEventDate,
  formatMonthDayYear,
  formatYear,
  formatSpan,
  currentYear,
} from "./date-utils";

function eventToDate(event: Event, yearsOnly: boolean): Date {
  if (yearsOnly || !event.month || !event.day) {
    return createUTCDate(event.year);
  }
  return createUTCDate(event.year, event.month - 1, event.day);
}

export function computeTimeline(
  events: Event[],
  timespanFormat: TimespanFormat = 2
): TimelineResult {
  const yearsOnly = events.some((e) => !e.month || !e.day);
  const now = createUTCDate();

  // Sort events chronologically
  const sorted = [...events].sort((a, b) => {
    const da = eventToDate(a, yearsOnly);
    const db = eventToDate(b, yearsOnly);
    return da.getTime() - db.getTime();
  });

  const dates = sorted.map((e) => eventToDate(e, yearsOnly));

  // Total span from oldest event to now
  const totalSpan = yearsOnly
    ? diffYears(dates[0], now)
    : diffDays(dates[0], now);

  // Build segments: between each consecutive pair of points (events + now)
  const allDates = [...dates, now];
  const segments: SegmentData[] = [];
  const total = sorted.length; // number of segments = number of events

  for (let i = 0; i < sorted.length; i++) {
    const d1 = allDates[i];
    const d2 = allDates[i + 1];
    const span = yearsOnly ? diffYears(d1, d2) : diffDays(d1, d2);
    const percentage = totalSpan > 0 ? (100 * span) / totalSpan : 100 / total;

    segments.push({
      startLabel: i === 0 ? formatEventDate(sorted[0]) : "",
      endLabel: i === sorted.length - 1 ? (yearsOnly ? String(currentYear()) : formatMonthDayYear(now)) : "",
      spanLabel: formatSpan(d1, d2, yearsOnly, timespanFormat),
      percentage,
      order: i,
      total,
    });
  }

  // Build markers: one per event + "Now"
  const markers: MarkerData[] = sorted.map((event, i) => {
    const pos = totalSpan > 0
      ? (100 * (yearsOnly ? diffYears(dates[0], dates[i]) : diffDays(dates[0], dates[i]))) / totalSpan
      : (100 * i) / (sorted.length);
    return {
      event,
      label: formatEventDate(event),
      position: pos,
    };
  });

  // "Now" marker
  markers.push({
    event: { id: 0, name: "Now", year: currentYear(), month: null, day: null, type: "", enabled: 1, plural: 0, link: null },
    label: yearsOnly ? String(currentYear()) : formatMonthDayYear(now),
    position: 100,
  });

  return { markers, segments, totalDays: totalSpan, yearsOnly };
}
