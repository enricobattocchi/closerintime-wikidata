import type { Event } from "@/lib/types";

export function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "Q1",
    name: "Test Event",
    description: null,
    year: 2000,
    month: null,
    day: null,
    type: "history",
    link: null,
    dateProperty: null,
    deathYear: null,
    deathMonth: null,
    deathDay: null,
    useDeath: false,
    ...overrides,
  };
}
