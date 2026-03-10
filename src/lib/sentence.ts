import type { Event, DatePrecision, TimespanFormat } from "./types";
import {
  createUTCDate,
  diffYears,
  diffMonths,
  diffDays,
  preciseDiff,
  formatSpan,
} from "./date-utils";

function ucfirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Build a contextual phrase for an event based on which Wikidata date
 * property provided its date. For "point in time" or "start time" events
 * the name is already descriptive; for births, inceptions, etc. we add
 * a prefix so the sentence reads naturally.
 */
function contextualName(event: Event): string {
  switch (event.dateProperty) {
    case "P569": // date of birth
      return `the birth of ${event.name}`;
    case "P570": // date of death
      return `the death of ${event.name}`;
    case "P571": { // inception / founding
      const verb = event.type === "building" ? "construction" : "founding";
      return `the ${verb} of ${event.name}`;
    }
    case "P577": { // publication date
      const verb = event.type === "film" || event.type === "music" ? "release" : "publication";
      return `the ${verb} of ${event.name}`;
    }
    case "P619": // spacecraft launch
      return `the launch of ${event.name}`;
    case "P620": // spacecraft landing
      return `the landing of ${event.name}`;
    case "P1191": // first performance
      return `the first performance of ${event.name}`;
    case "P606": // first flight
      return `the first flight of ${event.name}`;
    // P585 (point in time), P580 (start time) — already event-like
    default:
      return event.name;
  }
}

function eventPrecision(events: Event[]): DatePrecision {
  if (events.some((e) => !e.month)) return "year";
  if (events.some((e) => !e.day)) return "month";
  return "day";
}

function eventToDate(event: Event, precision: DatePrecision): Date {
  if (precision === "year") return createUTCDate(event.year);
  if (precision === "month") return createUTCDate(event.year, (event.month ?? 1) - 1, 1);
  return createUTCDate(event.year, event.month! - 1, event.day!);
}

function spanValue(d1: Date, d2: Date, precision: DatePrecision): number {
  if (precision === "year") return diffYears(d1, d2);
  if (precision === "month") return diffMonths(d1, d2);
  return diffDays(d1, d2);
}

export function generateSentence(
  events: Event[],
  timespanFormat: TimespanFormat = 2
): string {
  if (events.length === 0) return "";

  const precision = eventPrecision(events);
  const yearsOnly = precision === "year";
  const monthsOnly = precision === "month";
  const now = createUTCDate();

  // Sort chronologically
  const sorted = [...events].sort((a, b) => {
    const da = eventToDate(a, precision);
    const db = eventToDate(b, precision);
    return da.getTime() - db.getTime();
  });

  // Build contextual names for use in sentences
  const cn = sorted.map(contextualName);

  if (sorted.length === 1) {
    const d = eventToDate(sorted[0], precision);
    // If the event has a precise day and today is its exact anniversary, use "X years ago today:"
    if (
      precision === "day" &&
      d.getUTCMonth() === now.getUTCMonth() &&
      d.getUTCDate() === now.getUTCDate()
    ) {
      const years = diffYears(d, now);
      return `${years} ${years === 1 ? "year" : "years"} ago today: ${cn[0]}`;
    }
    const span = yearsOnly
      ? formatSpan(d, now, true, 1)
      : monthsOnly
        ? formatSpan(d, now, false, timespanFormat, true)
        : preciseDiff(d, now);
    return `${span} ago: ${cn[0]}`;
  }

  if (sorted.length === 2) {
    const d0 = eventToDate(sorted[0], precision);
    const d1 = eventToDate(sorted[1], precision);
    const firstSpan = spanValue(d0, d1, precision);
    const secondSpan = spanValue(d1, now, precision);
    if (firstSpan > secondSpan) {
      return `${ucfirst(cn[1])} is closer in time to us than to ${cn[0]}.`;
    } else if (firstSpan < secondSpan) {
      return `${ucfirst(cn[1])} is closer in time to ${cn[0]} than to us.`;
    } else {
      return `${ucfirst(cn[1])} is exactly halfway between ${cn[0]} and us.`;
    }
  }

  if (sorted.length === 3) {
    const d0 = eventToDate(sorted[0], precision);
    const d1 = eventToDate(sorted[1], precision);
    const d2 = eventToDate(sorted[2], precision);
    const firstSpan = spanValue(d0, d1, precision);
    const lastSpan = spanValue(d2, now, precision);

    if (firstSpan > lastSpan) {
      return `More time passed between ${cn[0]} and ${cn[1]} than between ${cn[2]} and us.`;
    } else if (firstSpan < lastSpan) {
      return `More time passed between ${cn[2]} and us than between ${cn[0]} and ${cn[1]}.`;
    } else {
      return `The same amount of time passed between ${cn[0]} and ${cn[1]} as it did between ${cn[2]} and us.`;
    }
  }

  return "";
}
