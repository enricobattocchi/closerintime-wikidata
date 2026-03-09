import type { Event, TimespanFormat } from "./types";
import {
  createUTCDate,
  diffYears,
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
    case "P571": { // inception / founding
      const verb = event.type === "building" ? "construction" : "founding";
      return `the ${verb} of ${event.name}`;
    }
    case "P577": { // publication date
      const verb = event.type === "film" ? "release" : "publication";
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

function eventToDate(event: Event, yearsOnly: boolean): Date {
  if (yearsOnly || !event.month || !event.day) {
    return createUTCDate(event.year);
  }
  return createUTCDate(event.year, event.month - 1, event.day);
}

export function generateSentence(
  events: Event[],
  timespanFormat: TimespanFormat = 2
): string {
  if (events.length === 0) return "";

  const yearsOnly = events.some((e) => !e.month || !e.day);
  const now = createUTCDate();

  // Sort chronologically
  const sorted = [...events].sort((a, b) => {
    const da = eventToDate(a, yearsOnly);
    const db = eventToDate(b, yearsOnly);
    return da.getTime() - db.getTime();
  });

  // Build contextual names for use in sentences
  const cn = sorted.map(contextualName);

  if (sorted.length === 1) {
    const d = eventToDate(sorted[0], yearsOnly);
    // If the event has a precise day and today is its exact anniversary, use "X years ago today:"
    if (
      !yearsOnly &&
      d.getUTCMonth() === now.getUTCMonth() &&
      d.getUTCDate() === now.getUTCDate()
    ) {
      const years = diffYears(d, now);
      return `${years} ${years === 1 ? "year" : "years"} ago today: ${cn[0]}`;
    }
    const span = yearsOnly
      ? formatSpan(d, now, true, 1)
      : preciseDiff(d, now);
    return `${span} ago: ${cn[0]}`;
  }

  if (sorted.length === 2) {
    const d0 = eventToDate(sorted[0], yearsOnly);
    const d1 = eventToDate(sorted[1], yearsOnly);
    const firstSpan = yearsOnly ? diffYears(d0, d1) : diffDays(d0, d1);
    const secondSpan = yearsOnly ? diffYears(d1, now) : diffDays(d1, now);
    const verb = sorted[1].plural ? "are" : "is";

    if (firstSpan > secondSpan) {
      return `${ucfirst(cn[1])} ${verb} closer in time to us than to ${cn[0]}.`;
    } else if (firstSpan < secondSpan) {
      return `${ucfirst(cn[1])} ${verb} closer in time to ${cn[0]} than to us.`;
    } else {
      return `${ucfirst(cn[1])} ${verb} exactly halfway between ${cn[0]} and us.`;
    }
  }

  if (sorted.length === 3) {
    const d0 = eventToDate(sorted[0], yearsOnly);
    const d1 = eventToDate(sorted[1], yearsOnly);
    const d2 = eventToDate(sorted[2], yearsOnly);
    const firstSpan = yearsOnly ? diffYears(d0, d1) : diffDays(d0, d1);
    const lastSpan = yearsOnly ? diffYears(d2, now) : diffDays(d2, now);

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
