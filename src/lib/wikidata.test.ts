import { describe, it, expect } from "vitest";
import { bestClaim, type WikidataClaim } from "./wikidata";

function makeClaim(time: string, rank?: "preferred" | "normal" | "deprecated"): WikidataClaim {
  return {
    mainsnak: {
      datavalue: {
        value: { time },
        type: "time",
      },
    },
    rank,
  };
}

describe("bestClaim", () => {
  it("returns the preferred claim over normal ones", () => {
    const claims = [
      makeClaim("+2026-02-15T00:00:00Z", "normal"),
      makeClaim("+2026-04-01T00:00:00Z", "preferred"),
    ];
    const result = bestClaim(claims);
    expect((result!.mainsnak.datavalue!.value as { time: string }).time).toBe("+2026-04-01T00:00:00Z");
  });

  it("skips deprecated claims", () => {
    const claims = [
      makeClaim("+2026-02-15T00:00:00Z", "deprecated"),
      makeClaim("+2026-04-01T00:00:00Z", "normal"),
    ];
    const result = bestClaim(claims);
    expect((result!.mainsnak.datavalue!.value as { time: string }).time).toBe("+2026-04-01T00:00:00Z");
  });

  it("returns null when all claims are deprecated", () => {
    const claims = [
      makeClaim("+2026-02-15T00:00:00Z", "deprecated"),
      makeClaim("+2025-11-01T00:00:00Z", "deprecated"),
    ];
    expect(bestClaim(claims)).toBeNull();
  });

  it("returns the first normal claim when no preferred exists", () => {
    const claims = [
      makeClaim("+2020-01-01T00:00:00Z", "normal"),
      makeClaim("+2021-06-15T00:00:00Z", "normal"),
    ];
    const result = bestClaim(claims);
    expect((result!.mainsnak.datavalue!.value as { time: string }).time).toBe("+2020-01-01T00:00:00Z");
  });

  it("handles claims without an explicit rank (treats as non-deprecated)", () => {
    const claims = [
      makeClaim("+1969-07-20T00:00:00Z"),
    ];
    const result = bestClaim(claims);
    expect((result!.mainsnak.datavalue!.value as { time: string }).time).toBe("+1969-07-20T00:00:00Z");
  });

  it("prefers preferred over claims with no rank", () => {
    const claims = [
      makeClaim("+2020-01-01T00:00:00Z"),
      makeClaim("+2026-04-01T00:00:00Z", "preferred"),
    ];
    const result = bestClaim(claims);
    expect((result!.mainsnak.datavalue!.value as { time: string }).time).toBe("+2026-04-01T00:00:00Z");
  });
});
