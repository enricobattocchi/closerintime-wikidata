import type { Event } from "./types";

/**
 * Encode a custom event as a URL path segment.
 * Format: c:name:year[:month:day[:plural]]
 * Name has spaces replaced with hyphens, URI-encoded.
 */
export function encodeCustomEvent(event: Event): string {
  const name = encodeURIComponent(event.name.replace(/ /g, "-"));
  let seg = `c:${name}:${event.year}`;
  if (event.month && event.day) {
    seg += `:${event.month}:${event.day}`;
    if (event.plural) seg += `:p`;
  } else if (event.plural) {
    seg += `:::p`;
  }
  return seg;
}

/**
 * Decode a custom event from a URL path segment.
 * Returns null if the segment is not a valid custom event.
 */
export function decodeCustomEvent(seg: string, index: number): Event | null {
  if (!seg.startsWith("c:")) return null;
  const parts = seg.slice(2).split(":");
  if (parts.length < 2) return null;

  const name = decodeURIComponent(parts[0]).replace(/-/g, " ");
  const year = parseInt(parts[1], 10);
  if (isNaN(year)) return null;

  const month = parts[2] ? parseInt(parts[2], 10) || null : null;
  const day = parts[3] ? parseInt(parts[3], 10) || null : null;
  const plural = parts[4] === "p" ? 1 : 0;

  return {
    id: -(index + 1000), // negative ID, offset to avoid collision with IndexedDB IDs
    name,
    year,
    month,
    day,
    type: "personal",
    enabled: 1,
    plural,
    link: null,
  };
}

/**
 * Build a shareable path from a mix of server event IDs and custom events.
 * Server IDs are numeric, custom events are c: segments.
 * Segments are sorted: numeric IDs first (ascending), then custom events.
 */
export function buildShareablePath(
  serverEvents: Event[],
  customEvents: Event[]
): string {
  const parts: string[] = [];

  const serverIds = serverEvents.map((e) => e.id).sort((a, b) => a - b);
  parts.push(...serverIds.map(String));
  parts.push(...customEvents.map(encodeCustomEvent));

  return parts.length > 0 ? "/" + parts.join("/") : "/";
}
