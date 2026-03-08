import { describe, it, expect } from "vitest";
import { ERAS, groupByEra } from "./eras";
import type { Event } from "./types";

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 1, name: "test", year: 2000, month: null, day: null,
    type: "history", enabled: 1, plural: 0, link: null,
    ...overrides,
  };
}

describe("ERAS", () => {
  it("covers full year range without gaps", () => {
    // Every year from -28000 to 3000 should match exactly one era
    for (const year of [-28000, -500, 0, 499, 500, 1499, 1500, 1799, 1800, 1899, 1900, 1949, 1950, 1999, 2000, 2025]) {
      const matches = ERAS.filter((e) => year >= e.minYear && year <= e.maxYear);
      expect(matches.length).toBe(1);
    }
  });
});

describe("groupByEra", () => {
  it("groups events into correct eras", () => {
    const events = [
      makeEvent({ id: 1, year: -500 }),
      makeEvent({ id: 2, year: 1200 }),
      makeEvent({ id: 3, year: 1600 }),
      makeEvent({ id: 4, year: 1850 }),
      makeEvent({ id: 5, year: 1920 }),
      makeEvent({ id: 6, year: 1975 }),
      makeEvent({ id: 7, year: 2020 }),
    ];

    const groups = groupByEra(events);
    expect(groups.get("ancient")!.length).toBe(1);
    expect(groups.get("medieval")!.length).toBe(1);
    expect(groups.get("early-modern")!.length).toBe(1);
    expect(groups.get("19th")!.length).toBe(1);
    expect(groups.get("20th-early")!.length).toBe(1);
    expect(groups.get("20th-late")!.length).toBe(1);
    expect(groups.get("21st")!.length).toBe(1);
  });

  it("sorts events chronologically within each era", () => {
    const events = [
      makeEvent({ id: 1, year: 1980 }),
      makeEvent({ id: 2, year: 1960 }),
      makeEvent({ id: 3, year: 1970 }),
    ];

    const groups = groupByEra(events);
    const late20th = groups.get("20th-late")!;
    expect(late20th.map((e) => e.year)).toEqual([1960, 1970, 1980]);
  });

  it("returns empty arrays for eras with no events", () => {
    const groups = groupByEra([]);
    for (const era of ERAS) {
      expect(groups.get(era.id)).toEqual([]);
    }
  });
});
