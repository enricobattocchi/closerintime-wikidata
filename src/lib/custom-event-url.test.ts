import { describe, it, expect } from "vitest";
import {
  encodeCustomEvent,
  decodeCustomEvent,
  buildShareablePath,
} from "./custom-event-url";
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

describe("encodeCustomEvent", () => {
  it("encodes a basic event with year only", () => {
    const event = makeEvent({ name: "Moon Landing", year: 1969 });
    expect(encodeCustomEvent(event)).toBe("c:Moon-Landing:1969");
  });

  it("encodes event with month and day", () => {
    const event = makeEvent({ name: "D Day", year: 1944, month: 6, day: 6 });
    expect(encodeCustomEvent(event)).toBe("c:D-Day:1944:6:6");
  });

  it("encodes event with month, day, and plural", () => {
    const event = makeEvent({
      name: "The Beatles",
      year: 1960,
      month: 8,
      day: 17,
      plural: 1,
    });
    expect(encodeCustomEvent(event)).toBe("c:The-Beatles:1960:8:17:p");
  });

  it("encodes event with plural but no month/day", () => {
    const event = makeEvent({ name: "Vikings", year: 800, plural: 1 });
    expect(encodeCustomEvent(event)).toBe("c:Vikings:800:::p");
  });

  it("URI-encodes special characters in name", () => {
    const event = makeEvent({ name: "Rock & Roll", year: 1955 });
    const encoded = encodeCustomEvent(event);
    expect(encoded).toContain("Rock-");
    expect(encoded).toContain("%26");
  });

  it("handles negative years (B.C.)", () => {
    const event = makeEvent({ name: "Rome Founded", year: -753 });
    expect(encodeCustomEvent(event)).toBe("c:Rome-Founded:-753");
  });
});

describe("decodeCustomEvent", () => {
  it("decodes a basic custom event segment", () => {
    const result = decodeCustomEvent("c:Moon-Landing:1969", 0);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Moon Landing");
    expect(result!.year).toBe(1969);
    expect(result!.month).toBeNull();
    expect(result!.day).toBeNull();
    expect(result!.plural).toBe(0);
  });

  it("decodes event with month and day", () => {
    const result = decodeCustomEvent("c:D-Day:1944:6:6", 0);
    expect(result).not.toBeNull();
    expect(result!.month).toBe(6);
    expect(result!.day).toBe(6);
  });

  it("decodes event with plural flag", () => {
    const result = decodeCustomEvent("c:The-Beatles:1960:8:17:p", 0);
    expect(result).not.toBeNull();
    expect(result!.plural).toBe(1);
  });

  it("assigns negative IDs based on index", () => {
    const r0 = decodeCustomEvent("c:A:2000", 0);
    const r1 = decodeCustomEvent("c:B:2001", 1);
    expect(r0!.id).toBe(-1000);
    expect(r1!.id).toBe(-1001);
  });

  it("returns null for non-custom segments", () => {
    expect(decodeCustomEvent("123", 0)).toBeNull();
    expect(decodeCustomEvent("hello", 0)).toBeNull();
  });

  it("returns null for invalid format (no year)", () => {
    expect(decodeCustomEvent("c:Name", 0)).toBeNull();
  });

  it("returns null for non-numeric year", () => {
    expect(decodeCustomEvent("c:Name:abc", 0)).toBeNull();
  });

  it("sets type to 'personal'", () => {
    const result = decodeCustomEvent("c:Test:2000", 0);
    expect(result!.type).toBe("personal");
  });

  it("roundtrips with encodeCustomEvent", () => {
    const event = makeEvent({ name: "Test Event", year: 1999, month: 3, day: 15 });
    const encoded = encodeCustomEvent(event);
    const decoded = decodeCustomEvent(encoded, 0);
    expect(decoded!.name).toBe("Test Event");
    expect(decoded!.year).toBe(1999);
    expect(decoded!.month).toBe(3);
    expect(decoded!.day).toBe(15);
  });
});

describe("buildShareablePath", () => {
  it("builds path with server events sorted by ID", () => {
    const events = [makeEvent({ id: 42 }), makeEvent({ id: 7 })];
    expect(buildShareablePath(events, [])).toBe("/7/42");
  });

  it("builds path with custom events after server events", () => {
    const server = [makeEvent({ id: 10 })];
    const custom = [makeEvent({ name: "My Event", year: 2000 })];
    const path = buildShareablePath(server, custom);
    expect(path).toBe("/10/c:My-Event:2000");
  });

  it("returns '/' when no events", () => {
    expect(buildShareablePath([], [])).toBe("/");
  });

  it("builds path with only custom events", () => {
    const custom = [makeEvent({ name: "Birth", year: 1990 })];
    expect(buildShareablePath([], custom)).toBe("/c:Birth:1990");
  });

  it("handles multiple custom events", () => {
    const custom = [
      makeEvent({ name: "A", year: 2000 }),
      makeEvent({ name: "B", year: 2010 }),
    ];
    const path = buildShareablePath([], custom);
    expect(path).toBe("/c:A:2000/c:B:2010");
  });
});
