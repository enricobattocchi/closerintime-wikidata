export interface Event {
  id: string;
  name: string;
  description: string | null;
  year: number;
  month: number | null;
  day: number | null;
  type: string;
  link: string | null;
  /** Wikidata property ID that provided the date (e.g. "P569" for birth) */
  dateProperty: string | null;
  /** Death date for people (P570), if available */
  deathYear: number | null;
  deathMonth: number | null;
  deathDay: number | null;
  /** Whether the death date is the active date */
  useDeath: boolean;
}

export interface MarkerData {
  event: Event;
  label: string;
  position: number; // 0–100 percentage
}

export interface SegmentData {
  startLabel: string;
  endLabel: string;
  spanLabel: string;
  percentage: number;
  order: number;
  total: number;
}

export type DatePrecision = "year" | "month" | "day";

export interface TimelineResult {
  markers: MarkerData[];
  segments: SegmentData[];
  totalDays: number;
  yearsOnly: boolean;
  precision: DatePrecision;
}

export type TimespanFormat = 0 | 1 | 2; // 0=days, 1=years only, 2=precise

export const EVENT_TYPES = [
  "art", "book", "building", "computer", "disaster",
  "film", "history", "military", "music", "organization",
  "person", "place", "pop culture", "science", "sport", "transport",
] as const;
