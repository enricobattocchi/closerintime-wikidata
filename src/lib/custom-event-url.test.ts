import { describe, it, expect } from "vitest";
import { buildShareablePath } from "./custom-event-url";
import type { Event } from "./types";

function makeEvent(overrides: Partial<Event> = {}): Event {
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
    ...overrides,
  };
}

describe("buildShareablePath", () => {
  it("builds path with Q-IDs sorted alphabetically", () => {
    const events = [makeEvent({ id: "Q42" }), makeEvent({ id: "Q107" })];
    expect(buildShareablePath(events)).toBe("/Q107/Q42");
  });

  it("returns '/' when no events", () => {
    expect(buildShareablePath([])).toBe("/");
  });

  it("handles a single event", () => {
    const events = [makeEvent({ id: "Q42" })];
    expect(buildShareablePath(events)).toBe("/Q42");
  });

  it("handles three events", () => {
    const events = [
      makeEvent({ id: "Q500" }),
      makeEvent({ id: "Q42" }),
      makeEvent({ id: "Q107" }),
    ];
    expect(buildShareablePath(events)).toBe("/Q107/Q42/Q500");
  });
});
