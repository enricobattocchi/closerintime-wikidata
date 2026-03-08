import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { computeTimeline } from "./timeline-math";
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

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(Date.UTC(2024, 0, 1, 12, 0, 0)));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("computeTimeline", () => {
  describe("single event", () => {
    it("returns 2 markers (event + Now) and 1 segment", () => {
      const events = [makeEvent({ year: 2000 })];
      const result = computeTimeline(events);
      expect(result.markers).toHaveLength(2);
      expect(result.segments).toHaveLength(1);
    });

    it("places the event at position 0 and Now at position 100", () => {
      const events = [makeEvent({ year: 2000 })];
      const result = computeTimeline(events);
      expect(result.markers[0].position).toBe(0);
      expect(result.markers[1].position).toBe(100);
      expect(result.markers[1].event.name).toBe("Now");
    });

    it("calculates totalDays as year difference for year-only events", () => {
      const events = [makeEvent({ year: 2000 })];
      const result = computeTimeline(events);
      expect(result.totalDays).toBe(24); // 2024 - 2000 = 24 years
      expect(result.yearsOnly).toBe(true);
    });

    it("segment percentage is 100 for a single event", () => {
      const events = [makeEvent({ year: 2000 })];
      const result = computeTimeline(events);
      expect(result.segments[0].percentage).toBe(100);
    });
  });

  describe("two events", () => {
    it("returns 3 markers and 2 segments", () => {
      const events = [
        makeEvent({ id: 1, year: 1900 }),
        makeEvent({ id: 2, year: 2000 }),
      ];
      const result = computeTimeline(events);
      expect(result.markers).toHaveLength(3);
      expect(result.segments).toHaveLength(2);
    });

    it("sorts events chronologically", () => {
      const events = [
        makeEvent({ id: 2, name: "Later", year: 2000 }),
        makeEvent({ id: 1, name: "Earlier", year: 1900 }),
      ];
      const result = computeTimeline(events);
      expect(result.markers[0].event.name).toBe("Earlier");
      expect(result.markers[1].event.name).toBe("Later");
    });

    it("calculates proportional segments", () => {
      // 1900 to 2000 = 100 years, 2000 to 2024 = 24 years, total = 124 years
      const events = [
        makeEvent({ id: 1, year: 1900 }),
        makeEvent({ id: 2, year: 2000 }),
      ];
      const result = computeTimeline(events);
      const seg1Pct = result.segments[0].percentage;
      const seg2Pct = result.segments[1].percentage;

      // Segments should sum to 100%
      expect(seg1Pct + seg2Pct).toBeCloseTo(100, 5);

      // First segment (100/124) should be larger than second (24/124)
      expect(seg1Pct).toBeGreaterThan(seg2Pct);
      expect(seg1Pct).toBeCloseTo((100 / 124) * 100, 1);
    });

    it("calculates proportional marker positions", () => {
      const events = [
        makeEvent({ id: 1, year: 1900 }),
        makeEvent({ id: 2, year: 2000 }),
      ];
      const result = computeTimeline(events);
      expect(result.markers[0].position).toBe(0); // oldest
      expect(result.markers[1].position).toBeCloseTo((100 / 124) * 100, 1);
      expect(result.markers[2].position).toBe(100); // Now
    });
  });

  describe("three events", () => {
    it("returns 4 markers and 3 segments", () => {
      const events = [
        makeEvent({ id: 1, year: 1800 }),
        makeEvent({ id: 2, year: 1900 }),
        makeEvent({ id: 3, year: 2000 }),
      ];
      const result = computeTimeline(events);
      expect(result.markers).toHaveLength(4);
      expect(result.segments).toHaveLength(3);
    });

    it("segment percentages sum to 100", () => {
      const events = [
        makeEvent({ id: 1, year: 1800 }),
        makeEvent({ id: 2, year: 1900 }),
        makeEvent({ id: 3, year: 2000 }),
      ];
      const result = computeTimeline(events);
      const sum = result.segments.reduce((s, seg) => s + seg.percentage, 0);
      expect(sum).toBeCloseTo(100, 5);
    });
  });

  describe("yearsOnly flag", () => {
    it("is true when any event lacks month/day", () => {
      const events = [
        makeEvent({ id: 1, year: 2000, month: 6, day: 15 }),
        makeEvent({ id: 2, year: 2010 }), // no month/day
      ];
      const result = computeTimeline(events);
      expect(result.yearsOnly).toBe(true);
    });

    it("is false when all events have month and day", () => {
      const events = [
        makeEvent({ id: 1, year: 2000, month: 6, day: 15 }),
        makeEvent({ id: 2, year: 2010, month: 3, day: 1 }),
      ];
      const result = computeTimeline(events);
      expect(result.yearsOnly).toBe(false);
    });
  });

  describe("segment labels", () => {
    it("sets startLabel only on first segment", () => {
      const events = [
        makeEvent({ id: 1, year: 1900 }),
        makeEvent({ id: 2, year: 2000 }),
      ];
      const result = computeTimeline(events);
      expect(result.segments[0].startLabel).not.toBe("");
      expect(result.segments[1].startLabel).toBe("");
    });

    it("sets endLabel only on last segment", () => {
      const events = [
        makeEvent({ id: 1, year: 1900 }),
        makeEvent({ id: 2, year: 2000 }),
      ];
      const result = computeTimeline(events);
      expect(result.segments[0].endLabel).toBe("");
      expect(result.segments[1].endLabel).not.toBe("");
    });

    it("sets order and total correctly", () => {
      const events = [
        makeEvent({ id: 1, year: 1800 }),
        makeEvent({ id: 2, year: 1900 }),
        makeEvent({ id: 3, year: 2000 }),
      ];
      const result = computeTimeline(events);
      expect(result.segments.map((s) => s.order)).toEqual([0, 1, 2]);
      expect(result.segments.every((s) => s.total === 3)).toBe(true);
    });
  });

  describe("timespanFormat", () => {
    it("uses precise format by default (format 2)", () => {
      const events = [makeEvent({ id: 1, year: 2000, month: 6, day: 15 })];
      const result = computeTimeline(events);
      // Precise format includes months/days
      expect(result.segments[0].spanLabel).toContain("years");
    });

    it("uses years-only format when requested (format 1)", () => {
      const events = [makeEvent({ id: 1, year: 2000, month: 6, day: 15 })];
      const result = computeTimeline(events, 1);
      // Should just be "X years"
      expect(result.segments[0].spanLabel).toMatch(/^\d+ years?$/);
    });
  });
});
