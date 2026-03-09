import type { Event } from "./types";

/**
 * Build a shareable path from Wikidata events.
 * Each event uses its Q-ID as a URL segment, sorted alphabetically.
 */
export function buildShareablePath(events: Event[]): string {
  if (events.length === 0) return "/";
  const qids = events.map((e) => e.id).sort();
  return "/" + qids.join("/");
}
