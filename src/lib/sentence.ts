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

  if (sorted.length === 1) {
    const d = eventToDate(sorted[0], yearsOnly);
    const span = yearsOnly
      ? formatSpan(d, now, true, 1)
      : preciseDiff(d, now);
    return `${span} ago: ${sorted[0].name}`;
  }

  if (sorted.length === 2) {
    const d0 = eventToDate(sorted[0], yearsOnly);
    const d1 = eventToDate(sorted[1], yearsOnly);
    const firstSpan = yearsOnly ? diffYears(d0, d1) : diffDays(d0, d1);
    const secondSpan = yearsOnly ? diffYears(d1, now) : diffDays(d1, now);
    const verb = sorted[1].plural ? "are" : "is";

    if (firstSpan > secondSpan) {
      return `${ucfirst(sorted[1].name)} ${verb} closer in time to us than to ${sorted[0].name}.`;
    } else if (firstSpan < secondSpan) {
      return `${ucfirst(sorted[1].name)} ${verb} closer in time to ${sorted[0].name} than to us.`;
    } else {
      return `${ucfirst(sorted[1].name)} ${verb} exactly halfway between ${sorted[0].name} and us.`;
    }
  }

  if (sorted.length === 3) {
    const d0 = eventToDate(sorted[0], yearsOnly);
    const d1 = eventToDate(sorted[1], yearsOnly);
    const d2 = eventToDate(sorted[2], yearsOnly);
    const firstSpan = yearsOnly ? diffYears(d0, d1) : diffDays(d0, d1);
    const lastSpan = yearsOnly ? diffYears(d2, now) : diffDays(d2, now);

    if (firstSpan > lastSpan) {
      return `More time passed between ${sorted[0].name} and ${sorted[1].name} than between ${sorted[2].name} and us.`;
    } else if (firstSpan < lastSpan) {
      return `More time passed between ${sorted[2].name} and us than between ${sorted[0].name} and ${sorted[1].name}.`;
    } else {
      return `The same amount of time passed between ${sorted[0].name} and ${sorted[1].name} as it did between ${sorted[2].name} and us.`;
    }
  }

  return "";
}
