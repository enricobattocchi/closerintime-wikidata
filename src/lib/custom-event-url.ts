import type { Event } from "./types";

/**
 * Build a shareable path from Wikidata events.
 * Each event uses its Q-ID as a URL segment, sorted alphabetically.
 * People using their death date get a ~d suffix.
 */
export function buildShareablePath(events: Event[]): string {
  if (events.length === 0) return "/";
  const segments = events
    .map((e) => `${e.id}${e.useDeath ? "~d" : ""}`)
    .sort();
  return "/" + segments.join("/");
}
