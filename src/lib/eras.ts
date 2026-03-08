import type { Event } from "./types";

export interface Era {
  id: string;
  label: string;
  description: string;
  minYear: number;
  maxYear: number;
}

export const ERAS: Era[] = [
  { id: "ancient", label: "Ancient", description: "Before 500 AD", minYear: -Infinity, maxYear: 499 },
  { id: "medieval", label: "Medieval", description: "500 – 1500", minYear: 500, maxYear: 1499 },
  { id: "early-modern", label: "Early Modern", description: "1500 – 1800", minYear: 1500, maxYear: 1799 },
  { id: "19th", label: "19th Century", description: "1800 – 1899", minYear: 1800, maxYear: 1899 },
  { id: "20th-early", label: "Early 20th Century", description: "1900 – 1949", minYear: 1900, maxYear: 1949 },
  { id: "20th-late", label: "Late 20th Century", description: "1950 – 1999", minYear: 1950, maxYear: 1999 },
  { id: "21st", label: "21st Century", description: "2000 – present", minYear: 2000, maxYear: Infinity },
];

export function groupByEra(events: Event[]): Map<string, Event[]> {
  const groups = new Map<string, Event[]>();
  for (const era of ERAS) {
    groups.set(era.id, []);
  }
  for (const event of events) {
    const era = ERAS.find((e) => event.year >= e.minYear && event.year <= e.maxYear);
    if (era) {
      groups.get(era.id)!.push(event);
    }
  }
  // Sort events within each era chronologically
  for (const [, events] of groups) {
    events.sort((a, b) => a.year - b.year);
  }
  return groups;
}
