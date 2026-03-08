import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateSentence } from "./sentence";
import type { Event } from "./types";

function makeEvent(overrides: Partial<Event> = {}): Event {
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

// Fix "now" to a known date for deterministic tests
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(Date.UTC(2024, 0, 1, 12, 0, 0)));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("generateSentence", () => {
  it("returns empty string for no events", () => {
    expect(generateSentence([])).toBe("");
  });

  describe("single event", () => {
    it("generates 'X years ago' for a year-only event", () => {
      const event = makeEvent({ name: "the Moon Landing", year: 1969 });
      const result = generateSentence([event]);
      expect(result).toBe("55 years ago: the Moon Landing");
    });

    it("generates precise diff for event with full date", () => {
      const event = makeEvent({
        name: "the Moon Landing",
        year: 1969,
        month: 7,
        day: 20,
      });
      const result = generateSentence([event]);
      expect(result).toContain("ago: the Moon Landing");
      expect(result).toContain("54 years");
    });
  });

  describe("two events", () => {
    it("says 'closer to us' when gap between events > gap to now", () => {
      // Event A: 1900, Event B: 1990 → gap A-B = 90 years, gap B-now = 34 years
      const events = [
        makeEvent({ id: 1, name: "Event A", year: 1900 }),
        makeEvent({ id: 2, name: "Event B", year: 1990 }),
      ];
      const result = generateSentence(events);
      expect(result).toBe(
        "Event B is closer in time to us than to Event A."
      );
    });

    it("says 'closer to [older]' when gap to now > gap between events", () => {
      // Event A: 1900, Event B: 1910 → gap A-B = 10 years, gap B-now = 114 years
      const events = [
        makeEvent({ id: 1, name: "Event A", year: 1900 }),
        makeEvent({ id: 2, name: "Event B", year: 1910 }),
      ];
      const result = generateSentence(events);
      expect(result).toBe(
        "Event B is closer in time to Event A than to us."
      );
    });

    it("says 'exactly halfway' when spans are equal", () => {
      // Event A: 2000, Event B: 2012 → gap A-B = 12 years, gap B-now = 12 years
      const events = [
        makeEvent({ id: 1, name: "Event A", year: 2000 }),
        makeEvent({ id: 2, name: "Event B", year: 2012 }),
      ];
      const result = generateSentence(events);
      expect(result).toBe(
        "Event B is exactly halfway between Event A and us."
      );
    });

    it("uses 'are' verb for plural events", () => {
      const events = [
        makeEvent({ id: 1, name: "Event A", year: 1900 }),
        makeEvent({ id: 2, name: "the Beatles", year: 1990, plural: 1 }),
      ];
      const result = generateSentence(events);
      expect(result).toContain("The Beatles are");
    });

    it("sorts events chronologically regardless of input order", () => {
      const events = [
        makeEvent({ id: 2, name: "Event B", year: 1990 }),
        makeEvent({ id: 1, name: "Event A", year: 1900 }),
      ];
      const result = generateSentence(events);
      // Event B (1990) is the more recent one, so it should be the subject
      expect(result).toContain("Event B");
      expect(result).toMatch(/^Event B/);
    });
  });

  describe("three events", () => {
    it("says 'more time between A and B' when first gap > last gap", () => {
      // A: 1800, B: 1950, C: 2010 → A-B = 150 years, C-now = 14 years
      const events = [
        makeEvent({ id: 1, name: "Event A", year: 1800 }),
        makeEvent({ id: 2, name: "Event B", year: 1950 }),
        makeEvent({ id: 3, name: "Event C", year: 2010 }),
      ];
      const result = generateSentence(events);
      expect(result).toBe(
        "More time passed between Event A and Event B than between Event C and us."
      );
    });

    it("says 'more time between C and us' when last gap > first gap", () => {
      // A: 2000, B: 2005, C: 2006 → A-B = 5 years, C-now = 18 years
      const events = [
        makeEvent({ id: 1, name: "Event A", year: 2000 }),
        makeEvent({ id: 2, name: "Event B", year: 2005 }),
        makeEvent({ id: 3, name: "Event C", year: 2006 }),
      ];
      const result = generateSentence(events);
      expect(result).toBe(
        "More time passed between Event C and us than between Event A and Event B."
      );
    });

    it("says 'same amount of time' when spans are equal", () => {
      // A: 2000, B: 2012, C: 2012 → A-B = 12 years, C-now = 12 years
      const events = [
        makeEvent({ id: 1, name: "Event A", year: 2000 }),
        makeEvent({ id: 2, name: "Event B", year: 2012 }),
        makeEvent({ id: 3, name: "Event C", year: 2012 }),
      ];
      const result = generateSentence(events);
      expect(result).toBe(
        "The same amount of time passed between Event A and Event B as it did between Event C and us."
      );
    });

    it("sorts three events chronologically", () => {
      const events = [
        makeEvent({ id: 3, name: "Event C", year: 2010 }),
        makeEvent({ id: 1, name: "Event A", year: 1800 }),
        makeEvent({ id: 2, name: "Event B", year: 1950 }),
      ];
      const result = generateSentence(events);
      // A (1800) and B (1950) should be the first pair mentioned
      expect(result).toContain("Event A and Event B");
    });
  });

  it("returns empty string for more than 3 events", () => {
    const events = [
      makeEvent({ id: 1, year: 1900 }),
      makeEvent({ id: 2, year: 1950 }),
      makeEvent({ id: 3, year: 1980 }),
      makeEvent({ id: 4, year: 2000 }),
    ];
    expect(generateSentence(events)).toBe("");
  });
});
