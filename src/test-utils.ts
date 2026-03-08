import type { Event } from "@/lib/types";

export function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 1,
    name: "Test Event",
    year: 2000,
    month: null,
    day: null,
    type: "history",
    enabled: 1,
    plural: 0,
    link: null,
    ...overrides,
  };
}
