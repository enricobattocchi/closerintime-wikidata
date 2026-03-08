import { getEventsStore } from "./db";
import type { Event } from "./types";

export async function getEnabledEvents(): Promise<Event[]> {
  try {
    const store = getEventsStore();
    const events: Event[] | null = await store.get("all", { type: "json" });
    return (events || []).filter((e) => e.enabled === 1);
  } catch {
    // Netlify Blobs not available during build-time static generation;
    // return empty array and let ISR populate on first request.
    return [];
  }
}

export async function getEventsByIds(ids: number[]): Promise<Event[]> {
  const all = await getEnabledEvents();
  const idSet = new Set(ids);
  return all.filter((e) => idSet.has(e.id));
}
